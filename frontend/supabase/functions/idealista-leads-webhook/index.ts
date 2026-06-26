import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase URL or service role key in environment");
    }
    if (!OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY in environment");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read the email payload from Make.com
    const rawBody = await req.text();
    console.log(`[idealista-leads-webhook] Raw body length: ${rawBody.length}`);

    let body: any = {};
    let parseError = null;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      parseError = err;
      console.error("[idealista-leads-webhook] JSON parsing failed, trying fallback regex extraction", err);
      
      const extractField = (field: string) => {
        const regex = new RegExp(`"${field}\\s*"\\s*:\\s*"(.*?)"`, "s");
        const match = rawBody.match(regex);
        if (match) {
          return match[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t');
        }
        return null;
      };
      
      body = {
        subject: extractField("subject"),
        text: extractField("text"),
        html: extractField("html"),
        from: extractField("from"),
        date: extractField("date")
      };
    }

    // Normalize keys to trim trailing/leading spaces (e.g., "text " -> "text")
    let subject = "";
    let text = "";
    let html = "";
    let from = "";
    let date = "";
    let payloadName = "";
    let payloadPhone = "";
    let payloadEmail = "";
    let payloadPrice: number | null = null;

    if (body && typeof body === "object") {
      const normalizedBody: any = {};
      for (const key of Object.keys(body)) {
        normalizedBody[key.trim()] = body[key];
      }
      subject = normalizedBody.subject || "";
      text = normalizedBody.text || "";
      html = normalizedBody.html || "";
      from = normalizedBody.from || "";
      date = normalizedBody.date || "";
      payloadName = normalizedBody.name || "";
      payloadPhone = normalizedBody.phone || "";
      payloadEmail = normalizedBody.email || "";
      // LAYER 1: Structured price field from Make.com (if available)
      const rawPayloadPrice = normalizedBody.price || normalizedBody.ad_price || normalizedBody.adPrice || null;
      if (rawPayloadPrice) {
        const parsed = parseFloat(String(rawPayloadPrice).replace(/[^\d,.]/g, "").replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) {
          payloadPrice = Math.round(parsed);
          console.log(`[idealista-leads-webhook] LAYER 1: Got price from payload field: ${payloadPrice}`);
        }
      }
    }

    console.log(`[idealista-leads-webhook] Parsed fields:`, {
      subjectLength: subject?.length,
      from,
      date,
      textLength: text?.length,
      htmlLength: html?.length,
      payloadName,
      payloadPhone,
      payloadEmail,
      payloadPrice,
      hasParseError: !!parseError
    });

    // Assemble text to feed into OpenAI
    const emailContent = `
ASUNTO: ${subject || ''}
DE: ${from || ''}
FECHA: ${date || ''}
TEXTO:
${text || ''}
-------------------------
HTML:
${html || ''}
`;

    // Prompt to parse email content
    const systemPrompt = `Eres un asistente de inteligencia artificial experto en el sector inmobiliario y procesamiento de leads de la marca de lujo Gelabert Homes.
Tu trabajo es tomar la información de un correo de contacto o solicitud de información enviado por Idealista (asunto, remitente, texto y/o HTML) y extraer información clave del lead y de su perfil de inquilino o solvencia de manera estructurada en formato JSON.

Analiza el contenido con detenimiento y realiza las siguientes tareas:
1. Identifica los datos del cliente:
   - "name": Nombre del cliente.
   - "email": Email del cliente. Si no encuentras un email explícito de contacto del cliente en el texto, busca en el remitente o cuerpo.
   - "phone": Teléfono del cliente.
   - "message": El mensaje o consulta original que ha escrito el cliente.
2. Identifica la referencia del inmueble:
   - "propertyRef": Busca y extrae la referencia completa, preservando cualquier sufijo o sub-referencia separada por guiones (ej. "GEL-134-02-01", "GEL-102-01" o "GEL-138"). Si solo viene un número independiente (ej: "piso 141"), formatea la salida como "GEL-141". Si no encuentras una referencia interna, intenta extraer el número del anuncio si existe o déjalo como null.
3. Extrae la información socioeconómica del cliente (perfil de inquilino o solvencia). Analiza tanto el perfil adjunto estructurado por Idealista como el texto redactado a mano del mensaje (ej: "somos dos estudiantes...", "trabajo de autónomo...", "tengo 21 años, soy Argentina"):
   - "occupation": Ocupación o situación laboral. CLASIFÍCALO en una de estas categorías simples en español: "Estudiante", "Trabajador", "Autónomo", "Funcionario", "Jubilado". Si es algo como "trabajo en un bar", clasifícalo como "Trabajador". Si no se menciona situación profesional ni se puede inferir del texto, pon null.
   - "monthlyIncome": Ingresos mensuales netos totales en euros. Devuelve un valor numérico limpio (ej: 3200). Si dice "2000-2500", pon 2250 (la media). Si no hay datos, pon null.
   - "employmentSeniority": Antigüedad laboral o tipo de contrato (ej. "Indefinido", "Temporal", "2 años", etc.).
   - "numPeople": Número de personas que vivirán en la propiedad. Devuelve un valor entero. Intenta inferirlo si dicen "somos dos amigas" (2), "con mi pareja" (2), etc. Si no se indica, por defecto pon null.
   - "hasPets": Si tiene mascotas o no. Devuelve true si indica que las tiene, false si indica que no, o null si no se menciona.
   - "age": Edad del cliente. Extrae el número si se menciona (ej. "tengo 21 años"). Si no, pon null.
   - "nationality": Nacionalidad. Extrae el gentilicio o país en español (ej. "Argentina", "Francesa", "Español"). Si no, pon null.
   - "cityOrigin": Ciudad de origen. Extrae si se menciona de dónde viene (ej. "Málaga", "París", "Madrid"). Si no, pon null.
   - "adPrice": El precio exacto del anuncio de Idealista por el que el lead ha realizado la consulta. En los correos de Idealista este precio suele aparecer: (a) en el asunto del correo (ej: "Interesado en piso - 1.350 €/mes"), (b) al final del cuerpo del correo junto a los datos del inmueble (ej: "Precio: 1.350 €", "1.350 €/mes", "450 € al mes"), o (c) en el bloque HTML con la información de la propiedad. REGLAS CRÍTICAS: (1) Si el precio aparece precedido por "desde" (ej: "desde 430 €"), es un precio de rango/mínimo — IGNÓRALO COMPLETAMENTE y sigue buscando el precio real. (2) El precio real es el que figura específicamente para esa propiedad o habitación, no el mínimo de un rango. (3) Si encuentras varios precios, prioriza el que aparece en el asunto del correo o el más destacado en el cuerpo. (4) Devuelve el número en euros sin puntos de miles ni símbolo (ej: 1350, no "1.350 €"). Si tras analizar todo el correo no encuentras ningún precio específico, pon null.
   - "intent": Intención de la operación. Devuelve "alquilar" o "comprar". Si el email habla de alquiler, devuelve "alquilar".

Debes responder ÚNICAMENTE con un objeto JSON válido. No uses bloques de código markdown (como \`\`\`json), no escribas texto aclaratorio ni antes ni después. Solo el JSON puro con las siguientes claves:
{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "message": string | null,
  "propertyRef": string | null,
  "occupation": string | null,
  "monthlyIncome": number | null,
  "employmentSeniority": string | null,
  "numPeople": number | null,
  "hasPets": boolean | null,
  "age": number | null,
  "nationality": string | null,
  "cityOrigin": string | null,
  "adPrice": number | null,
  "intent": "alquilar" | "comprar"
}`;

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Por favor, analiza el siguiente email de Idealista y extrae la información en formato JSON:\n\n${emailContent}` }
        ],
        temperature: 0.2
      })
    });

    if (!openAIResponse.ok) {
      const errText = await openAIResponse.text();
      console.error("OpenAI Error Response:", errText);
      throw new Error(`OpenAI API returned status ${openAIResponse.status}`);
    }

    const aiResult = await openAIResponse.json();
    const rawContent = aiResult.choices?.[0]?.message?.content?.trim() || "";
    
    // Clean potential markdown wrappers if any
    let cleanedJson = rawContent;
    if (cleanedJson.startsWith("```json")) {
      cleanedJson = cleanedJson.substring(7);
    }
    if (cleanedJson.endsWith("```")) {
      cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
    }
    cleanedJson = cleanedJson.trim();

    let extracted;
    try {
      extracted = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("Failed to parse JSON returned from OpenAI:", cleanedJson);
      throw new Error(`Invalid JSON format returned from AI: ${parseErr.message}`);
    }

    // LAYER 1: Use payload price if AI didn't extract one
    if (payloadPrice && (!extracted || !extracted.adPrice)) {
      if (!extracted) extracted = {};
      extracted.adPrice = payloadPrice;
      console.log(`[idealista-leads-webhook] LAYER 1 applied: adPrice from payload = ${payloadPrice}`);
    }

    // LAYER 3: Multi-strategy regex fallback on subject + text + HTML
    if (extracted && typeof extracted === "object" && !extracted.adPrice) {
      const fullText = `${subject || ""} ${text || ""} ${html || ""}`;
      
      // Helper to parse Spanish number format (1.350,50 or 1.350 or 1350)
      const parseSpanishPrice = (raw: string): number | null => {
        // Remove thousands separators (dots before 3 digits) and convert comma decimals
        const cleaned = raw.trim().replace(/\.(\d{3})/g, "$1").replace(",", ".");
        const val = parseFloat(cleaned);
        return (!isNaN(val) && val > 0) ? Math.round(val) : null;
      };

      let foundPrice: number | null = null;

      // Strategy A: Price in subject line (most reliable - e.g. "Piso en alquiler - 1.350 €/mes")
      if (!foundPrice) {
        const subjectMatches = [...(subject || "").matchAll(/(?<!desde\s{0,5})([\d]{1,4}(?:[\.,\s]\d{3})*)\s*€/gi)];
        for (const m of subjectMatches) {
          const val = parseSpanishPrice(m[1]);
          if (val && val >= 100 && val <= 15000) { foundPrice = val; break; }
        }
        if (foundPrice) console.log(`[idealista-leads-webhook] LAYER 3A: price from subject = ${foundPrice}`);
      }

      // Strategy B: Explicit price label patterns in body (e.g. "Precio: 1.350 €", "Alquiler: 950 €")
      if (!foundPrice) {
        const labelPatterns = [
          /(?:precio|alquiler|renta|mensualidad|importe)\s*:?\s*([\d]{1,4}(?:[\.,]\d{3})*)\s*€/gi,
          /([\d]{1,4}(?:[\.,]\d{3})*)\s*€\s*(?:\/mes|al\s+mes|mensual)/gi,
        ];
        for (const pattern of labelPatterns) {
          const matches = [...fullText.matchAll(pattern)];
          for (const m of matches) {
            const raw = m[1] || m[0];
            // Check that "desde" doesn't precede this match
            const matchIndex = m.index || 0;
            const prefix = fullText.substring(Math.max(0, matchIndex - 10), matchIndex).toLowerCase();
            if (prefix.includes("desde")) continue;
            const numStr = raw.replace(/[^\d.,]/g, "");
            const val = parseSpanishPrice(numStr);
            if (val && val >= 100 && val <= 15000) { foundPrice = val; break; }
          }
          if (foundPrice) break;
        }
        if (foundPrice) console.log(`[idealista-leads-webhook] LAYER 3B: price from label pattern = ${foundPrice}`);
      }

      // Strategy C: Any price in €, excluding those preceded by "desde"
      if (!foundPrice) {
        const allPrices: number[] = [];
        const allMatches = [...fullText.matchAll(/([\d]{1,4}(?:[\.,]\d{3})*)\s*€/gi)];
        for (const m of allMatches) {
          const matchIndex = m.index || 0;
          const prefix = fullText.substring(Math.max(0, matchIndex - 12), matchIndex).toLowerCase();
          if (prefix.includes("desde")) continue;
          const val = parseSpanishPrice(m[1]);
          if (val && val >= 100 && val <= 15000) allPrices.push(val);
        }
        // Take the LAST non-"desde" price found (Idealista emails show property details at the bottom)
        if (allPrices.length > 0) {
          foundPrice = allPrices[allPrices.length - 1];
          console.log(`[idealista-leads-webhook] LAYER 3C: price from last non-desde match = ${foundPrice} (${allPrices.length} candidates: ${allPrices.join(", ")})`);
        }
      }

      extracted.adPrice = foundPrice || null;
    }

    console.log("[idealista-leads-webhook] Extracted data:", extracted);

    let clientEmail = extracted.email || payloadEmail;
    if (!clientEmail) {
      // Fallback: search the raw text/html for any email patterns
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = [
        ...((text || "").match(emailRegex) || []),
        ...((html || "").match(emailRegex) || [])
      ];
      
      // Filter out system emails like no-responder@idealista.com or info@gelaberthomes.es
      const filtered = foundEmails.filter((email: string) => {
        const e = email.toLowerCase();
        return !e.includes("idealista.com") && !e.includes("gelaberthomes.es");
      });
      
      if (filtered.length > 0) {
        clientEmail = filtered[0];
        console.log(`[idealista-leads-webhook] Extracted email from raw text: ${clientEmail}`);
      }
    }

    // Generate placeholder email if not found (since email is NOT NULL in database)
    if (!clientEmail) {
      const targetPhone = extracted.phone || payloadPhone;
      if (targetPhone) {
        const cleanPhone = targetPhone.replace(/\D/g, "");
        clientEmail = `telefono-${cleanPhone || 'desconocido'}@idealista.com`;
        console.log(`[idealista-leads-webhook] No email found. Generated phone placeholder: ${clientEmail}`);
      } else {
        clientEmail = `sin-email-${Date.now()}@idealista.com`;
        console.log(`[idealista-leads-webhook] No email or phone found. Generated placeholder: ${clientEmail}`);
      }
    }

    // 1. Find the property by reference or Idealista ID
    let targetProperty = null;
    let propRef = extracted.propertyRef;

    // Fallback: Scan subject and text/html for any mention of a reference or Idealista ID
    if (!propRef) {
      // Look for GEL-XXX pattern (case-insensitive, matching full references with suffixes)
      const gelRegex = /GEL-\d+(?:-[0-9a-zA-Z]+)*/i;
      const gelMatch = (subject || "").match(gelRegex) || (text || "").match(gelRegex) || (html || "").match(gelRegex);
      if (gelMatch) {
        propRef = gelMatch[0].toUpperCase();
        console.log(`[idealista-leads-webhook] Extracted GEL reference from raw text: ${propRef}`);
      } else {
        // Look for Idealista ID patterns (numbers with 6+ digits, or links/codes)
        const idRegexes = [
          /idealista\.com\/inmueble\/(\d+)/i,
          /idealista\.com\/.*inmueble\/(\d+)/i,
          /cod\.\s*(\d+)/i,
          /anuncio\s*(\d+)/i,
          /referencia\s*:\s*(\d+)/i,
          /ref\.\s*idealista\s*:\s*(\d+)/i
        ];
        for (const regex of idRegexes) {
          const match = (text || "").match(regex) || (html || "").match(regex) || (subject || "").match(regex);
          if (match && match[1]) {
            propRef = match[1];
            console.log(`[idealista-leads-webhook] Extracted Idealista ID from raw text: ${propRef}`);
            break;
          }
        }
      }
    }

    if (propRef) {
      const refNormalized = propRef.toUpperCase().trim();
      
      // Try 1: Match by exact reference (e.g. "GEL-141")
      const { data: data1, error: err1 } = await supabaseAdmin
        .from("properties")
        .select(`
          id, title, reference, price, operation, city, zone, bedrooms, bathrooms, area_m2, 
          has_pool, has_elevator, is_furnished, has_parking, has_terrace, garden, has_balcony,
          is_room_rental
        `)
        .eq("reference", refNormalized)
        .maybeSingle();

      if (err1) console.error(`Error querying property by ref ${refNormalized}:`, err1);
      
      if (data1) {
        targetProperty = data1;
        console.log(`Matched property by exact reference:`, targetProperty.title);
      } else {
        // Try 1.5: Match by exact idealista_id (in case AI extracted the ID directly as refNormalized)
        const { data: dataIdealistaId, error: errIdealistaId } = await supabaseAdmin
          .from("properties")
          .select(`
            id, title, reference, price, operation, city, zone, bedrooms, bathrooms, area_m2, 
            has_pool, has_elevator, is_furnished, has_parking, has_terrace, garden, has_balcony,
            is_room_rental
          `)
          .eq("idealista_id", refNormalized)
          .maybeSingle();

        if (errIdealistaId) console.error(`Error querying property by idealista_id ${refNormalized}:`, errIdealistaId);

        if (dataIdealistaId) {
          targetProperty = dataIdealistaId;
          console.log(`Matched property by exact idealista_id:`, targetProperty.title);
        } else {
          // Try 1b: Progressive parent-reference fallback (e.g. GEL-134-02-01 -> GEL-134-02 -> GEL-134)
          let parts = refNormalized.split("-");
          while (parts.length > 2 && !targetProperty) {
            parts.pop(); // Remove the last segment (e.g., "-01")
            const parentRef = parts.join("-");
            console.log(`Trying progressive fallback reference: ${parentRef}`);
            const { data: parentData, error: parentErr } = await supabaseAdmin
              .from("properties")
              .select(`
                id, title, reference, price, operation, city, zone, bedrooms, bathrooms, area_m2, 
                has_pool, has_elevator, is_furnished, has_parking, has_terrace, garden, has_balcony,
                is_room_rental
              `)
              .eq("reference", parentRef)
              .maybeSingle();
            
            if (parentErr) console.error(`Error querying property by progressive fallback ref ${parentRef}:`, parentErr);
            if (parentData) {
              targetProperty = parentData;
              console.log(`Matched property by progressive parent reference ${parentRef}:`, targetProperty.title);
            }
          }
        }

        if (!targetProperty) {
          // Try 2: Extract any digits in reference and see if it maps
          const matchDigits = refNormalized.match(/\d+/);
          if (matchDigits) {
            const numStr = matchDigits[0];
            
            // If the digits length is >= 6, it is likely an Idealista ID!
            if (numStr.length >= 6) {
              const { data: data2, error: err2 } = await supabaseAdmin
                .from("properties")
                .select(`
                  id, title, reference, price, operation, city, zone, bedrooms, bathrooms, area_m2, 
                  has_pool, has_elevator, is_furnished, has_parking, has_terrace, garden, has_balcony,
                  is_room_rental
                `)
                .eq("idealista_id", numStr)
                .maybeSingle();
              
              if (err2) console.error(`Error querying property by idealista_id ${numStr}:`, err2);
              if (data2) {
                targetProperty = data2;
                console.log(`Matched property by idealista_id ${numStr}:`, targetProperty.title);
              }
            }

            // Try 3: If not matched yet, try fallback to "GEL-XXX" pattern
            if (!targetProperty) {
              const gelRef = `GEL-${numStr}`;
              const { data: data3, error: err3 } = await supabaseAdmin
                .from("properties")
                .select(`
                  id, title, reference, price, operation, city, zone, bedrooms, bathrooms, area_m2, 
                  has_pool, has_elevator, is_furnished, has_parking, has_terrace, garden, has_balcony,
                  is_room_rental
                `)
                .eq("reference", gelRef)
                .maybeSingle();
              
              if (err3) console.error(`Error querying property by fallback ref ${gelRef}:`, err3);
              if (data3) {
                targetProperty = data3;
                console.log(`Matched property by fallback reference ${gelRef}:`, targetProperty.title);
              }
            }
          }
        }
      }
    }

    // 2. Insert/Update Lead in leads_crm
    // Match by email OR by phone (if phone is present) to prevent duplicates
    let existingLead = null;
    const query = supabaseAdmin.from("leads_crm").select("id, name, phone, email, max_rent, max_buy_price, target_property_id, target_property_ref");
    
    const targetPhone = extracted.phone || payloadPhone || null;
    
    if (clientEmail && targetPhone) {
      const { data, error } = await query
        .or(`email.eq.${clientEmail},phone.eq.${targetPhone}`)
        .maybeSingle();
      if (error) console.error("Error looking up existing lead:", error);
      existingLead = data;
    } else if (clientEmail) {
      const { data, error } = await query
        .eq("email", clientEmail)
        .maybeSingle();
      if (error) console.error("Error looking up existing lead by email:", error);
      existingLead = data;
    } else if (targetPhone) {
      const { data, error } = await query
        .eq("phone", targetPhone)
        .maybeSingle();
      if (error) console.error("Error looking up existing lead by phone:", error);
      existingLead = data;
    }

    const isAlquiler = extracted.intent === "alquilar" || (targetProperty && targetProperty.operation === "alquiler");
    const isVenta = extracted.intent === "comprar" || (targetProperty && targetProperty.operation === "venta");

    let leadId = null;
    // Parse original email date
    let leadDate = new Date();
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        leadDate = parsedDate;
      }
    }
    const leadDateISO = leadDate.toISOString();

    const leadPayload = {
      name: existingLead && existingLead.name && existingLead.name !== "Contacto Idealista"
        ? existingLead.name
        : (extracted.name || payloadName || "Contacto Idealista"),
      email: clientEmail || (existingLead ? existingLead.email : null),
      phone: targetPhone || (existingLead ? existingLead.phone : null),
      intent: extracted.intent || (isVenta ? "comprar" : "alquilar"),
      status: "nuevo",
      source: "idealista",
      target_property_id: targetProperty ? targetProperty.id : (existingLead ? existingLead.target_property_id : null),
      target_property_ref: targetProperty ? targetProperty.reference : (existingLead ? existingLead.target_property_ref : (extracted.propertyRef || null)),
      occupation: extracted.occupation || null,
      monthly_income: extracted.monthlyIncome || null,
      employment_seniority: extracted.employmentSeniority || null,
      num_people: extracted.numPeople || null,
      has_pets: extracted.hasPets,
      age: extracted.age || null,
      nationality: extracted.nationality || null,
      city_origin: extracted.cityOrigin || null,
      // Price ALWAYS comes from the email (adPrice extracted from Idealista email).
      // Never use the DB property price as a fallback - that price may not match what the lead saw.
      max_rent: isAlquiler ? (extracted.adPrice || (existingLead ? existingLead.max_rent : null)) : null,
      max_buy_price: isVenta ? (extracted.adPrice || (existingLead ? existingLead.max_buy_price : null)) : null,
      agent_notes: extracted.message || `[DEBUG: AI message empty. Raw body: ${rawBody}]`,
    };

    if (existingLead) {
      leadId = existingLead.id;
      console.log(`Updating existing lead with ID: ${leadId}`);
      const { error: updateErr } = await supabaseAdmin
        .from("leads_crm")
        .update({
          ...leadPayload,
          updated_at: leadDateISO
        })
        .eq("id", leadId);
      
      if (updateErr) {
        console.error("Error updating lead:", updateErr);
        throw updateErr;
      }
    } else {
      console.log(`Inserting new lead for email: ${clientEmail}`);
      const { data: newLead, error: insertErr } = await supabaseAdmin
        .from("leads_crm")
        .insert({
          ...leadPayload,
          created_at: leadDateISO,
          updated_at: leadDateISO
        })
        .select("id")
        .single();
      
      if (insertErr) {
        console.error("Error inserting lead:", insertErr);
        throw insertErr;
      }
      leadId = newLead.id;
    }

    // 3. Create/Update Search Profile in leads_search_profiles
    const { data: existingProfile, error: getProfileErr } = await supabaseAdmin
      .from("leads_search_profiles")
      .select("id")
      .eq("lead_id", leadId)
      .maybeSingle();

    if (getProfileErr) {
      console.error("Error looking up existing search profile:", getProfileErr);
    }

    // Clone the specifications of the property for search matching
    const profilePayload = {
      lead_id: leadId,
      intent: extracted.intent || (targetProperty?.operation === "venta" ? "comprar" : "alquilar"),
      preferred_cities: targetProperty?.city ? [targetProperty.city] : [],
      preferred_zones: targetProperty?.zone ? [targetProperty.zone] : [],
      // max_price = adPrice (from email) + 10%. Never use DB property price.
      max_price: extracted.adPrice ? Math.round(Number(extracted.adPrice) * 1.1) : null,
      min_bedrooms: targetProperty?.bedrooms || null,
      min_bathrooms: targetProperty?.bathrooms || null,
      min_area_m2: targetProperty?.area_m2 ? Math.floor(Number(targetProperty.area_m2) * 0.9) : null,
      wants_terrace: targetProperty?.has_terrace || false,
      wants_parking: targetProperty?.has_parking || false,
      wants_pool: targetProperty?.has_pool || false,
      wants_elevator: targetProperty?.has_elevator || false,
      wants_furnished: targetProperty?.is_furnished || false,
      wants_garden: targetProperty?.garden || false,
      wants_balcony: targetProperty?.has_balcony || false,
      pets_needed: extracted.hasPets || false,
      is_active: true
    };

    if (existingProfile) {
      console.log(`Updating search profile for lead: ${leadId}`);
      const { error: profileUpdateErr } = await supabaseAdmin
        .from("leads_search_profiles")
        .update(profilePayload)
        .eq("id", existingProfile.id);

      if (profileUpdateErr) {
        console.error("Error updating search profile:", profileUpdateErr);
      }
    } else {
      console.log(`Creating new search profile for lead: ${leadId}`);
      const { error: profileInsertErr } = await supabaseAdmin
        .from("leads_search_profiles")
        .insert(profilePayload);

      if (profileInsertErr) {
        console.error("Error inserting search profile:", profileInsertErr);
      }
    }

    // 4. Save/Update inquiry record (prevent duplicates)
    let existingInquiry = null;
    if (clientEmail) {
      const { data, error } = await supabaseAdmin
        .from("inquiries")
        .select("id")
        .eq("email", clientEmail)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!error) existingInquiry = data;
    }

    const inquiryPayload = {
      property_id: targetProperty ? targetProperty.id : null,
      name: extracted.name || payloadName || "Contacto Idealista",
      email: clientEmail,
      phone: targetPhone || null,
      message: extracted.message || "Consulta recibida de Idealista.",
      inquiry_type: extracted.intent === "comprar" ? "compra" : "alquiler",
      status: "nuevo",
      privacy_accepted: true,
      solvency_accepted: extracted.monthlyIncome ? true : false,
      created_at: leadDateISO,
    };

    if (existingInquiry) {
      console.log(`Updating existing inquiry with ID: ${existingInquiry.id}`);
      const { error: inqErr } = await supabaseAdmin
        .from("inquiries")
        .update(inquiryPayload)
        .eq("id", existingInquiry.id);
      if (inqErr) console.error("Error updating inquiry:", inqErr);
    } else {
      console.log("Inserting new inquiry record.");
      const { error: inqErr } = await supabaseAdmin
        .from("inquiries")
        .insert(inquiryPayload);
      if (inqErr) console.error("Error inserting inquiry:", inqErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead processed and inserted successfully.", 
        leadId, 
        matchedProperty: targetProperty ? targetProperty.title : null 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Critical error in idealista-leads-webhook:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
