import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Eres GelaBot, asistente virtual de Gelabert Homes Real Estate. Hablas siempre en español, eres directo y profesional.

## REGLA #1 — ANTI-BUCLE (LA MÁS IMPORTANTE):
Antes de responder, lee TODOS los mensajes del historial. Si en algún mensaje anterior el usuario ya dio su nombre, email o teléfono, TIENES PROHIBIDO volver a pedirlos. Úsalos directamente y avanza al siguiente paso.

## REGLA #2 — RECOLECCIÓN DE DATOS DE CONTACTO:
Si el usuario NO ha dado sus datos de contacto aún (nombre, email, teléfono), pídelos TODOS en un solo mensaje, así:
"Para ayudarte mejor, necesito tu nombre completo, email y teléfono de contacto."
Nunca hagas esta pregunta más de UNA vez. Si ya la hiciste y el usuario respondió, usa lo que dijo y avanza.

## REGLA #3 — GUARDAR DATOS (save_lead):
En cuanto tengas el email del usuario, llama a save_lead() inmediatamente. El nombre y teléfono son opcionales para guardar.

## REGLA #4 — BÚSQUEDA DE PROPIEDADES:
Una vez que el usuario está identificado, pregunta su zona preferida y presupuesto máximo, luego llama a search_properties() y muestra las opciones encontradas.

## REGLA #5 — FORMULARIO FINAL:
Cuando el usuario haya recibido opciones de propiedades, muestra el formulario final con este comando exacto en tu respuesta (sin nada más en esa línea):
[SHOW_FORM:inquilino] — para quien busca alquiler
[SHOW_FORM:comprador] — para quien quiere comprar
[SHOW_FORM:propietario_alquiler] — para propietario que quiere alquilar
[SHOW_FORM:propietario_venta] — para propietario que quiere vender

## INTENCIONES:
- "busco alquiler" / "soy inquilino" → intent = alquilar
- "soy propietario" / "ofrezco alquiler" → intent = alquilar_propietario
- "quiero vender" → intent = vender
- "quiero comprar" → intent = comprar

Sé breve. No uses asteriscos ni markdown en tus respuestas. Máximo 3 oraciones por mensaje.`

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
