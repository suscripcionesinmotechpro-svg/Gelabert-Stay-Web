import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IdealistaToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with exponential backoff retries on 429 and 5xx errors.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 4,
  initialDelayMs = 2000
): Promise<Response> {
  let delayMs = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
      const bodyText = await res.text().catch(() => "");
      console.warn(
        `[Retry] HTTP ${res.status} on ${url}. Attempt ${attempt}/${maxRetries}. Waiting ${delayMs}ms. Body: ${bodyText}`
      );
      if (attempt === maxRetries) {
        // Return a synthetic error response on final failure
        return new Response(
          JSON.stringify({ message: `HTTP ${res.status} after ${maxRetries} attempts`, body: bodyText }),
          { status: res.status }
        );
      }
      await delay(delayMs);
      delayMs = Math.min(delayMs * 2, 15000); // cap at 15s
      continue;
    }
    return res;
  }
  // Should never reach here but TypeScript requires a return
  return fetch(url, options);
}

async function getIdealistaToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
  const authB64 = btoa(`${clientId}:${clientSecret}`);
  const tokenUrl = `${baseUrl}/oauth/token`;
  console.log(`[Auth] Requesting token from ${tokenUrl}`);
  const response = await fetchWithRetry(tokenUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authB64}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Auth failed: ${err}`);
  }
  const data = await response.json() as IdealistaToken;
  console.log(`[Auth] Token acquired successfully`);
  return data.access_token;
}

/**
 * Determines whether an Idealista property status string means "active/published".
 * Idealista can return: "active", "inactive", "deactivated", "activating",
 * "suspended", etc. (values may vary between sandbox and production).
 */
function isIdealistaActive(status: string): boolean {
  const s = String(status || "").toLowerCase().trim();
  if (s.includes("deactiv") || s.includes("inactiv")) {
    return false;
  }
  return s.includes("activ") || s === "published" || s === "publicado" || s === "publicada";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "fetch"; // "fetch" | "save"

    const clientId     = Deno.env.get("IDEALISTA_CLIENT_ID")     || "gelaberthomes";
    const clientSecret = Deno.env.get("IDEALISTA_CLIENT_SECRET")  || "27wVeitXmlEZZn8iMLdzq0moIKe9cjU3";
    const feedKey      = Deno.env.get("IDEALISTA_FEED_KEY")       || "ilc9cd3e42a7951c00db203bd70276774f880278531";
    const baseUrl      = Deno.env.get("IDEALISTA_API_URL")        || "https://partners-sandbox.idealista.com";

    const supabaseUrl        = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase           = createClient(supabaseUrl, supabaseServiceKey);

    // ── ACTION: FETCH ──────────────────────────────────────────────────────────
    if (action === "fetch") {
      const accessToken = await getIdealistaToken(clientId, clientSecret, baseUrl);

      // Small delay after token request before first API call
      await delay(800);

      const allProperties: any[] = [];
      let page = 1;
      const pageSize = 100;

      while (true) {
        if (page > 1) {
          await delay(600); // delay between pages
        }

        const url = `${baseUrl}/v1/properties?page=${page}&size=${pageSize}`;
        console.log(`[Fetch] Page ${page} → ${url}`);

        const res = await fetchWithRetry(url, {
          headers: {
            "feedKey": feedKey,
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.error(`[Fetch] Error on page ${page} (HTTP ${res.status}): ${errText}`);

          if (res.status === 404 || res.status === 400) break;

          if (res.status === 429) {
            if (allProperties.length > 0) {
              console.warn("[Fetch] Rate limit, stopping pagination with partial data.");
              break;
            }
            throw new Error(
              "El servidor de Idealista está temporalmente saturado (Límite de peticiones superado). Por favor, espera unos segundos y vuelve a intentarlo."
            );
          }

          throw new Error(`Idealista API error (page ${page}): ${errText}`);
        }

        const data = await res.json();

        // Debug: log raw status values on the first page so we can see what Idealista returns
        if (page === 1 && Array.isArray(data.properties || data.items || data)) {
          const items = data.properties || data.items || data;
          const sampleStatuses = (items as any[])
            .slice(0, 5)
            .map((p: any) => ({ id: p.propertyId || p.id, status: p.status, code: p.code }));
          console.log("[Fetch] Sample statuses from Idealista:", JSON.stringify(sampleStatuses));
        }

        const items: any[] = data.properties || data.items || data || [];
        if (!Array.isArray(items) || items.length === 0) break;

        allProperties.push(...items);

        if (items.length < pageSize) break; // last page
        page++;
      }

      console.log(`[Fetch] Total properties fetched: ${allProperties.length}`);

      // Normalize properties
      const normalized = allProperties.map((p: any) => ({
        idealista_id: String(p.propertyId || p.id || ""),
        code: String(p.code || p.reference || ""),
        type: p.type || "",
        status: p.status || p.state || "",
        is_active: isIdealistaActive(p.status || p.state || ""),
        address: p.address
          ? [p.address.streetName, p.address.streetNumber, p.address.town].filter(Boolean).join(", ")
          : "",
        price: p.operation?.price || null,
      }));

      // Fetch CRM properties for matching
      const { data: crmProperties, error: crmErr } = await supabase
        .from("properties")
        .select("id, title, reference, idealista_id, idealista_status, property_type, city, price, main_image")
        .order("created_at", { ascending: false });

      if (crmErr) throw crmErr;

      // Auto-match by reference code
      const matches = normalized.map((idealistaP) => {
        const matched = crmProperties?.find(
          (crm) =>
            crm.reference &&
            idealistaP.code &&
            (crm.reference.toUpperCase().trim() === idealistaP.code.toUpperCase().trim() ||
              crm.reference.replace(/-/g, "").toUpperCase() === idealistaP.code.replace(/-/g, "").toUpperCase())
        );
        return {
          idealista: idealistaP,
          crm: matched || null,
          auto_matched: !!matched,
        };
      });

      console.log(
        `[Fetch] Matches: ${matches.filter((m) => m.auto_matched).length} auto-matched, ` +
        `${matches.filter((m) => !m.auto_matched).length} unmatched`
      );

      return new Response(
        JSON.stringify({
          success: true,
          idealista_count: normalized.length,
          crm_count: crmProperties?.length || 0,
          matches,
          crm_properties: crmProperties,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: SAVE ───────────────────────────────────────────────────────────
    if (action === "save") {
      const { mappings } = body as {
        mappings: Array<{ crm_id: string; idealista_id: string; status?: string; is_active?: boolean }>;
      };

      if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
        return new Response(JSON.stringify({ error: "No mappings provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let saved = 0;
      const errors: string[] = [];

      for (const mapping of mappings) {
        if (!mapping.crm_id || !mapping.idealista_id) continue;

        // Use is_active flag (preferred) or fall back to status string
        const active = mapping.is_active === true || 
          (mapping.is_active === undefined && isIdealistaActive(mapping.status || ""));

        console.log(
          `[Save] CRM ${mapping.crm_id} → Idealista ${mapping.idealista_id} | ` +
          `raw_status="${mapping.status}" is_active=${active} → DB status="${active ? "published" : "not_published"}"`
        );

        const { error } = await supabase
          .from("properties")
          .update({
            idealista_id: mapping.idealista_id,
            idealista_status: active ? "published" : "not_published",
            idealista_last_sync: new Date().toISOString(),
          })
          .eq("id", mapping.crm_id);

        if (error) {
          errors.push(`${mapping.crm_id}: ${error.message}`);
        } else {
          saved++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, saved, errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[idealista-import crash]", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
