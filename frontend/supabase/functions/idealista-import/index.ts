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

async function getIdealistaToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
  const authB64 = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(`${baseUrl}/oauth/token`, {
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
  return data.access_token;
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

    // ── ACTION: FETCH (get all properties from Idealista) ──────────────────
    if (action === "fetch") {
      const accessToken = await getIdealistaToken(clientId, clientSecret, baseUrl);

      const allProperties: any[] = [];
      let page = 1;
      const pageSize = 100;

      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      while (true) {
        if (page > 1) {
          await delay(500); // 500ms delay between pages to prevent rate limits
        }

        const url = `${baseUrl}/v1/properties?page=${page}&size=${pageSize}`;
        console.log(`[Import] Fetching page ${page} from ${url}`);

        let res = await fetch(url, {
          headers: {
            "feedKey": feedKey,
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        // Retry once on 429 Rate Limit
        if (res.status === 429) {
          console.warn(`[Import] Rate limit hit on page ${page}. Waiting 2000ms before retrying once...`);
          await delay(2000);
          res = await fetch(url, {
            headers: {
              "feedKey": feedKey,
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });
        }

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Import] Error fetching page ${page}: ${errText}`);
          // If it's a 404 or empty, stop paginating
          if (res.status === 404 || res.status === 400) break;
          
          if (res.status === 429) {
            console.warn(`[Import] Rate limit hit again on page ${page}. Stop paginating and returning fetched data.`);
            if (allProperties.length > 0) {
              break;
            } else {
              throw new Error("El servidor de Idealista está temporalmente saturado (Límite de peticiones superado). Por favor, inténtalo de nuevo en unos segundos.");
            }
          }
          throw new Error(`Idealista API error (page ${page}): ${errText}`);
        }

        const data = await res.json();
        const items = data.properties || data.items || data || [];

        if (!Array.isArray(items) || items.length === 0) break;

        allProperties.push(...items);

        // If we got fewer than pageSize, we've reached the end
        if (items.length < pageSize) break;
        page++;
      }

      console.log(`[Import] Total properties fetched from Idealista: ${allProperties.length}`);

      // Normalize: extract propertyId, code/reference, type, status
      const normalized = allProperties.map((p: any) => ({
        idealista_id: String(p.propertyId || p.id || ""),
        code: String(p.code || p.reference || ""),
        type: p.type || "",
        status: p.status || "",
        address: p.address
          ? [p.address.streetName, p.address.streetNumber, p.address.town].filter(Boolean).join(", ")
          : "",
        price: p.operation?.price || null,
      }));

      // Also fetch all CRM properties for matching
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

    // ── ACTION: SAVE (persist the confirmed matches to DB) ─────────────────
    if (action === "save") {
      const { mappings } = body as {
        mappings: Array<{ crm_id: string; idealista_id: string; status?: string }>;
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
        
        const normStatus = String(mapping.status || "").toLowerCase().trim();
        const isActive = normStatus === "active" || normStatus === "published" || normStatus === "activa" || normStatus === "activo";

        const { error } = await supabase
          .from("properties")
          .update({
            idealista_id: mapping.idealista_id,
            idealista_status: isActive ? "published" : "not_published",
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
