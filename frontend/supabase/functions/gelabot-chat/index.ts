import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    const systemPrompt = `# GELABOT — AGENTE VIRTUAL GELABERT HOMES
Eres GelaBot, el agente virtual de Gelabert Homes Real Estate. Tu misión es captar leads y cualificarlos siguiendo un flujo estricto.

## REGLAS DE ORO (MANDATORIAS)
1. SOLO hablas de temas inmobiliarios de Gelabert Homes. Si preguntan otra cosa, di que solo puedes ayudar con esto.
2. COMISIONES/HONORARIOS: Responde: "El agente le informará detalladamente sobre honorarios y condiciones durante la llamada." No des cifras.
3. NO detectar duplicados en la misma sesión. Si un cliente vuelve a dar datos, actualiza su ficha o abre una nueva búsqueda si es necesario.
4. NUNCA inventes datos de propiedades. Si no hay coincidencias, admítelo y ofrece completar el formulario para futuros avisos.
5. COINCIDENCIAS: Deben ser reales. Si no coinciden exactamente, puedes recomendar diciendo: "Sé que no es exactamente lo que buscas, pero también tenemos estas opciones...".
6. CIERRE: Al finalizar, menciona que se enviará un correo con el resumen.

## FLUJO DE CONVERSACIÓN
### 1. Saludo Inicial
"Hola, soy GelaBot, el agente Virtual de Gelabert Homes Real Estate, ¿qué estás buscando?"
Opciones:
- Soy inquilino y busco alquiler
- Soy propietario y ofrezco alquiler
- Vender
- Comprar

### 2. Caso: Inquilino buscando alquiler
1. Solicitar: Nombre completo, Teléfono y Correo.
2. GUARDAR INMEDIATAMENTE en el CRM (usar tool save_lead).
3. Preguntar: Zona, precio máximo y características. Guardar en un solo campo "tipo busqueda".
4. BUSCAR COINCIDENCIAS (usar tool search_properties).
5. Ofrecer coincidencias PERSONALIZADAS y POR SEPARADO. Solo enviar el enlace.
6. Preguntar si le interesa alguna por número (ej: "la número 1").
7. Si hay interés o no hay coincidencias: Mostrar FORMULARIO DE CUALIFICACIÓN (indicar al frontend que debe mostrar el form).
   Campos: Personas, ocupación, ingresos (por separado), antigüedad empresa, edades, procedencia, fecha disponibilidad, aceptación política privacidad.

### 3. Caso: Propietarios (Alquiler o Venta)
1. Solicitar: Nombre, Correo, Teléfono.
2. Mostrar FORMULARIO DE PROPIEDAD.
   Campos: Dirección completa, habitaciones, baños, m2, planta, parking, precio, fecha disponibilidad, características adicionales (aire, terraza...), aceptación privacidad.
3. Despedida: "Un agente se pondrá en contacto con usted lo antes posible."

### 4. Caso: Compradores
1. Solicitar: Nombre, Correo, Teléfono.
2. Preguntar: Precio máximo, zona, habitaciones, características, fecha compra.
3. BUSCAR COINCIDENCIAS en propiedades de venta.
4. Ofrecer recomendaciones (incluso si no coinciden al 100%, con aviso).
5. Mostrar FORMULARIO DE COMPRA.
   Campos: Fecha compra, precio máximo, zona, hipoteca concedida o necesita servicio de brokers (destacar que trabajamos con brokers para mejores condiciones), aceptación privacidad.

## NOTAS TÉCNICAS
- Cuando necesites que el frontend muestre un formulario, incluye en tu respuesta el comando: [SHOW_FORM:tipo_form] donde tipo_form puede ser 'inquilino', 'propietario_alquiler', 'propietario_venta', 'comprador'.
- Cuando envíes propiedades, usa el formato: Propiedad [Número]: [Título] - [Enlace]`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_lead",
              description: "Guarda o actualiza un lead en el CRM",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  intent: { type: "string", enum: ["alquilar", "alquilar_propietario", "vender", "comprar"] },
                  search_preferences: { type: "string", description: "Campo 'tipo busqueda' con zona, precio, etc." },
                  qualification_data: { type: "object", description: "Datos del formulario" }
                },
                required: ["email"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "search_properties",
              description: "Busca propiedades en la base de datos",
              parameters: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["alquiler", "venta"] },
                  max_price: { type: "number" },
                  zone: { type: "string" },
                  min_rooms: { type: "number" }
                }
              }
            }
          }
        ]
      })
    })

    const data = await response.json()
    const message = data.choices?.[0]?.message
    let botReply = message?.content || "";
    const toolCalls = message?.tool_calls;

    if (toolCalls) {
      const toolResults = []
      for (const call of toolCalls) {
        if (call.function.name === "save_lead") {
          const args = JSON.parse(call.function.arguments)
          const q = args.qualification_data || {}
          
          const leadData = {
            name: args.full_name || q.nombre,
            email: args.email,
            phone: args.phone || q.telefono,
            intent: args.intent,
            status: 'nuevo',
            // Mapeo de cualificación a columnas reales del CRM
            num_people: q.personas ? parseInt(q.personas) : undefined,
            occupation: q.ocupacion,
            monthly_income: q.ingresos ? parseFloat(q.ingresos.replace(/[^0-9.]/g, '')) : undefined,
            employment_seniority: q.antiguedad,
            city_origin: q.procedencia || q.edades_procedencia,
            move_in_date: q.fecha_disponibilidad,
            max_rent: args.intent === 'alquilar' ? (args.search_preferences ? parseFloat(args.search_preferences.match(/\d+/)?.[0] || '0') : undefined) : undefined,
            max_buy_price: args.intent === 'comprar' ? (args.search_preferences ? parseFloat(args.search_preferences.match(/\d+/)?.[0] || '0') : undefined) : undefined,
            agent_notes: `Búsqueda: ${args.search_preferences || ''}. Detalles: ${q.adicionales || ''}`,
            sell_property_address: q.direccion,
            sell_num_bedrooms: q.habitaciones ? parseInt(q.habitaciones) : undefined,
            sell_num_bathrooms: q.banos ? parseInt(q.banos) : undefined,
            sell_area_m2: q.m2 ? parseInt(q.m2) : undefined,
            sell_floor: q.planta,
            sell_has_parking: q.parking,
            sell_estimated_price: q.precio ? parseFloat(q.precio) : undefined,
            needs_mortgage_service: q.hipoteca === 'necesito',
            buy_deadline: q.fecha_compra
          }

          const { data: lead, error } = await supabase.from('leads_crm').upsert(leadData, { onConflict: 'email' }).select().single()
          
          if (!error && args.qualification_data) {
            try {
              await supabase.functions.invoke('notify-lead-matches', {
                body: { 
                  leadData: {
                    name: leadData.name,
                    email: leadData.email,
                    phone: leadData.phone,
                    status: 'nuevo',
                    agent_notes: leadData.agent_notes
                  },
                  type: args.intent,
                  isSummary: true,
                  summaryHtml: `<ul>${Object.entries(q).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('')}</ul>`
                }
              })
            } catch (e) {
              console.error('Error enviando notificación:', e)
            }
          }

          toolResults.push({
            tool_call_id: call.id,
            role: "tool",
            name: "save_lead",
            content: error ? `Error: ${error.message}` : "Lead guardado y notificado."
          })
        }

        if (call.function.name === "search_properties") {
          const args = JSON.parse(call.function.arguments)
          let query = supabase.from('properties').select('*').eq('commercial_status', 'disponible')
          
          if (args.type === 'alquiler') query = query.eq('operation', 'alquiler')
          if (args.type === 'venta') query = query.eq('operation', 'venta')
          if (args.max_price) query = query.lte('price', args.max_price)
          
          const { data: props, error } = await query.limit(5)
          
          toolResults.push({
            tool_call_id: call.id,
            role: "tool",
            name: "search_properties",
            content: JSON.stringify(props || [])
          })
        }
      }

      // Segunda llamada para procesar resultados de herramientas
      const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
            message,
            ...toolResults
          ]
        })
      })
      const secondData = await secondResponse.json()
      botReply = secondData.choices?.[0]?.message?.content || ""
    }

    // Si el bot dice que ha terminado o guardado todo, podríamos disparar el email aquí
    // Pero el usuario dice "al finalizar el chat", lo cual es mejor manejarlo desde el frontend o con un hook.
    // De momento, devolvemos la respuesta.

    return new Response(JSON.stringify({ reply: botReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ reply: "Lo siento, he tenido un problema técnico. ¿Podemos intentarlo de nuevo?" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

