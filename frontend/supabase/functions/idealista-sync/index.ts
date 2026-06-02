import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  
  const response = await fetch(tokenUrl, {
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
  const contactsUrl = `${baseUrl}/v1/contacts?page=1&size=100`;
  console.log(`[Contact] Querying existing contacts from: ${contactsUrl}`);
  
  const headers = {
    "feedKey": feedKey,
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };

  try {
    const response = await fetch(contactsUrl, { headers });
    if (response.ok) {
      const data = await response.json();
      // Search for our primary contact info@gelaberthomes.es
      const existing = data.contacts?.find(
        (c: any) => c.email && c.email.toLowerCase() === "info@gelaberthomes.es"
      );
      if (existing) {
        console.log(`[Contact] Found existing contact ID: ${existing.contactId}`);
        return Number(existing.contactId);
      }
    }
  } catch (err) {
    console.warn("[Contact] Error fetching contacts list:", err);
  }

  // Create contact if not found
  const createUrl = `${baseUrl}/v1/contacts`;
  console.log(`[Contact] Contact not found, creating one at: ${createUrl}`);
  
  const contactPayload = {
    name: "José Carlos",
    lastName: "Delgado",
    email: "info@gelaberthomes.es",
    primaryPhonePrefix: "34",
    primaryPhoneNumber: "611898827"
  };

  const response = await fetch(createUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(contactPayload)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Contact Error] Create failed: ${errText}`);
    throw new Error(`Failed to create contact in Idealista: ${errText}`);
  }

  const result = await response.json();
  console.log(`[Contact] Contact created successfully. ID: ${result.contactId}`);
  return Number(result.contactId);
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

  const response = await fetch(imagesUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Images Error] Sync failed: ${errText}`);
    throw new Error(`Failed to sync images to Idealista: ${errText}`);
  }

  console.log(`[Images] Mapped and synchronized all images successfully for Idealista property ${idealistaId}`);
}

// ── MAIN SERVER HANDLER ───────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { propertyId, action = "publish" } = await req.json();

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
      
      const deactivateUrl = `${baseUrl}/v1/properties/${property.idealista_id}/deactivate`;
      const response = await fetch(deactivateUrl, {
        method: "POST",
        headers: {
          "feedKey": feedKey,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok && response.status !== 404) {
        const errText = await response.text();
        console.error(`[Deactivate Error] Failed to deactivate on Idealista: ${errText}`);
        throw new Error(`Idealista deactivation failed: ${errText}`);
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

      // La clasificación de Chalet es obligatoria para el tipo house
      if (mappedType === "house") {
        mappedFeatures.classificationChalet = "ch"; // por defecto chalet independiente
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
      mappedFeatures.roomAreaConstructed = property.area_m2 ? Math.round(property.area_m2) : 12;
      mappedFeatures.internetAvailable = property.air_conditioning ?? true; // fallback
      mappedFeatures.bedType = "double";
      mappedFeatures.tenantGender = "both";
      mappedFeatures.smokingAllowed = true;
      mappedFeatures.couplesAllowed = false;
      mappedFeatures.roomType = "shared_flat";
      
      // availableFrom es obligatorio para habitaciones en Idealista
      let availDate = new Date().toISOString().split('T')[0];
      if (property.availability) {
        const parsed = Date.parse(property.availability);
        if (!isNaN(parsed)) {
          availDate = new Date(parsed).toISOString().split('T')[0];
        }
      }
      mappedFeatures.availableFrom = availDate;
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
    
    let idealistaResponseId = property.idealista_id;
    let publishedOk = false;

    // Call Idealista API
    if (idealistaResponseId) {
      // UPDATE
      const updateUrl = `${baseUrl}/v1/properties/${idealistaResponseId}`;
      console.log(`[Publish] Sending PUT update to: ${updateUrl}`);
      
      const response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "feedKey": feedKey,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resData = await response.json();
        idealistaResponseId = String(resData.propertyId);
        publishedOk = true;
        console.log(`[Publish] Property updated successfully! ID: ${idealistaResponseId}`);
      } else {
        const errText = await response.text();
        console.warn(`[Publish Warning] PUT update returned ${response.status}: ${errText}. Attempting POST instead...`);
        // Fallback to POST if PUT fails (e.g. if listing was removed on their end)
        idealistaResponseId = null;
      }
    }

    if (!idealistaResponseId) {
      // CREATE
      const createUrl = `${baseUrl}/v1/properties`;
      console.log(`[Publish] Sending POST create to: ${createUrl}`);
      
      const response = await fetch(createUrl, {
        method: "POST",
        headers: {
          "feedKey": feedKey,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Publish Error] POST create returned ${response.status}: ${errText}`);
        throw new Error(`Idealista listing creation failed: ${errText}`);
      }

      const resData = await response.json();
      idealistaResponseId = String(resData.propertyId);
      publishedOk = true;
      console.log(`[Publish] Property created successfully! ID: ${idealistaResponseId}`);
    }

    // Sync images if publication succeeded
    if (publishedOk && idealistaResponseId) {
      const imagesToUpload: string[] = [];
      if (property.main_image) imagesToUpload.push(property.main_image);
      if (property.gallery && Array.isArray(property.gallery)) {
        imagesToUpload.push(...property.gallery);
      }

      if (imagesToUpload.length > 0) {
        try {
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
      
      const { propertyId } = await req.json().catch(() => ({}));
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
