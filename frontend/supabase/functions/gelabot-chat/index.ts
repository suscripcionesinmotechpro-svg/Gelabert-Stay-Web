import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Eres GelaBot, el asistente virtual de Gelabert Homes Real Estate. Hablas siempre en español, eres cercano y profesional. Nunca uses asteriscos, markdown ni emojis en tus respuestas. Máximo 3-4 oraciones por mensaje.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLA ABSOLUTA — ANTI-BUCLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Antes de cada respuesta, lee TODO el historial. Si el nombre, email o teléfono ya aparecen, NO los vuelvas a pedir. Avanza al siguiente paso.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FLUJO GENERAL (para todos los perfiles):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE 1 — ENTENDER NECESIDADES (sin pedir contacto aún):
Haz las preguntas de cualificación según el perfil del usuario. Una o dos preguntas por mensaje, de forma natural.

FASE 2 — BUSCAR Y PRESENTAR PROPIEDADES:
Usa search_properties() con los criterios recogidos. Presenta los resultados NUMERADOS, así:
"1. [Título] — [Precio]€/mes — [X] hab. — [zona si se conoce]"
"2. [Título] — [Precio]€/mes — [X] hab."
Luego pregunta: "¿Cuál de estas opciones te llama más la atención? Dime el número."

FASE 3 — SOLICITAR DATOS DE CONTACTO:
Cuando el usuario indique qué propiedad le interesa (o si es propietario que quiere gestionar), di exactamente esto:
"Perfecto. Para que uno de nuestros agentes se ponga en contacto contigo y concierte una visita, necesito tus datos: nombre completo, email y número de teléfono."
Pide estos datos UNA SOLA VEZ.

FASE 4 — GUARDAR Y CONFIRMAR:
En cuanto tengas el email, llama a save_lead() con todos los datos recopilados.
Confirma: "Gracias [nombre], hemos registrado tu consulta. Un agente te contactará pronto."
Luego muestra el formulario final según el perfil.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREGUNTAS DE CUALIFICACIÓN POR PERFIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INQUILINO (busca alquiler) — intent: alquilar:
1. ¿Cuántas personas viviréis y a qué os dedicáis?
2. ¿Cuáles son los ingresos netos mensuales del hogar y cuánta antigüedad laboral tenéis?
3. ¿Qué zona preferís y cuál es el presupuesto máximo de alquiler?
4. ¿Cuándo necesitáis entrar?
Busca con search_properties(operation:"alquiler", max_price: X) y presenta numerado.
Formulario final: [SHOW_FORM:inquilino]

PROPIETARIO QUE QUIERE ALQUILAR — intent: alquilar_propietario:
1. ¿Dónde está el inmueble? (ciudad y barrio aproximado)
2. ¿Cuántas habitaciones y baños tiene? ¿Tiene garaje o trastero?
3. ¿Qué precio de alquiler mensual tienes en mente?
4. ¿Está actualmente ocupado o disponible?
No busques propiedades. Explica que Gelabert Homes gestiona todo: publicación, selección de inquilinos y contratos.
Formulario final: [SHOW_FORM:propietario_alquiler]

COMPRADOR (quiere comprar) — intent: comprar:
1. ¿Qué tipo de inmueble buscas? (piso, chalet, adosado, local...)
2. ¿En qué zona o barrio?
3. ¿Cuál es tu presupuesto máximo?
4. ¿Tienes financiación aprobada o necesitarías hipoteca?
Busca con search_properties(operation:"venta", max_price: X) y presenta numerado.
Formulario final: [SHOW_FORM:comprador]

PROPIETARIO QUE QUIERE VENDER — intent: vender:
1. ¿Dónde está el inmueble?
2. ¿Cuántas habitaciones, baños y qué superficie aproximada tiene?
3. ¿Tienes un precio en mente o necesitas una valoración de mercado?
4. ¿Cuándo te gustaría tener todo listo para la venta?
No busques propiedades. Explica que Gelabert Homes hace valoración, marketing profesional y gestión completa.
Formulario final: [SHOW_FORM:propietario_venta]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMANDOS DE FORMULARIO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Escribe el comando exacto al final de tu mensaje cuando sea el momento:
[SHOW_FORM:inquilino]
[SHOW_FORM:comprador]
[SHOW_FORM:propietario_alquiler]
[SHOW_FORM:propietario_venta]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USUARIOS QUE REGRESAN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Si el historial ya tiene datos de una conversación anterior, saluda al usuario por su nombre y pregúntale si quiere continuar con su búsqueda anterior o necesita algo nuevo.`

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
      return new Response(JSON.stringify({ reply: 'Error: falta la API Key de OpenAI en la configuración.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Primera llamada a OpenAI ──────────────────────────────────────────────
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
              description: 'Guarda los datos del cliente en el CRM. Llamar en cuanto se tenga el email del usuario.',
              parameters: {
                type: 'object',
                properties: {
                  full_name: { type: 'string', description: 'Nombre completo del usuario' },
                  email: { type: 'string', description: 'Email del usuario' },
                  phone: { type: 'string', description: 'Teléfono de contacto' },
                  intent: {
                    type: 'string',
                    enum: ['alquilar', 'comprar', 'vender', 'alquilar_propietario'],
                    description: 'Intención principal del usuario'
                  },
                  notes: { type: 'string', description: 'Resumen de necesidades y preferencias del usuario recopiladas en la conversación' }
                },
                required: ['email', 'intent']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'search_properties',
              description: 'Busca propiedades disponibles en la base de datos según los criterios del usuario.',
              parameters: {
                type: 'object',
                properties: {
                  operation: {
                    type: 'string',
                    enum: ['alquiler', 'venta'],
                    description: 'Tipo de operación: alquiler o venta'
                  },
                  max_price: {
                    type: 'number',
                    description: 'Precio máximo en euros'
                  },
                  min_bedrooms: {
                    type: 'number',
                    description: 'Número mínimo de habitaciones'
                  }
                },
                required: ['operation']
              }
            }
          }
        ],
        tool_choice: 'auto'
      })
    })

    const openAIData = await openAIResponse.json()

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', JSON.stringify(openAIData))
      return new Response(JSON.stringify({ reply: 'Ha habido un problema al conectar con el asistente. Por favor, inténtalo de nuevo.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const assistantMessage = openAIData.choices?.[0]?.message
    const toolCalls = assistantMessage?.tool_calls

    // Sin tool calls → respuesta directa
    if (!toolCalls || toolCalls.length === 0) {
      const botReply = assistantMessage?.content || ''
      await persistConversation(supabase, externalId, messages, botReply)
      return new Response(JSON.stringify({ reply: botReply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Ejecutar tool calls ───────────────────────────────────────────────────
    const toolResults: any[] = []

    for (const call of toolCalls) {
      let args: any = {}
      try {
        args = JSON.parse(call.function.arguments)
      } catch {
        console.error('Error parsing tool arguments:', call.function.arguments)
      }

      if (call.function.name === 'save_lead') {
        console.log('Saving lead:', JSON.stringify(args))

        const { error: leadError } = await supabase
          .from('leads_crm')
          .upsert({
            name: args.full_name || null,
            email: args.email,
            phone: args.phone || null,
            intent: args.intent,
            status: 'nuevo'
          }, { onConflict: 'email' })

        if (leadError) {
          console.error('save_lead DB error:', JSON.stringify(leadError))
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'save_lead',
            content: `Error al guardar el lead: ${leadError.message}`
          })
        } else {
          // Intenta añadir notes si la columna existe (falla silenciosamente si no)
          if (args.notes) {
            await supabase.from('leads_crm').update({ notes: args.notes }).eq('email', args.email)
          }
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'save_lead',
            content: `Lead guardado correctamente. Email: ${args.email}, Intent: ${args.intent}.`
          })
        }
      }

      if (call.function.name === 'search_properties') {
        console.log('Searching properties:', JSON.stringify(args))

        let query = supabase
          .from('properties')
          .select('id, title, price, slug, operation, description, bedrooms, bathrooms, sqft, main_image')
          .eq('commercial_status', 'disponible')

        if (args.operation) query = query.eq('operation', args.operation)
        if (args.max_price) query = query.lte('price', args.max_price)
        if (args.min_bedrooms) query = query.gte('bedrooms', args.min_bedrooms)

        const { data: props, error: searchError } = await query.order('price', { ascending: true }).limit(5)

        if (searchError) {
          console.error('search_properties DB error:', JSON.stringify(searchError))
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'search_properties',
            content: `Error en la búsqueda de propiedades: ${searchError.message}`
          })
        } else if (!props || props.length === 0) {
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'search_properties',
            content: 'No se encontraron propiedades disponibles con esos criterios. Informa al usuario y sugiere ampliar el presupuesto o cambiar la zona.'
          })
        } else {
          const list = props.map((p: any, i: number) => {
            const beds = p.bedrooms ? `${p.bedrooms} hab.` : 'estudio'
            const sqft = p.sqft ? ` — ${p.sqft}m²` : ''
            return `${i + 1}. ${p.title} — ${p.price?.toLocaleString('es-ES')}€ — ${beds}${sqft}`
          }).join('\n')

          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'search_properties',
            content: `Propiedades encontradas (${props.length}):\n${list}\n\nPregunta al usuario cuál le interesa más (dile que indique el número).`
          })
        }
      }
    }

    // ── Segunda llamada con resultados de herramientas ────────────────────────
    const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
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

    const secondData = await secondResponse.json()
    const botReply = secondData.choices?.[0]?.message?.content || ''

    await persistConversation(supabase, externalId, messages, botReply)

    return new Response(JSON.stringify({ reply: botReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('GelaBot fatal error:', err)
    return new Response(JSON.stringify({ reply: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})

// ── Helpers ────────────────────────────────────────────────────────────────────

async function persistConversation(supabase: any, externalId: string, previousMessages: any[], botReply: string) {
  if (!externalId) return
  try {
    const updatedHistory = [
      ...previousMessages,
      { role: 'assistant', content: botReply }
    ]
    const { error } = await supabase
      .from('gelabot_conversations')
      .upsert(
        { external_id: externalId, messages: updatedHistory, updated_at: new Date().toISOString() },
        { onConflict: 'external_id' }
      )
    if (error) console.error('persistConversation error:', JSON.stringify(error))
  } catch (e) {
    console.error('persistConversation exception:', e)
  }
}
