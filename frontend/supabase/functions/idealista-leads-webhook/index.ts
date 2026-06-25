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
    const body = await req.json();
    const { subject, text, html, from, date } = body;

    console.log(`[idealista-leads-webhook] Received email webhook:`, {
      subject,
      from,
      date,
      textLength: text?.length,
      htmlLength: html?.length
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
   - "propertyRef": Busca referencias como "GEL-140", "GEL-129" o un número independiente (ej: si en el asunto dice "Contacto por tu piso 141", la referencia es GEL-141). Formatea la salida como "GEL-XXX" (ej: GEL-138). Si no encuentras una referencia interna, intenta extraer el número del anuncio si existe o déjalo como null.
3. Extrae la información socioeconómica del cliente (perfil de inquilino o solvencia) si aparece descrita (Idealista suele adjuntar esto cuando el cliente solicita visita y tiene su perfil completado):
   - "occupation": Ocupación o situación profesional (ej. "Estudiante", "Funcionario", "Autónomo", "Trabajador por cuenta ajena", etc.).
   - "monthlyIncome": Ingresos mensuales netos totales en euros. Devuelve un valor numérico limpio (ej: 3200). Si dice "2000-2500", pon 2250 (la media). Si no hay datos, pon null.
   - "employmentSeniority": Antigüedad laboral o tipo de contrato (ej. "Indefinido", "Temporal", "2 años", etc.).
   - "numPeople": Número de personas que vivirán en la propiedad (ej. 2). Devuelve un valor numérico entero. Si no se indica, por defecto pon null.
   - "hasPets": Si tiene mascotas o no. Devuelve true si indica explícitamente que tiene mascotas, false si indica que no tiene, o null si no se menciona.
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

    console.log("[idealista-leads-webhook] Extracted data:", extracted);

    let clientEmail = extracted.email;
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
      if (extracted.phone) {
        const cleanPhone = extracted.phone.replace(/\D/g, "");
        clientEmail = `telefono-${cleanPhone || 'desconocido'}@idealista.com`;
        console.log(`[idealista-leads-webhook] No email found. Generated phone placeholder: ${clientEmail}`);
      } else {
        clientEmail = `sin-email-${Date.now()}@idealista.com`;
        console.log(`[idealista-leads-webhook] No email or phone found. Generated placeholder: ${clientEmail}`);
      }
    }

    // 1. Find the property by reference
    let targetProperty = null;
    if (extracted.propertyRef) {
      const refNormalized = extracted.propertyRef.toUpperCase().trim();
      const { data, error } = await supabaseAdmin
        .from("properties")
        .select(`
          id, title, price, operation, city, zone, bedrooms, bathrooms, area_m2, 
          has_pool, has_elevator, is_furnished, has_parking, has_terrace, garden, has_balcony
        `)
        .eq("reference", refNormalized)
        .maybeSingle();

      if (error) {
        console.error(`Error querying property by ref ${refNormalized}:`, error);
      } else if (data) {
        targetProperty = data;
        console.log(`Matched property by exact ref:`, targetProperty.title);
      } else {
        // Try fallback parsing if the reference extracted is just a number
        const match = refNormalized.match(/\d+/);
        if (match) {
          const numRef = `GEL-${match[0]}`;
          const { data: data2 } = await supabaseAdmin
            .from("properties")
            .select(`
              id, title, price, operation, city, zone, bedrooms, bathrooms, area_m2, 
              has_pool, has_elevator, is_furnished, has_parking, has_terrace, garden, has_balcony
            `)
            .eq("reference", numRef)
            .maybeSingle();
          if (data2) {
            targetProperty = data2;
            console.log(`Matched property by fallback ref ${numRef}:`, targetProperty.title);
          }
        }
      }
    }

    // 2. Insert/Update Lead in leads_crm
    // Match by email OR by phone (if phone is present) to prevent duplicates
    let existingLead = null;
    const query = supabaseAdmin.from("leads_crm").select("id");
    
    if (clientEmail && extracted.phone) {
      const { data, error } = await query
        .or(`email.eq.${clientEmail},phone.eq.${extracted.phone}`)
        .maybeSingle();
      if (error) console.error("Error looking up existing lead:", error);
      existingLead = data;
    } else if (clientEmail) {
      const { data, error } = await query
        .eq("email", clientEmail)
        .maybeSingle();
      if (error) console.error("Error looking up existing lead by email:", error);
      existingLead = data;
    } else if (extracted.phone) {
      const { data, error } = await query
        .eq("phone", extracted.phone)
        .maybeSingle();
      if (error) console.error("Error looking up existing lead by phone:", error);
      existingLead = data;
    }

    let leadId = null;
    const leadPayload = {
      name: extracted.name || "Contacto Idealista",
      email: clientEmail,
      phone: extracted.phone || null,
      intent: extracted.intent || "alquilar",
      status: "nuevo",
      source: "idealista",
      target_property_id: targetProperty ? targetProperty.id : null,
      target_property_ref: extracted.propertyRef || (targetProperty ? targetProperty.reference : null),
      occupation: extracted.occupation || null,
      monthly_income: extracted.monthlyIncome || null,
      employment_seniority: extracted.employmentSeniority || null,
      num_people: extracted.numPeople || null,
      has_pets: extracted.hasPets,
      agent_notes: extracted.message || "Consulta recibida de Idealista.",
    };

    if (existingLead) {
      leadId = existingLead.id;
      console.log(`Updating existing lead with ID: ${leadId}`);
      const { error: updateErr } = await supabaseAdmin
        .from("leads_crm")
        .update({
          ...leadPayload,
          updated_at: new Date().toISOString()
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
      max_price: targetProperty?.price ? Math.ceil(Number(targetProperty.price) * 1.1) : null,
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

    // 4. Save inquiry record
    const { error: inqErr } = await supabaseAdmin
      .from("inquiries")
      .insert({
        property_id: targetProperty ? targetProperty.id : null,
        name: extracted.name || "Contacto Idealista",
        email: clientEmail,
        phone: extracted.phone || null,
        message: extracted.message || "Consulta recibida de Idealista.",
        inquiry_type: extracted.intent === "comprar" ? "compra" : "alquiler",
        status: "pending",
        privacy_accepted: true,
        solvency_accepted: extracted.monthlyIncome ? true : false,
      });

    if (inqErr) {
      console.error("Error inserting inquiry:", inqErr);
    } else {
      console.log("Inquiry record saved successfully.");
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
