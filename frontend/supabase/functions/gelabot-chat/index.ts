import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  SUPABASE_URL ?? '',
  SUPABASE_SERVICE_ROLE_KEY ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, leadData } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const systemPrompt = `
Eres GelaBot, el agente virtual inmobiliario experto de Gelabert Homes (agencia de lujo en Málaga Capital y Costa del Sol).
Tu objetivo es asistir a usuarios que quieren alquilar, comprar o vender, cualificarlos de forma natural, y RECOPILAR SU PERFIL COMPLETO para guardarlo en nuestro CRM.

REGLAS DE COMUNICACIÓN CRÍTICAS:
1. NO SEAS REPETITIVO. Varía tu vocabulario y no repitas la misma estructura o frase en cada mensaje. Conversa de forma natural y fluida.
2. SÉ CONCISO. Evita bloques de texto gigantes. Tono: Profesional, lujoso, atento y resolutivo.

FLUJO Y CUALIFICACIÓN DEL LEAD:
1. CUALIFICACIÓN CONVERSACIONAL SEGÚN INTENCIÓN: Tienes que recopilar los datos clave paso a paso y de forma amigable (no todo de golpe):
   - SI BUSCAN COMPRAR O ALQUILAR: Presupuesto máximo, zonas preferidas, mínimo de habitaciones/baños, y extras (terraza, piscina, si tienen mascotas).
   - SI QUIEREN VENDER O OFRECER EN ALQUILER: Dirección exacta, tipo de inmueble, estado (reformado, amueblado), metros cuadrados y el precio estimado que tienen en mente.
2. BÚSQUEDA: Cuando tengas una buena imagen de lo que buscan, usa "search_properties" para encontrar coincidencias.
3. PRESENTACIÓN DE PROPIEDADES: NUNCA pongas todas las características de todas las opciones de golpe. Preséntalas de forma muy limpia y elegante, destacando solo el precio, la zona y un gran atractivo.
4. ALTERNATIVAS: Si algo no cumple el 100% de sus requisitos, ofrécelo con tacto. Ejemplo: "Sé que no tiene piscina como me pediste, pero es un ático espectacular con una gran terraza...".
5. EL CEBO Y LOS DATOS DE CONTACTO: SOLO cuando el cliente muestre interés, le guste una propiedad o cuando vayas a enviarle información exclusiva, pídele sus datos de contacto (Nombre, Email y Teléfono). Justifícalo diciendo que es para enviarle un "dossier VIP" o "agendar una visita privada".
6. En cuanto te den sus datos de contacto (y ya hayas recogido sus datos de cualificación), USA INMEDIATAMENTE "save_lead" para registrar su perfil completo.
    `;

    const openAiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'bot' ? 'assistant' : m.role,
        content: m.content
      }))
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "search_properties",
          description: "Busca propiedades en la base de datos de Gelabert Homes que coincidan con los requisitos del cliente.",
          parameters: {
            type: "object",
            properties: {
              operation: { type: "string", enum: ["alquiler", "venta"] },
              max_price: { type: "number" },
              min_bedrooms: { type: "number" },
              zones: { type: "array", items: { type: "string" } },
              keywords: { type: "string" }
            },
            required: ["operation"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "save_lead",
          description: "Guarda la información de contacto y TODO el perfil detallado del cliente en el CRM y le envía un email automatizado. Úsalo en cuanto el cliente proporcione su email y teléfono.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              intent: { type: "string", enum: ["alquilar", "comprar", "vender", "alquilar_propietario"] },
              notes: { type: "string", description: "Resumen MUY detallado de la conversación y lo que busca/ofrece." },
              // Detalles de Búsqueda (Alquilar/Comprar)
              max_price: { type: "number", description: "Presupuesto máximo de compra o alquiler" },
              min_bedrooms: { type: "number" },
              preferred_zones: { type: "array", items: { type: "string" } },
              has_pets: { type: "boolean", description: "Si tiene mascotas" },
              wants_terrace: { type: "boolean" },
              wants_pool: { type: "boolean" },
              wants_parking: { type: "boolean" },
              // Detalles de Venta / Ofrecer Alquiler
              sell_property_address: { type: "string" },
              sell_property_type: { type: "string" },
              sell_estimated_price: { type: "number" },
              sell_is_reformed: { type: "boolean" }
            },
            required: ["name", "email", "phone", "intent"]
          }
        }
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAiMessages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.7
      })
    });

    const aiData = await response.json();
    const responseMessage = aiData.choices[0].message;

    let finalReply = responseMessage.content;
    let propertiesToRender = null;
    let leadSaved = false;

    // Handle Tool Calls
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        
        if (toolCall.function.name === 'search_properties') {
          // Perform local search logic equivalent
          const { data, error } = await supabaseAdmin
            .from('properties')
            .select('*')
            .eq('operation', args.operation)
            .eq('commercial_status', 'disponible')
            .limit(50);
            
          let matches = data || [];
          if (args.max_price) matches = matches.filter((p: any) => p.price <= args.max_price + (args.max_price * 0.15)); // 15% flexibility
          if (args.min_bedrooms) matches = matches.filter((p: any) => p.bedrooms >= args.min_bedrooms);
          if (args.zones && args.zones.length > 0) {
            matches = matches.filter((p: any) => args.zones.some((z: string) => 
              (p.zone && p.zone.toLowerCase().includes(z.toLowerCase())) || 
              (p.city && p.city.toLowerCase().includes(z.toLowerCase()))
            ));
          }

          // We return top 5
          matches = matches.slice(0, 5);
          propertiesToRender = matches;

          // Call OpenAI again with the tool result so it can generate a natural response
          openAiMessages.push(responseMessage);
          openAiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(matches.map((p: any) => ({
              id: p.id,
              title: p.title,
              price: p.price,
              city: p.city,
              zone: p.zone,
              short_description: p.short_description,
              description: p.description,
              area_m2: p.area_m2,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              has_terrace: p.has_terrace,
              has_pool: p.has_pool,
              has_parking: p.has_parking,
              is_furnished: p.is_furnished,
              pets_allowed: p.pets_allowed
            })))
          });

          const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: openAiMessages,
              temperature: 0.7
            })
          });

          const secondAiData = await secondResponse.json();
          finalReply = secondAiData.choices[0].message.content;
        }

        if (toolCall.function.name === 'save_lead') {
          // Check if lead already exists
          const { data: existingLeads, error: checkError } = await supabaseAdmin
            .from('leads_crm')
            .select('*')
            .eq('email', args.email)
            .limit(1);

          const existingLead = existingLeads && existingLeads.length > 0 ? existingLeads[0] : null;

          let leadDataIns;
          let leadError = null;
          let isExisting = false;

          if (existingLead) {
            isExisting = true;
            // Append notes
            const newNotes = existingLead.agent_notes 
              ? `${existingLead.agent_notes}\n\n--- Nueva Consulta ---\n${args.notes}`
              : args.notes;

            const { data: updatedLead, error: updateError } = await supabaseAdmin
              .from('leads_crm')
              .update({ agent_notes: newNotes })
              .eq('id', existingLead.id)
              .select()
              .single();

            leadDataIns = updatedLead;
            leadError = updateError;
          } else {
            // Save to CRM leads table
            const { data: newLead, error: insertError } = await supabaseAdmin
              .from('leads_crm')
              .insert([{
                name: args.name,
                email: args.email,
                phone: args.phone,
                intent: args.intent || 'indefinido',
                status: 'nuevo',
                agent_notes: args.notes,
                has_pets: args.has_pets,
                max_rent: args.intent === 'alquilar' ? args.max_price : null,
                max_buy_price: args.intent === 'comprar' ? args.max_price : null,
                sell_property_address: args.sell_property_address,
                sell_property_type: args.sell_property_type,
                sell_estimated_price: args.sell_estimated_price,
                sell_is_reformed: args.sell_is_reformed
              }])
              .select()
              .single();
            leadDataIns = newLead;
            leadError = insertError;
          }
            
          if (!leadError && leadDataIns) {
            leadSaved = true;
            
            // Save search profile if buying or renting
            if (args.intent === 'alquilar' || args.intent === 'comprar') {
              await supabaseAdmin.from('leads_search_profiles').insert([{
                lead_id: leadDataIns.id,
                intent: args.intent,
                preferred_zones: args.preferred_zones,
                max_price: args.max_price,
                min_bedrooms: args.min_bedrooms,
                wants_terrace: args.wants_terrace,
                wants_pool: args.wants_pool,
                wants_parking: args.wants_parking,
                pets_needed: args.has_pets
              }]);
            }

            // TRIGGER EMAIL NOTIFICATION
            try {
              await fetch(`${SUPABASE_URL}/functions/v1/notify-lead-matches`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({
                  leadData: leadDataIns,
                  matches: propertiesToRender || [], 
                  type: args.intent
                })
              });
            } catch (e) {
              console.error("Error triggering notify-lead-matches", e);
            }
          }

          openAiMessages.push(responseMessage);
          openAiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: leadError 
              ? "Error guardando el lead en la base de datos." 
              : isExisting 
                ? "El cliente ya estaba registrado en nuestra base de datos. Se ha añadido su nueva consulta al historial de su perfil. Dile amablemente que hemos detectado que ya era cliente nuestro, que hemos actualizado su ficha con esta nueva petición, pregúntale si desea modificar algún dato adicional de su perfil, y que en breve le contactaremos."
                : "Lead guardado correctamente en la base de datos CRM de Gelabert Homes, y se le ha enviado un email de confirmación. Dile al usuario amablemente que el equipo contactará con ellos pronto y que han recibido un email."
          });

          const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: openAiMessages,
              temperature: 0.7
            })
          });
          const secondAiData = await secondResponse.json();
          finalReply = secondAiData.choices[0].message.content;
        }
      }
    }

    return new Response(JSON.stringify({
      reply: finalReply,
      properties: propertiesToRender,
      leadSaved
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("AI Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
