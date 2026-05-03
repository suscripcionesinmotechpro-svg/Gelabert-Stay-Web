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

FLUJO ESTRICTO DE CUALIFICACIÓN (Sigue este orden paso a paso):

1. CAPTACIÓN DE CONTACTO BÁSICO:
   - Saluda amigablemente y dile que para abrir su ficha necesitas su nombre completo, email y teléfono.
   - ¡IMPORTANTE! NO preguntes NADA más (ni qué busca ni datos personales) hasta que te dé estos tres datos.
   - En el instante en que te los dé, usa la función "save_lead" INMEDIATAMENTE.

2. DESCUBRIMIENTO DE LA PROPIEDAD IDEAL (PASO A PASO):
   - Una vez tienes sus datos de contacto, pregúntale qué tipo de operación desea (alquilar, comprar, vender).
   - PREGUNTA LOS DETALLES DE LA PROPIEDAD (solo 1 o 2 preguntas a la vez para no agobiar):
     * Si busca alquilar o comprar: ¿Qué zonas le interesan? ¿Presupuesto máximo? ¿Cuántas habitaciones y baños? ¿Características especiales (terraza, piscina, parking)? ¿Para qué fecha lo necesita?
     * Si ofrece para vender o alquilar: ¿Dirección completa? ¿Características (m2, habitaciones, baños, terraza, parking)? ¿Precio pensado?

3. BÚSQUEDA Y PRESENTACIÓN DE OPCIONES:
   - SOLO cuando tengas claro qué busca o qué ofrece (al menos zonas, presupuesto, habitaciones), usa la función "search_properties" para buscar en la base de datos.
   - Preséntale las opciones una a una, destacando lo que encaja con lo que pidió. Si no hay coincidencias exactas, ofrécele alternativas claras diciendo "Sé que no es exactamente lo que buscas, pero...".

4. CUALIFICACIÓN DE PERFIL PERSONAL (DESPUÉS DE MOSTRAR OPCIONES):
   - Una vez le has mostrado opciones y han comentado sobre ellas, es el momento de cualificar su perfil personal para nuestro equipo comercial.
   - Pregunta de forma conversacional (no todo de golpe):
     * Inquilino: ¿A qué se dedican / nivel de ingresos mensuales? ¿De dónde son? ¿Tienen mascotas?
     * Comprador: ¿Tienen la hipoteca aprobada? Si no, ofrécele nuestro servicio de Broker.

5. ACTUALIZACIÓN SILENCIOSA:
   - Usa "save_lead" de nuevo en segundo plano para actualizar los nuevos datos que te vaya dando. Nunca le digas "he actualizado tu ficha".

6. FINALIZACIÓN Y RESUMEN:
   - Cuando tengas toda la información de la propiedad que busca/ofrece Y su perfil personal, dile que un agente experto se pondrá en contacto con él pronto.
   - En ESE MISMO INSTANTE, usa obligatoriamente la función "send_summary_email" para enviarle el correo resumen con nuestra política de privacidad.
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
              // Inquilinos
              num_people: { type: "number", description: "Cantidad de personas" },
              move_in_date: { type: "string", description: "Fecha en la que buscan mudarse. FORMATO OBLIGATORIO: YYYY-MM-DD" },
              occupation: { type: "string", description: "A qué se dedican" },
              monthly_income: { type: "number", description: "Ingresos mensuales" },
              age: { type: "number", description: "Edad/Edades" },
              city_origin: { type: "string", description: "De dónde son" },
              has_pets: { type: "boolean", description: "Si tiene mascotas" },
              
              // Compradores
              max_price: { type: "number", description: "Presupuesto máximo de compra o alquiler" },
              mortgage_approved: { type: "boolean", description: "Si tienen la hipoteca aprobada" },
              needs_mortgage_service: { type: "boolean", description: "Si no la tienen, si necesitan servicio de broker" },
              buy_deadline: { type: "string", description: "Fecha en la que piensan comprar. FORMATO OBLIGATORIO: YYYY-MM-DD" },
              
              // Vendedores / Propietarios Alquiler
              sell_property_address: { type: "string", description: "Dirección completa de la propiedad" },
              sell_property_type: { type: "string" },
              sell_estimated_price: { type: "number", description: "Precio pensado o renta pensada" },
              sell_num_bedrooms: { type: "number" },
              sell_num_bathrooms: { type: "number" },
              sell_has_terrace: { type: "boolean" },
              sell_has_parking: { type: "boolean" },
              sell_area_m2: { type: "number" },
              
              // Comunes Búsqueda
              min_bedrooms: { type: "number" },
              preferred_zones: { type: "array", items: { type: "string" } }
            },
            required: ["name", "email", "phone"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "send_summary_email",
          description: "Envía el correo de confirmación y resumen al cliente al finalizar la sesión. Úsalo SIEMPRE al final de la conversación, cuando le dices que un agente se pondrá en contacto con él.",
          parameters: {
            type: "object",
            properties: {
              email: { type: "string", description: "El correo electrónico del cliente" },
              summary_html: { type: "string", description: "Un resumen detallado en formato HTML (con <ul>, <li>, <strong>) de toda la información que te ha dado (qué busca o ofrece, presupuesto, plazos, etc.)." }
            },
            required: ["email", "summary_html"]
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
            // Prepare fields to update
            const updateFields: any = {};
            if (args.notes) updateFields.agent_notes = existingLead.agent_notes ? `${existingLead.agent_notes}\n\n--- Nueva Consulta ---\n${args.notes}` : args.notes;
            if (args.intent) updateFields.intent = args.intent;
            if (args.phone) updateFields.phone = args.phone;
            if (args.name) updateFields.name = args.name;
            
            // Only update fields if they are provided
            if (args.num_people) updateFields.num_people = args.num_people;
            if (args.move_in_date) updateFields.move_in_date = (() => { try { return new Date(args.move_in_date).toISOString().split('T')[0]; } catch { return null; } })();
            if (args.occupation) updateFields.occupation = args.occupation;
            if (args.monthly_income) updateFields.monthly_income = args.monthly_income;
            if (args.age) updateFields.age = args.age;
            if (args.city_origin) updateFields.city_origin = args.city_origin;
            if (args.has_pets !== undefined) updateFields.has_pets = args.has_pets;
            if (args.intent === 'alquilar' && args.max_price) updateFields.max_rent = args.max_price;
            
            if (args.intent === 'comprar' && args.max_price) updateFields.max_buy_price = args.max_price;
            if (args.mortgage_approved !== undefined) updateFields.mortgage_approved = args.mortgage_approved;
            if (args.needs_mortgage_service !== undefined) updateFields.needs_mortgage_service = args.needs_mortgage_service;
            if (args.buy_deadline) updateFields.buy_deadline = (() => { try { return new Date(args.buy_deadline).toISOString().split('T')[0]; } catch { return null; } })();
            
            if (args.sell_property_address) updateFields.sell_property_address = args.sell_property_address;
            if (args.sell_property_type) updateFields.sell_property_type = args.sell_property_type;
            if (args.sell_estimated_price) updateFields.sell_estimated_price = args.sell_estimated_price;
            if (args.sell_num_bedrooms) updateFields.sell_num_bedrooms = args.sell_num_bedrooms;
            if (args.sell_num_bathrooms) updateFields.sell_num_bathrooms = args.sell_num_bathrooms;
            if (args.sell_has_terrace !== undefined) updateFields.sell_has_terrace = args.sell_has_terrace;
            if (args.sell_has_parking !== undefined) updateFields.sell_has_parking = args.sell_has_parking;
            if (args.sell_area_m2) updateFields.sell_area_m2 = args.sell_area_m2;

            const { data: updatedLead, error: updateError } = await supabaseAdmin
              .from('leads_crm')
              .update(updateFields)
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
                // Inquilino
                num_people: args.num_people,
                move_in_date: (() => { try { return args.move_in_date ? new Date(args.move_in_date).toISOString().split('T')[0] : null; } catch { return null; } })(),
                occupation: args.occupation,
                monthly_income: args.monthly_income,
                age: args.age,
                city_origin: args.city_origin,
                has_pets: args.has_pets,
                max_rent: args.intent === 'alquilar' ? args.max_price : null,
                // Comprador
                max_buy_price: args.intent === 'comprar' ? args.max_price : null,
                mortgage_approved: args.mortgage_approved,
                needs_mortgage_service: args.needs_mortgage_service,
                buy_deadline: (() => { try { return args.buy_deadline ? new Date(args.buy_deadline).toISOString().split('T')[0] : null; } catch { return null; } })(),
                // Vendedor / Propietario Alquiler
                sell_property_address: args.sell_property_address,
                sell_property_type: args.sell_property_type,
                sell_estimated_price: args.sell_estimated_price,
                sell_num_bedrooms: args.sell_num_bedrooms,
                sell_num_bathrooms: args.sell_num_bathrooms,
                sell_has_terrace: args.sell_has_terrace,
                sell_has_parking: args.sell_has_parking,
                sell_area_m2: args.sell_area_m2
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

            // TRIGGER EMAIL NOTIFICATION (Solo Admin en save_lead)
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
                  type: args.intent,
                  adminOnly: true
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

        if (toolCall.function.name === 'send_summary_email') {
          const { data: leadDataIns } = await supabaseAdmin
            .from('leads_crm')
            .select('*')
            .eq('email', args.email)
            .limit(1)
            .single();

          if (leadDataIns) {
            try {
              await fetch(`${SUPABASE_URL}/functions/v1/notify-lead-matches`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({
                  leadData: leadDataIns,
                  type: leadDataIns.intent,
                  isSummary: true,
                  summaryHtml: args.summary_html
                })
              });
            } catch (e) {
              console.error("Error triggering summary email", e);
            }
          }

          openAiMessages.push(responseMessage);
          openAiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: "Correo resumen enviado correctamente. Despídete del usuario confirmando que se lo has enviado y recuérdale que el correo contiene nuestra política de privacidad."
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
