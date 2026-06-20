import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks if a parsed JSON body from Idealista contains a body-level rate-limit error.
 * Idealista sometimes returns HTTP 200 with {"success":false,"message":"Ratelimit: Too Many Requests"}
 * instead of a proper HTTP 429.
 */
function isBodyRateLimit(body: any): boolean {
  if (!body || typeof body !== 'object') return false;
  if (body.success === false && typeof body.message === 'string') {
    const msg = body.message.toLowerCase();
    return msg.includes('ratelimit') || msg.includes('rate limit') || msg.includes('too many requests');
  }
  return false;
}

/**
 * Smart Idealista fetch that handles:
 * 1. HTTP 429 / 5xx → retry with exponential backoff
 * 2. HTTP 200 with {success:false, message:"Ratelimit:..."} → retry with exponential backoff
 * Returns { ok, status, body } where body is the already-parsed JSON (or null).
 */
async function idealistaFetch(
  url: string,
  options: RequestInit,
  maxRetries = 5,
  initialDelayMs = 2000
): Promise<{ ok: boolean; status: number; body: any; rawText: string }> {
  let delayMs = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, options);
    } catch (err) {
      console.warn(`[idealistaFetch] Network error on ${url} attempt ${attempt}/${maxRetries}: ${err}. Waiting ${delayMs}ms...`);
      if (attempt === maxRetries) throw err;
      await delay(delayMs);
      delayMs = Math.min(delayMs * 2, 20000);
      continue;
    }

    // HTTP-level rate limit or server error → retry
    if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
      const txt = await res.text().catch(() => '');
      console.warn(`[idealistaFetch] HTTP ${res.status} on ${url} attempt ${attempt}/${maxRetries}. Waiting ${delayMs}ms. Body: ${txt}`);
      if (attempt === maxRetries) return { ok: false, status: res.status, body: null, rawText: txt };
      await delay(delayMs);
      delayMs = Math.min(delayMs * 2, 20000);
      continue;
    }

    // Parse body
    const rawText = await res.text().catch(() => '');
    let body: any = null;
    try { body = rawText ? JSON.parse(rawText) : null; } catch { body = null; }

    // Body-level rate limit (HTTP 200 but Idealista signals rate limit in JSON)
    if (isBodyRateLimit(body)) {
      console.warn(`[idealistaFetch] Body-level rate limit on ${url} attempt ${attempt}/${maxRetries}. Waiting ${delayMs}ms. Body: ${rawText}`);
      if (attempt === maxRetries) return { ok: false, status: 429, body, rawText };
      await delay(delayMs);
      delayMs = Math.min(delayMs * 2, 20000);
      continue;
    }

    return { ok: res.ok, status: res.status, body, rawText };
  }
  // Should never reach here
  return { ok: false, status: 0, body: null, rawText: 'Max retries exceeded' };
}

// Legacy wrapper kept for internal use with non-JSON endpoints (e.g. OAuth token)
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 4,
  delayMs = 2000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
        console.warn(`[fetchWithRetry] HTTP ${response.status} on ${url}. Attempt ${i + 1}/${retries}. Waiting ${delayMs}ms...`);
        if (i + 1 === retries) return response;
        await delay(delayMs);
        delayMs = Math.min(delayMs * 2, 20000);
        continue;
      }
      return response;
    } catch (err) {
      console.warn(`[fetchWithRetry] Network error on ${url}: ${err}. Attempt ${i + 1}/${retries}. Waiting ${delayMs}ms...`);
      if (i + 1 === retries) throw err;
      await delay(delayMs);
      delayMs = Math.min(delayMs * 2, 20000);
    }
  }
  return fetch(url, options);
}

// Interface for Idealista OAuth2 token response
interface IdealistaToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// ── GET OAUTH2 TOKEN ──────────────────────────────────────────────────────────
async function getIdealistaToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
  const authStr = `${clientId}:${clientSecret}`;
  // Deno/Deno base64 encoding
  const authB64 = btoa(authStr);
  
  const tokenUrl = `${baseUrl}/oauth/token`;
  console.log(`[OAuth] Requesting token from: ${tokenUrl}`);
  
  const response = await fetchWithRetry(tokenUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authB64}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[OAuth Error] Status: ${response.status}. Body: ${errText}`);
    throw new Error(`Auth failed with Idealista: ${errText}`);
  }

  const tokenData = await response.json() as IdealistaToken;
  return tokenData.access_token;
}

// ── FIND OR CREATE CONTACT ───────────────────────────────────────────────────
async function getIdealistaContactId(accessToken: string, feedKey: string, baseUrl: string): Promise<number> {
  try {
    const contactsUrl = `${baseUrl}/v1/contacts?page=1&size=100`;
    console.log(`[Contact] Querying existing contacts from: ${contactsUrl}`);
    
    const headers: Record<string, string> = {
      "feedKey": feedKey,
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };

    // Step 1: Try to find an existing contact (with body-level rate limit detection)
    try {
      const { ok, body } = await idealistaFetch(contactsUrl, { headers });
      if (ok && body) {
        const existing = body.contacts?.find(
          (c: any) => c.email && c.email.toLowerCase() === "info@gelaberthomes.es"
        );
        if (existing) {
          console.log(`[Contact] Found existing contact ID: ${existing.contactId}`);
          return Number(existing.contactId);
        }
        console.log(`[Contact] No existing contact found with info@gelaberthomes.es. Will create one.`);
      } else {
        console.warn(`[Contact] Could not fetch contact list (ok=${ok}), will attempt creation.`);
      }
    } catch (err) {
      console.warn("[Contact] Error fetching contacts list:", err);
    }

    // Step 2: Create contact – add extra delay before creation to avoid rate limit
    await delay(1500);
    const createUrl = `${baseUrl}/v1/contacts`;
    console.log(`[Contact] Creating new contact at: ${createUrl}`);
    
    const contactPayload = {
      name: "José Carlos",
      lastName: "Delgado",
      email: "info@gelaberthomes.es",
      primaryPhonePrefix: "34",
      primaryPhoneNumber: "611898827"
    };

    const { ok, status, body, rawText } = await idealistaFetch(createUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(contactPayload)
    });

    if (!ok) {
      console.error(`[Contact Error] Create failed (HTTP ${status}): ${rawText}`);
      throw new Error(`Failed to create contact in Idealista: ${rawText}`);
    }

    // Sometimes the API returns {success:false} even on HTTP 200 after retries
    if (body && body.success === false) {
      console.error(`[Contact Error] API returned success:false: ${rawText}`);
      throw new Error(`Failed to create contact in Idealista: ${rawText}`);
    }

    const contactId = body?.contactId ?? body?.id;
    console.log(`[Contact] Contact created successfully. ID: ${contactId}`);
    return Number(contactId);

  } catch (err: any) {
    console.error(`[Contact Error] getIdealistaContactId failed: ${err.message}`);
    if (baseUrl.includes("sandbox")) {
      console.warn(`[Contact Warning] Sandbox environment detected. Falling back to contact ID 4429.`);
      return 4429;
    }
    throw err;
  }
}

// ── Watermark helper functions for Idealista ──
async function createLabeledImageBuffer(imageUrl: string, label: string): Promise<Uint8Array | null> {
  try {
    const { Image } = await import('https://deno.land/x/imagescript@1.2.15/mod.ts')
    
    // Download the source image
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const buf = new Uint8Array(await res.arrayBuffer())
    
    const img = await Image.decode(buf)
    
    // OG resolution standard (1200x630)
    const targetW = 1200
    const targetH = 630
    const resized = img.resize(targetW, targetH)
    
    // Rectangular badge at bottom-left corner with high-contrast borders
    const normalizedLabel = label.toUpperCase().trim()
    const fontSize = 22

    // Calculate precise badge width based on character widths to look perfectly balanced
    let textWidth = 0
    for (const char of normalizedLabel) {
      if (['I', '1', '.', ' ', '·', '-', '/'].includes(char)) {
        textWidth += fontSize * 0.38
      } else if (['M', 'W', 'O', 'Q', '0', '€'].includes(char)) {
        textWidth += fontSize * 0.82
      } else {
        textWidth += fontSize * 0.62
      }
    }

    const badgeW = Math.round(textWidth) + 32 // 16px padding on each side
    const badgeH = 50
    const paddingX = 30
    const paddingY = targetH - badgeH - 30 // 30px from bottom of the image
    
    const blackColor = Image.rgbaToColor(0, 0, 0, 255) // solid black for background
    const whiteColor = Image.rgbaToColor(255, 255, 255, 255) // solid white for text and border
    
    // Draw badge background (solid black) with a 2px solid white border for maximum contrast
    for (let y = paddingY; y < paddingY + badgeH; y++) {
      for (let x = paddingX; x < paddingX + badgeW; x++) {
        const isBorder = (y < paddingY + 2) || (y >= paddingY + badgeH - 2) || 
                         (x < paddingX + 2) || (x >= paddingX + badgeW - 2)
        if (isBorder) {
          resized.setPixelAt(x + 1, y + 1, whiteColor)
        } else {
          resized.setPixelAt(x + 1, y + 1, blackColor)
        }
      }
    }
    
    // Draw text inside badge (with 1px horizontal offset to simulate a bold font)
    const textX = paddingX + 16
    const textY = paddingY + Math.round(badgeH / 2 - fontSize / 2)

    await resized.drawText(normalizedLabel, {
      x: textX,
      y: textY,
      size: fontSize,
      color: whiteColor,
    }).catch(() => {})

    await resized.drawText(normalizedLabel, {
      x: textX + 1,
      y: textY,
      size: fontSize,
      color: whiteColor,
    }).catch(() => {})
    
    return await resized.encode(1) // JPEG
  } catch (err) {
    console.error('Labeling watermark error:', err)
    return null
  }
}

function getLabelForImage(prop: any, imageUrl: string): { label: string | null } {
  const cleanUrl = imageUrl.trim().split('?')[0];

  // 1. Check if it's a room image
  if (prop.rooms && Array.isArray(prop.rooms)) {
    for (let roomIdx = 0; roomIdx < prop.rooms.length; roomIdx++) {
      const room = prop.rooms[roomIdx];
      const roomImages = Array.isArray(room.images) ? room.images : [];
      if (roomImages.some((img: string) => img && img.trim().split('?')[0] === cleanUrl)) {
        const roomNumber = roomIdx + 1;
        const roomLabel = (room.name && room.name.trim()) ? room.name.trim() : `HAB. ${roomNumber}`;
        const priceLabel = room.price ? ` - ${Math.round(room.price)}€` : '';
        return { label: `${roomLabel}${priceLabel}` };
      }
    }
  }

  // 2. Check if it's a common area image
  if (prop.common_areas && Array.isArray(prop.common_areas)) {
    for (const area of prop.common_areas) {
      const areaImages = Array.isArray(area.images) ? area.images : [];
      if (areaImages.some((img: string) => img && img.trim().split('?')[0] === cleanUrl)) {
        let label = 'ZONA COMÚN';
        if (area.name && area.name.trim()) {
          label = `Z. COMÚN: ${area.name.trim()}`;
        } else if (area.type) {
          label = `ZONA COMÚN: ${area.type.toUpperCase()}`;
        }
        return { label };
      }
    }
  }

  // 3. Check if property itself is of type 'habitacion' (individual room)
  if (prop.property_type === 'habitacion') {
    const priceLabel = prop.price ? ` - ${Math.round(prop.price)}€` : '';
    return { label: `HABITACIÓN${priceLabel}` };
  }

  return { label: null };
}

async function processAndWatermarkImage(
  prop: any,
  pid: string,
  supabase: any,
  imageUrl: string
): Promise<string> {
  const cleanUrl = imageUrl.trim().split('?')[0];

  const labelInfo = getLabelForImage(prop, cleanUrl);
  if (labelInfo && labelInfo.label) {
    console.log(`[Media Sync] Applying corner label "${labelInfo.label}" to: ${cleanUrl}`);
    const labeledBuffer = await createLabeledImageBuffer(cleanUrl, labelInfo.label);
    if (labeledBuffer) {
      const labelFileName = `labeled_images/${pid}_lbl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('properties')
        .upload(labelFileName, labeledBuffer, { contentType: 'image/jpeg', upsert: true });
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('properties').getPublicUrl(labelFileName);
        return urlData.publicUrl;
      }
    }
  }

  return cleanUrl;
}

// ── SYNCHRONIZE IMAGES ────────────────────────────────────────────────────────
async function syncPropertyImages(
  accessToken: string,
  feedKey: string,
  idealistaId: string,
  imagesList: string[],
  baseUrl: string
): Promise<void> {
  const imagesUrl = `${baseUrl}/v1/properties/${idealistaId}/images`;
  console.log(`[Images] Syncing ${imagesList.length} images to property ${idealistaId}`);
  
  const headers = {
    "feedKey": feedKey,
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };

  // Map image URLs to Idealista format
  // The first image in our list is the main image ("gateway" or "living" or "unknown" label)
  const mappedImages = imagesList.map((url, idx) => {
    return {
      url: url,
      label: idx === 0 ? "gateway" : "unknown" // First is gateway (cover)
    };
  });

  const payload = {
    images: mappedImages
  };

  const { ok: imgOk, status: imgStatus, rawText: imgRaw } = await idealistaFetch(imagesUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload)
  });

  if (!imgOk) {
    console.error(`[Images Error] Sync failed (HTTP ${imgStatus}): ${imgRaw}`);
    throw new Error(`Failed to sync images to Idealista: ${imgRaw}`);
  }

  console.log(`[Images] Mapped and synchronized all images successfully for Idealista property ${idealistaId}`);
}

// ── MAIN SERVER HANDLER ───────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let propertyId: string | null = null;
  let action = "publish";

  try {
    try {
      const body = await req.json();
      propertyId = body?.propertyId || null;
      action = body?.action || "publish";
    } catch (e) {
      console.error("[Request Parse Error] Failed to parse request JSON:", e);
    }

    if (!propertyId) {
      return new Response(JSON.stringify({ error: "Missing propertyId in body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase Client with admin role to read and modify database
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Idealista configuration from env
    const clientId = Deno.env.get("IDEALISTA_CLIENT_ID") || "gelaberthomes";
    const clientSecret = Deno.env.get("IDEALISTA_CLIENT_SECRET") || "27wVeitXmlEZZn8iMLdzq0moIKe9cjU3";
    const feedKey = Deno.env.get("IDEALISTA_FEED_KEY") || "ilc9cd3e42a7951c00db203bd70276774f880278531";
    // We default to sandbox URL
    const baseUrl = Deno.env.get("IDEALISTA_API_URL") || "https://partners-sandbox.idealista.com";

    console.log(`[Idealista Edge Function] Action: ${action}, Property ID: ${propertyId}`);

    // Fetch the property from database
    const { data: property, error: dbError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .maybeSingle();

    if (dbError) throw dbError;
    if (!property) {
      return new Response(JSON.stringify({ error: `Property with ID ${propertyId} not found` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ACTION: DEACTIVATE
    // ──────────────────────────────────────────────────────────────────────────
    if (action === "deactivate") {
      if (!property.idealista_id) {
        // Already deactivated on our side / not published
        return new Response(JSON.stringify({ success: true, message: "Property already deactivated (no Idealista ID)" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`[Deactivate] Deactivating property ${propertyId} with Idealista ID: ${property.idealista_id}`);
      
      // Get OAuth Token
      const accessToken = await getIdealistaToken(clientId, clientSecret, baseUrl);
      await delay(800); // Proactive delay to avoid rate limiting
      
      const deactivateUrl = `${baseUrl}/v1/properties/${property.idealista_id}/deactivate`;
      const { ok: deactivateOk, status: deactivateStatus, rawText: deactivateRaw } = await idealistaFetch(deactivateUrl, {
        method: "POST",
        headers: {
          "feedKey": feedKey,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!deactivateOk && deactivateStatus !== 404) {
        console.error(`[Deactivate Error] Failed to deactivate on Idealista: ${deactivateRaw}`);
        throw new Error(`Idealista deactivation failed: ${deactivateRaw}`);
      }

      // Update local database status
      await supabase
        .from("properties")
        .update({
          idealista_status: "not_published",
          idealista_last_sync: new Date().toISOString(),
          idealista_error_log: null
        })
        .eq("id", propertyId);

      return new Response(JSON.stringify({ success: true, message: "Property deactivated successfully on Idealista" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ACTION: PUBLISH
    // ──────────────────────────────────────────────────────────────────────────
    // Block Obra Nueva from automated real-time publishing
    if (property.property_type === "edificio" || property.property_type === "garaje" || property.property_type === "trastero") {
      // These types are either unsupported in standard simple API or need separate structures
      // Let's set error status
      const errMsg = `El tipo de inmueble "${property.property_type}" no está soportado para publicación directa en tiempo real por Idealista.`;
      await supabase
        .from("properties")
        .update({
          idealista_status: "error",
          idealista_error_log: errMsg,
          idealista_last_sync: new Date().toISOString()
        })
        .eq("id", propertyId);
      return new Response(JSON.stringify({ success: false, error: errMsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get OAuth Token
    const accessToken = await getIdealistaToken(clientId, clientSecret, baseUrl);

    // Get Contact ID
    const contactId = await getIdealistaContactId(accessToken, feedKey, baseUrl);

    // Mapeo del tipo de propiedad
    let mappedType = "flat";
    if (property.property_type === "casa") mappedType = "house";
    else if (property.property_type === "oficina") mappedType = "office";
    else if (property.property_type === "local" || property.property_type === "negocio" || property.property_type === "nave") mappedType = "commercial";
    else if (property.property_type === "terreno") mappedType = "land";
    else if (property.property_type === "habitacion") mappedType = "room";

    const bedroomCount = property.bedrooms ?? 0;
    // En Idealista el tipo "studio" no es un tipo de propiedad válido por sí mismo; se publica como "flat" (piso) con la marca studio: true
    const isStudio = property.property_type === "estudio" || property.property_type === "loft" || (mappedType === "flat" && bedroomCount === 0);
    
    if (isStudio) {
      mappedType = "flat";
    }

    // Mapeo de la dirección
    const streetStr = property.address || "Calle Desconocida";
    const mappedAddress = {
      streetName: streetStr.split(",")[0].trim().substring(0, 199),
      streetNumber: property.street_number || "S/N",
      town: property.city || "Málaga",
      postalCode: property.postal_code || "29001",
      country: "Spain",
      visibility: "street",
      precision: "exact",
      latitude: property.latitude ? Number(property.latitude) : 36.7212,
      longitude: property.longitude ? Number(property.longitude) : -4.4217,
    } as any;

    if (property.floor) {
      // Idealista requires floor level to match patterns, bj, en, ss, st, 1-60
      const parsedFloor = String(property.floor).toLowerCase().trim();
      if (["bj", "bajo", "ground", "0"].includes(parsedFloor)) {
        mappedAddress.floor = "bj";
      } else if (["en", "entreplanta", "mezzanine"].includes(parsedFloor)) {
        mappedAddress.floor = "en";
      } else if (["ss", "semisotano"].includes(parsedFloor)) {
        mappedAddress.floor = "ss";
      } else if (["st", "sotano", "basement"].includes(parsedFloor)) {
        mappedAddress.floor = "st";
      } else {
        const numFloor = parseInt(parsedFloor, 10);
        if (!isNaN(numFloor) && numFloor >= -2 && numFloor <= 60) {
          mappedAddress.floor = String(numFloor);
        }
      }
    }
    if (property.door_number) {
      mappedAddress.door = String(property.door_number).substring(0, 4);
    }
    if (property.block_staircase) {
      mappedAddress.stair = String(property.block_staircase).substring(0, 10);
    }
    if (property.urbanization) {
      mappedAddress.urbanization = String(property.urbanization).substring(0, 50);
    }

    // Mapeo de la operación
    const mappedOperation = {
      type: property.operation === "venta" ? "sale" : "rent",
      price: property.price ? Math.round(property.price) : 500
    };

    // Mapeo de características (Typology features)
    const mappedFeatures: any = {};
    if (mappedType === "flat" || mappedType === "house") {
      mappedFeatures.areaConstructed = property.area_m2 ? Math.round(property.area_m2) : 50;
      mappedFeatures.bathroomNumber = property.bathrooms || 1;
      
      if (isStudio) {
        mappedFeatures.studio = true;
        mappedFeatures.rooms = 0; // Idealista permite 0 habitaciones en estudios
      } else {
        mappedFeatures.rooms = Math.max(1, bedroomCount); // Mínimo 1 para pisos y casas estándar
      }

      mappedFeatures.liftAvailable = property.has_elevator ?? false;
      mappedFeatures.pool = property.has_pool ?? false;
      mappedFeatures.terrace = property.has_terrace ?? false;
      mappedFeatures.balcony = property.has_balcony ?? false;
      mappedFeatures.garden = property.garden ?? false;
      mappedFeatures.storage = property.has_storage ?? false;
      mappedFeatures.wardrobes = property.has_wardrobes ?? false;
      mappedFeatures.conditionedAir = property.air_conditioning ?? false;

      // ── House type classification ──────────────────────────────────────────
      // Para "house", Idealista requiere el campo "type" (cuyo tipo en el esquema es "house type").
      // Valores válidos: andar_moradia, independent, semidetached, terraced, villa
      if (mappedType === "house") {
        const subType = (property.house_type || property.sub_type || '').toLowerCase().trim();
        let houseTypeValue = "independent";
        if (subType.includes('adosad') || subType.includes('townhouse') || subType.includes('town_house') || subType.includes('hilera')) {
          houseTypeValue = "terraced";
        } else if (subType.includes('paread') || subType.includes('semi')) {
          houseTypeValue = "semidetached";
        } else if (subType.includes('villa')) {
          houseTypeValue = "villa";
        }
        mappedFeatures.type = houseTypeValue;
        console.log(`[Features] House type mapped to: ${houseTypeValue} (from subType: "${subType}")`);
      }

      // Energy certification mapping
      const rating = property.energy_rating ? property.energy_rating.toUpperCase().trim() : "exempt";
      const validRatings = ["A", "B", "C", "D", "E", "F", "G", "exempt", "in_process", "unknown"];
      mappedFeatures.energyCertificateRating = validRatings.includes(rating) ? rating : "exempt";

      // Windows location (For flat in Spain)
      if (mappedType === "flat") {
        mappedFeatures.windowsLocation = property.is_exterior ? "external" : "internal";
      }

      // Equipment (furnishing)
      if (property.operation === "alquiler") {
        mappedFeatures.equipment = property.is_furnished ? "equipped_kitchen_and_furnished" : "not_equipped";
      }

      // Conservation state
      // Valid values for Spain: "good", "toRestore", "newConstruction"
      // ("fullyReformed" is NOT allowed for Spain)
      if (property.conservation_state) {
        const cons = property.conservation_state.toLowerCase().trim();
        if (cons.includes("obra nueva") || cons.includes("estrenar") || cons.includes("construcción") || cons.includes("construccion")) {
          mappedFeatures.conservation = "newConstruction";
        } else if (cons.includes("reformar") || cons.includes("ruina")) {
          mappedFeatures.conservation = "toRestore";
        } else {
          // "Reformado", "Buen estado", etc. → good
          mappedFeatures.conservation = "good";
        }
      } else {
        mappedFeatures.conservation = "good";
      }

      // Orientations
      if (property.orientation && Array.isArray(property.orientation)) {
        property.orientation.forEach((o: string) => {
          const norm = o.toLowerCase().trim();
          if (norm.includes("norte") || norm.includes("north")) mappedFeatures.orientationNorth = true;
          if (norm.includes("sur") || norm.includes("south")) mappedFeatures.orientationSouth = true;
          if (norm.includes("este") || norm.includes("east")) mappedFeatures.orientationEast = true;
          if (norm.includes("oeste") || norm.includes("west")) mappedFeatures.orientationWest = true;
        });
      }
    } else if (mappedType === "office") {
      mappedFeatures.areaConstructed = property.area_m2 ? Math.round(property.area_m2) : 50;
      mappedFeatures.liftAvailable = property.has_elevator ?? false;
      mappedFeatures.conditionedAir = property.air_conditioning ?? false;
      mappedFeatures.bathroomNumber = property.bathrooms || 1;
    } else if (mappedType === "commercial") {
      mappedFeatures.areaConstructed = property.area_m2 ? Math.round(property.area_m2) : 50;
      mappedFeatures.conditionedAir = property.air_conditioning ?? false;
      mappedFeatures.bathroomNumber = property.bathrooms || 1;
      mappedFeatures.smokeExtraction = property.smoke_extraction ?? false;
      
      // La clasificación de comercial es obligatoria en Idealista
      mappedFeatures.classificationCommercial = property.property_type === "nave" ? "warehouse" : "premises";
    } else if (mappedType === "land") {
      // Las parcelas requieren areaPlot obligatorio en Idealista
      mappedFeatures.areaPlot = property.area_m2 ? Math.round(property.area_m2) : 100;
    } else if (mappedType === "room") {
      // ── CAMPOS OBLIGATORIOS según validación Idealista ──────────────────────
      // areaConstructed = superficie del piso completo (no de la habitación)
      mappedFeatures.areaConstructed = property.area_m2 ? Math.round(property.area_m2) : 60;
      mappedFeatures.bathroomNumber = property.bathrooms || 1;
      mappedFeatures.liftAvailable = property.has_elevator ?? false;
      // rooms = total de habitaciones del piso (no de la habitación individual)
      // Nota: Idealista exige un mínimo de 2 habitaciones para inmuebles de tipo "room" (piso compartido).
      mappedFeatures.rooms = Math.max(2, property.bedrooms || 3);
      // occupiedNow = si hay inquilinos actualmente (según BD)
      const isOccupied = property.occupied_now ?? false;
      mappedFeatures.occupiedNow = isOccupied;

      // tenantNumber = número de inquilinos en el piso.
      // Nota: Idealista exige que este campo sea obligatorio y tenga un valor mínimo de 2.
      mappedFeatures.tenantNumber = Math.max(2, property.tenant_number ?? 2);

      // Edad del inquilino actual (obligatorio solo si occupiedNow es true)
      if (isOccupied) {
        const minAgeVal = property.tenant_min_age ?? 18;
        const maxAgeVal = property.tenant_max_age ?? 35;
        mappedFeatures.tenantAge = Math.round((minAgeVal + maxAgeVal) / 2);
      }

      // Rangos de edad permitidos para solicitantes (opcional, mapeados si existen)
      if (property.tenant_min_age !== undefined && property.tenant_min_age !== null) {
        mappedFeatures.minAge = property.tenant_min_age;
      }
      if (property.tenant_max_age !== undefined && property.tenant_max_age !== null) {
        mappedFeatures.maxAge = property.tenant_max_age;
      }

      // minimalStay = estancia mínima en meses (mínimo 2 según esquema de Idealista)
      mappedFeatures.minimalStay = Math.max(2, (property as any).min_stay_months ?? 2);
      // petsAllowed = se permiten mascotas
      mappedFeatures.petsAllowed = property.pets_allowed ?? false;
      // type = tipo de propiedad compartida (shared_flat o shared_chalet)
      // (cuyo tipo en el esquema de Idealista para "room" es "room types")
      const isChalet = property.property_type === "casa";
      mappedFeatures.type = isChalet ? "shared_chalet" : "shared_flat";

      // ── CAMPOS OPCIONALES ────────────────────────────────────────────────────
      mappedFeatures.internetAvailable = property.has_wifi ?? true;
      mappedFeatures.bedType = "double"; // single, double, no_bed
      if (mappedFeatures.occupiedNow) {
        mappedFeatures.tenantGender = "both"; // male, female, both
      }
      mappedFeatures.windowView = property.is_exterior ? "street_view" : "courtyard_view";
      mappedFeatures.smokingAllowed = property.smoking_allowed ?? false;
      mappedFeatures.couplesAllowed = property.couples_allowed ?? false;

      // ── availableFrom: formato obligatorio YYYY-MM (no YYYY-MM-DD) ───────────
      const now = new Date();
      let availYear = now.getFullYear();
      let availMonth = now.getMonth() + 1;
      if (property.availability) {
        const parsed = new Date(property.availability);
        if (!isNaN(parsed.getTime())) {
          availYear = parsed.getFullYear();
          availMonth = parsed.getMonth() + 1;
        }
      }
      mappedFeatures.availableFrom = `${availYear}-${String(availMonth).padStart(2, '0')}`;
    }

    // Mapeo de descripciones
    const mappedDescriptions = [];
    if (property.description) {
      // Remove HTML tags from descriptions (as Tiptap is HTML rich-text)
      const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
      const textEs = stripHtml(property.description).substring(0, 3999);
      mappedDescriptions.push({
        language: "es",
        text: textEs
      });

      if (property.description_en) {
        const textEn = stripHtml(property.description_en).substring(0, 3999);
        mappedDescriptions.push({
          language: "en",
          text: textEn
        });
      }
    } else {
      mappedDescriptions.push({
        language: "es",
        text: `${property.title || "Exclusiva propiedad"} en ${property.city || "Málaga"}. Gestionado por Gelabert Homes.`
      });
    }

    // Build overall payload for Idealista
    const payload = {
      type: mappedType,
      code: property.reference || property.id.slice(0, 8),
      reference: property.reference || property.id.slice(0, 8),
      contactId: contactId,
      address: mappedAddress,
      operation: mappedOperation,
      features: mappedFeatures,
      descriptions: mappedDescriptions,
      scope: "idealista" // Show on idealista.com
    };

    console.log(`[Publish] Payload constructed. Mapped Type: ${mappedType}. Reference: ${payload.reference}`);
    console.log(`[Publish] Features: ${JSON.stringify(mappedFeatures)}`);
    
    let idealistaResponseId = property.idealista_id;
    let publishedOk = false;

    // Call Idealista API
    await delay(800); // Proactive delay before publication request
    if (idealistaResponseId) {
      // UPDATE
      const updateUrl = `${baseUrl}/v1/properties/${idealistaResponseId}`;
      console.log(`[Publish] Sending PUT update to: ${updateUrl}`);
      
      const { ok: putOk, status: putStatus, body: putBody, rawText: putRaw } = await idealistaFetch(updateUrl, {
        method: "PUT",
        headers: {
          "feedKey": feedKey,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (putOk && putBody?.propertyId) {
        idealistaResponseId = String(putBody.propertyId);
        publishedOk = true;
        console.log(`[Publish] Property updated successfully! ID: ${idealistaResponseId}`);
      } else {
        console.warn(`[Publish Warning] PUT update returned ${putStatus}: ${putRaw}. Attempting POST instead...`);
        // Fallback to POST if PUT fails (e.g. if listing was removed on their end)
        idealistaResponseId = null;
        await delay(800); // Short delay before fallback creation request
      }
    }

    if (!idealistaResponseId) {
      // CREATE
      const createUrl = `${baseUrl}/v1/properties`;
      console.log(`[Publish] Sending POST create to: ${createUrl}`);
      
      const { ok: postOk, status: postStatus, body: postBody, rawText: postRaw } = await idealistaFetch(createUrl, {
        method: "POST",
        headers: {
          "feedKey": feedKey,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!postOk) {
        console.error(`[Publish Error] POST create returned ${postStatus}: ${postRaw}`);
        
        let existingId: string | null = null;
        try {
          const errData = JSON.parse(postRaw);
          if (
            (errData.message?.includes("already exists") || errData.message?.includes("ya existe")) && 
            typeof errData.pathResource === "string"
          ) {
            const parts = errData.pathResource.split("/");
            const lastPart = parts[parts.length - 1];
            if (lastPart && /^\d+$/.test(lastPart)) {
              existingId = lastPart;
            }
          }
        } catch (e) {
          console.warn("[Publish Warning] Failed to parse error response for existing ID:", e);
        }

        if (existingId) {
          console.log(`[Publish] Listing already exists with ID ${existingId}. Recovering and performing PUT update...`);
          idealistaResponseId = existingId;
          
          // Update DB with the recovered ID
          await supabase
            .from("properties")
            .update({ idealista_id: existingId })
            .eq("id", propertyId);

          const updateUrl = `${baseUrl}/v1/properties/${existingId}`;
          await delay(800);
          const { ok: putOk, status: putStatus, body: putBody, rawText: putRaw } = await idealistaFetch(updateUrl, {
            method: "PUT",
            headers: {
              "feedKey": feedKey,
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          if (putOk) {
            publishedOk = true;
            console.log(`[Publish] Successfully updated existing property via PUT! ID: ${idealistaResponseId}`);
          } else {
            throw new Error(`Idealista listing update failed after recovery: ${putRaw}`);
          }
        } else {
          throw new Error(`Idealista listing creation failed: ${postRaw}`);
        }
      }

      idealistaResponseId = String(postBody?.propertyId);
      publishedOk = true;
      console.log(`[Publish] Property created successfully! ID: ${idealistaResponseId}`);
    }

    // Sync images if publication succeeded
    if (publishedOk && idealistaResponseId) {
      const imagesToUpload: string[] = [];

      // 1. Cover Image (main_image or first gallery image)
      const rawImage = property.main_image || (property.gallery && property.gallery[0]);
      if (rawImage) {
        const processedCover = await processAndWatermarkImage(property, propertyId, supabase, rawImage);
        imagesToUpload.push(processedCover);
      }

      // 2. Room rental specific processing:
      if (property.is_room_rental === true || property.property_type === 'habitacion') {
        // A. Habitaciones (solo para pisos por habitaciones)
        if (property.is_room_rental === true && property.rooms && Array.isArray(property.rooms) && property.rooms.length > 0) {
          for (let roomIdx = 0; roomIdx < property.rooms.length; roomIdx++) {
            const room = property.rooms[roomIdx];
            const roomImages = Array.isArray(room.images) ? room.images : [];
            for (const roomImg of roomImages) {
              if (!roomImg || !roomImg.trim().startsWith('http')) continue;
              const cleanRoomUrl = roomImg.trim().split('?')[0];
              if (imagesToUpload.some(url => url.includes(cleanRoomUrl) || cleanRoomUrl.includes(url))) continue;

              const processedRoomUrl = await processAndWatermarkImage(property, propertyId, supabase, roomImg);
              imagesToUpload.push(processedRoomUrl);
            }
          }
        }

        // B. Zonas comunes
        if (property.common_areas && Array.isArray(property.common_areas)) {
          for (const area of property.common_areas) {
            const areaImages = Array.isArray(area.images) ? area.images.slice(0, 2) : [];
            for (const areaImg of areaImages) {
              if (!areaImg || !areaImg.trim().startsWith('http')) continue;
              const cleanAreaUrl = areaImg.trim().split('?')[0];
              if (imagesToUpload.some(url => url.includes(cleanAreaUrl) || cleanAreaUrl.includes(url))) continue;

              const processedAreaUrl = await processAndWatermarkImage(property, propertyId, supabase, areaImg);
              imagesToUpload.push(processedAreaUrl);
            }
          }
        }
      }

      // 3. Standard Gallery Photos (for regular properties, OR fallback for room properties)
      if (property.gallery && Array.isArray(property.gallery)) {
        const firstGalleryImg = property.gallery[0]
        const galleryStartIdx = (firstGalleryImg === property.main_image) ? 1 : 0
        
        for (let i = galleryStartIdx; i < property.gallery.length; i++) {
          const img = property.gallery[i];
          if (img && img.trim().startsWith('http')) {
            const rawUrl = img.trim().split('?')[0];
            if (!imagesToUpload.some(url => url.includes(rawUrl) || rawUrl.includes(url))) {
              const processedUrl = await processAndWatermarkImage(property, propertyId, supabase, img);
              imagesToUpload.push(processedUrl);
            }
          }
        }
      }

      // 4. Floor Plans
      if (property.floor_plans && Array.isArray(property.floor_plans)) {
        for (const img of property.floor_plans) {
          if (img && img.trim().startsWith('http')) {
            const rawUrl = img.trim().split('?')[0];
            if (!imagesToUpload.some(url => url.includes(rawUrl) || rawUrl.includes(url))) {
              const processedUrl = await processAndWatermarkImage(property, propertyId, supabase, img);
              imagesToUpload.push(processedUrl);
            }
          }
        }
      }

      if (imagesToUpload.length > 0) {
        try {
          console.log(`[Publish] Waiting 1000ms before starting image synchronization...`);
          await delay(1000); // Proactive delay to prevent rate limit spikes
          await syncPropertyImages(accessToken, feedKey, idealistaResponseId, imagesToUpload, baseUrl);
        } catch (imgErr) {
          console.warn("[Publish Warning] Images synchronization failed but property was published:", imgErr);
        }
      }

      // Update local database on successful publish
      await supabase
        .from("properties")
        .update({
          idealista_id: idealistaResponseId,
          idealista_status: "published",
          idealista_error_log: null,
          idealista_last_sync: new Date().toISOString()
        })
        .eq("id", propertyId);

      return new Response(JSON.stringify({ success: true, idealista_id: idealistaResponseId, message: "Property synced and published successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    throw new Error("Unknown synchronization failure");

  } catch (err: any) {
    console.error(`[Edge Function Crash] Error:`, err);
    
    // Attempt to log the error to the database if possible
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      if (propertyId) {
        await supabase
          .from("properties")
          .update({
            idealista_status: "error",
            idealista_error_log: err.message || String(err),
            idealista_last_sync: new Date().toISOString()
          })
          .eq("id", propertyId);
      }
    } catch (logErr) {
      console.error("[Logger Crash] Failed to write error log to properties table:", logErr);
    }

    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
