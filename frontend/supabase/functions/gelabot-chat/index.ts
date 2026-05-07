import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Eres GelaBot, el asistente virtual de Gelabert Homes Real Estate. Hablas siempre en español. Eres profesional, cercano y conciso. Nunca uses asteriscos, guiones ni markdown en tus respuestas. Máximo 3 oraciones por mensaje.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLA ABSOLUTA — ANTI-BUCLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lee SIEMPRE todo el historial antes de responder. Si el nombre, email o teléfono del usuario ya aparecen en cualquier mensaje previo, TIENES PROHIBIDO volver a pedirlos. Avanza directamente al paso siguiente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 1 — DATOS DE CONTACTO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Si el usuario no ha dado aún su nombre, email y teléfono, pídelos todos juntos en UN SOLO mensaje:
"Para poder ayudarte y registrar tu consulta, necesito tu nombre completo, email y número de teléfono."
Haz esta pregunta una única vez. En cuanto tengas el email, llama inmediatamente a save_lead().

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASO 2 — FLUJO SEGÚN INTENCIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ CASO A: INQUILINO (busca alquiler)
intent = alquilar
Tras identificarlo, pregunta:
1. ¿Cuántas personas vivirán en el piso? ¿A qué se dedican?
2. ¿Cuáles son sus ingresos netos mensuales y cuánta antigüedad laboral tienen?
3. ¿Qué zona o barrio prefieren y cuál es su presupuesto máximo de alquiler?
4. ¿Cuándo necesitan entrar?
Luego llama a search_properties(operation: "alquiler") y muestra resultados.
Finaliza con: [SHOW_FORM:inquilino]

▶ CASO B: PROPIETARIO QUE QUIERE ALQUILAR
intent = alquilar_propietario
Tras identificarlo, pregunta:
1. ¿Dónde está el inmueble? (dirección completa)
2. ¿Cuántas habitaciones y baños tiene?
3. ¿Qué precio de alquiler tiene en mente?
4. ¿Está actualmente ocupado o disponible?
Explícale que Gelabert Homes gestiona el alquiler de forma integral (publicación, selección de inquilinos, contratos).
Finaliza con: [SHOW_FORM:propietario_alquiler]

▶ CASO C: COMPRADOR (quiere comprar)
intent = comprar
Tras identificarlo, pregunta:
1. ¿Qué tipo de inmueble busca? (piso, casa, local...)
2. ¿En qué zona o barrio?
3. ¿Cuál es su presupuesto máximo?
4. ¿Tiene financiación aprobada o necesita hipoteca?
Luego llama a search_properties(operation: "venta") y muestra resultados.
Finaliza con: [SHOW_FORM:comprador]

▶ CASO D: PROPIETARIO QUE QUIERE VENDER
intent = vender
Tras identificarlo, pregunta:
1. ¿Dónde está el inmueble? (dirección completa)
2. ¿Cuántas habitaciones y baños tiene? ¿Qué superficie aproximada?
3. ¿Tiene algún precio en mente o necesita valoración?
4. ¿Cuándo le gustaría vender?
Explícale que Gelabert Homes se encarga de la valoración, marketing y gestión de la venta.
Finaliza con: [SHOW_FORM:propietario_venta]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMANDOS DE FORMULARIO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usa exactamente uno de estos comandos al final cuando corresponda:
[SHOW_FORM:inquilino]
[SHOW_FORM:comprador]
[SHOW_FORM:propietario_alquiler]
[SHOW_FORM:propietario_venta]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONO Y ESTILO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Habla de forma natural y humana. Si el usuario vuelve tras una conversación previa, salúdale por su nombre y pregúntale si quiere continuar con su búsqueda o necesita algo nuevo. Nunca repitas preguntas ya contestadas.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages, externalId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ reply: 'Error: API Key de OpenAI no configurada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Llamada principal a OpenAI
    const openAIBody = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'save_lead',
            description: 'Guarda los datos del usuario en el CRM. Llamar en cuanto se tenga el email.',
            parameters: {
              type: 'object',
              properties: {
                full_name: { type: 'string', description: 'Nombre completo del usuario' },
                email: { type: 'string', description: 'Email del usuario' },
                phone: { type: 'string', description: 'Teléfono del usuario' },
                intent: {
                  type: 'string',
                  enum: ['alquilar', 'alquilar_propietario', 'vender', 'comprar'],
                  description: 'Intención del usuario'
                }
              },
              required: ['email', 'intent']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'search_properties',
            description: 'Busca propiedades disponibles en la base de datos según criterios.',
            parameters: {
              type: 'object',
              properties: {
                operation: { type: 'string', enum: ['alquiler', 'venta'], description: 'Tipo de operación' },
                max_price: { type: 'number', description: 'Precio máximo en euros' },
                zone: { type: 'string', description: 'Zona o barrio preferido' }
              }
            }
          }
        }
      ],
      tool_choice: 'auto'
    }

    const firstRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(openAIBody)
    })

    const firstData = await firstRes.json()

    if (!firstRes.ok) {
      console.error('OpenAI error:', JSON.stringify(firstData))
      return new Response(JSON.stringify({ reply: 'Error al conectar con la IA. Inténtalo de nuevo.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const assistantMessage = firstData.choices?.[0]?.message
    const toolCalls = assistantMessage?.tool_calls

    // Si no hay tool calls, devolvemos la respuesta directamente
    if (!toolCalls || toolCalls.length === 0) {
      const botReply = assistantMessage?.content || ''

      // Persistir conversación
      if (externalId) {
        const updatedHistory = [
          ...messages,
          { role: 'assistant', content: botReply }
        ]
        await supabase.from('gelabot_conversations').upsert(
          { external_id: externalId, messages: updatedHistory, updated_at: new Date().toISOString() },
          { onConflict: 'external_id' }
        )
      }

      return new Response(JSON.stringify({ reply: botReply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Hay tool calls: ejecutarlos
    const toolResults: any[] = []

    for (const call of toolCalls) {
      const args = JSON.parse(call.function.arguments)

      if (call.function.name === 'save_lead') {
        const { error } = await supabase.from('leads_crm').upsert({
          name: args.full_name || null,
          email: args.email,
          phone: args.phone || null,
          intent: args.intent,
          status: 'nuevo'
        }, { onConflict: 'email' })

        toolResults.push({
          tool_call_id: call.id,
          role: 'tool',
          name: 'save_lead',
          content: error
            ? `Error guardando lead: ${error.message}`
            : `Lead guardado correctamente. Email: ${args.email}`
        })
      }

      if (call.function.name === 'search_properties') {
        let query = supabase
          .from('properties')
          .select('id, title, price, slug, operation, description, bedrooms, bathrooms, sqft, main_image')
          .eq('commercial_status', 'disponible')

        if (args.operation) query = query.eq('operation', args.operation)
        if (args.max_price) query = query.lte('price', args.max_price)

        const { data: props, error: searchError } = await query.limit(4)

        if (searchError) {
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'search_properties',
            content: `Error en búsqueda: ${searchError.message}`
          })
        } else if (!props || props.length === 0) {
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'search_properties',
            content: 'No se encontraron propiedades con esos criterios. Sugiere al usuario ampliar el presupuesto o cambiar zona.'
          })
        } else {
          const propList = props.map((p: any) =>
            `- ${p.title} | ${p.price}€ | ${p.bedrooms || '?'} hab | https://gelaberthomes.com/propiedades/${p.slug}`
          ).join('\n')
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'search_properties',
            content: `Propiedades encontradas:\n${propList}`
          })
        }
      }
    }

    // Segunda llamada a OpenAI con los resultados de las herramientas
    const secondRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
          assistantMessage,
          ...toolResults
        ]
      })
    })

    const secondData = await secondRes.json()
    const botReply = secondData.choices?.[0]?.message?.content || ''

    // Persistir conversación final
    if (externalId) {
      const updatedHistory = [
        ...messages,
        assistantMessage,
        ...toolResults,
        { role: 'assistant', content: botReply }
      ]
      await supabase.from('gelabot_conversations').upsert(
        { external_id: externalId, messages: updatedHistory, updated_at: new Date().toISOString() },
        { onConflict: 'external_id' }
      )
    }

    return new Response(JSON.stringify({ reply: botReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('GelaBot Edge Function error:', err)
    return new Response(JSON.stringify({ reply: 'Error inesperado. Por favor, inténtalo de nuevo.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})
