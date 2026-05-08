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
En cuanto tengas el email, llama a save_lead() con TODOS los datos recopilados durante la conversación (ingresos, ocupación, zona, mascotas, fechas, características del inmueble, etc.). Incluye un resumen completo en el campo notes.
Confirma: "Gracias [nombre], hemos registrado tu consulta. Un agente te contactará pronto."
Luego muestra el formulario final según el perfil.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREGUNTAS DE CUALIFICACIÓN POR PERFIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INQUILINO (busca alquiler) — intent: alquilar:
1. ¿Cuántas personas viviréis y a qué os dedicáis?
2. ¿Cuáles son los ingresos netos mensuales del hogar y cuánta antigüedad laboral tenéis?
3. ¿Tenéis mascotas?
4. ¿Qué zona preferís y cuál es el presupuesto máximo de alquiler?
5. ¿Cuándo necesitáis entrar?
Busca con search_properties(operation:"alquiler", max_price: X) y presenta numerado.
Formulario final: [SHOW_FORM:inquilino]

PROPIETARIO QUE QUIERE ALQUILAR — intent: alquilar_propietario:
1. ¿Dónde está el inmueble? (ciudad y barrio aproximado)
2. ¿Cuántas habitaciones y baños tiene? ¿Tiene garaje o trastero?
3. ¿Cuántos metros cuadrados tiene aproximadamente?
4. ¿Qué precio de alquiler mensual tienes en mente?
5. ¿Está actualmente ocupado o disponible?
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

// ── Helpers de parseo ─────────────────────────────────────────────────────────

function parseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  } catch { /* ignore */ }
  return null
}

function parseNumber(val: any): number | null {
  const n = parseFloat(String(val ?? ''))
  return isNaN(n) ? null : n
}

function parseBool(val: any): boolean | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'boolean') return val
  const s = String(val).toLowerCase()
  if (s === 'true' || s === 'si' || s === 'sí' || s === 'yes' || s === '1') return true
  if (s === 'false' || s === 'no' || s === '0') return false
  return null
}

// ── Main handler ──────────────────────────────────────────────────────────────

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
              description: 'Guarda los datos completos del cliente en el CRM. Llamar en cuanto se tenga el email. Incluir TODOS los datos recopilados durante la conversación.',
              parameters: {
                type: 'object',
                properties: {
                  // Datos básicos de contacto
                  full_name: { type: 'string', description: 'Nombre completo del usuario' },
                  email: { type: 'string', description: 'Email del usuario' },
                  phone: { type: 'string', description: 'Teléfono de contacto' },
                  intent: {
                    type: 'string',
                    enum: ['alquilar', 'comprar', 'vender', 'alquilar_propietario'],
                    description: 'Intención principal del usuario'
                  },
                  notes: { type: 'string', description: 'Resumen COMPLETO y detallado de todas las necesidades, preferencias y datos recopilados en la conversación' },

                  // Datos personales / perfil
                  occupation: { type: 'string', description: 'Ocupación o profesión del cliente' },
                  monthly_income: { type: 'number', description: 'Ingresos netos mensuales en euros' },
                  employment_seniority: { type: 'string', description: 'Antigüedad laboral (ej: 2 años, 6 meses)' },
                  num_people: { type: 'number', description: 'Número de personas que vivirán en el inmueble' },
                  has_pets: { type: 'boolean', description: 'Si el inquilino tiene mascotas' },
                  nationality: { type: 'string', description: 'Nacionalidad del cliente' },
                  city_origin: { type: 'string', description: 'Ciudad de origen del cliente' },

                  // Preferencias de búsqueda — inquilinos y compradores
                  max_rent: { type: 'number', description: 'Presupuesto máximo de alquiler mensual en euros' },
                  max_buy_price: { type: 'number', description: 'Presupuesto máximo de compra en euros' },
                  move_in_date: { type: 'string', description: 'Fecha deseada de entrada (formato YYYY-MM-DD)' },
                  buy_deadline: { type: 'string', description: 'Fecha límite para cerrar compra (formato YYYY-MM-DD)' },
                  mortgage_approved: { type: 'boolean', description: 'Si tiene hipoteca aprobada' },
                  needs_mortgage_service: { type: 'boolean', description: 'Si necesita ayuda para conseguir hipoteca' },
                  min_lease_months: { type: 'number', description: 'Meses mínimos de contrato que busca' },

                  // Datos del inmueble a vender o alquilar (propietarios)
                  sell_property_address: { type: 'string', description: 'Dirección del inmueble a vender o alquilar' },
                  sell_property_type: { type: 'string', description: 'Tipo de inmueble: piso, chalet, local, etc.' },
                  sell_num_bedrooms: { type: 'number', description: 'Número de habitaciones del inmueble' },
                  sell_num_bathrooms: { type: 'number', description: 'Número de baños del inmueble' },
                  sell_area_m2: { type: 'number', description: 'Superficie en metros cuadrados' },
                  sell_estimated_price: { type: 'number', description: 'Precio estimado por el propietario en euros' },
                  sell_has_terrace: { type: 'boolean', description: 'Si tiene terraza' },
                  sell_has_parking: { type: 'boolean', description: 'Si tiene garaje o parking' },
                  sell_has_pool: { type: 'boolean', description: 'Si tiene piscina' },
                  sell_has_elevator: { type: 'boolean', description: 'Si tiene ascensor' },
                  sell_is_furnished: { type: 'boolean', description: 'Si está amueblado' },
                  sell_is_reformed: { type: 'boolean', description: 'Si está reformado recientemente' },
                  sell_has_garden: { type: 'boolean', description: 'Si tiene jardín' },
                  sell_has_balcony: { type: 'boolean', description: 'Si tiene balcón' },
                  sell_floor: { type: 'string', description: 'Planta del inmueble' },
                  sell_orientation: { type: 'string', description: 'Orientación del inmueble (sur, norte, este, oeste)' },
                  sell_property_condition: { type: 'string', description: 'Estado del inmueble: nuevo, buen estado, a reformar' },
                  sell_additional_info: { type: 'string', description: 'Información adicional sobre el inmueble' },
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

      // ── save_lead ───────────────────────────────────────────────────────────
      if (call.function.name === 'save_lead') {
        console.log('Saving lead:', JSON.stringify(args))

        // Construir objeto con todos los campos mapeados
        const leadData: Record<string, any> = {
          name: args.full_name || null,
          email: args.email,
          phone: args.phone || null,
          intent: args.intent,
          status: 'nuevo',

          // Perfil personal
          occupation: args.occupation || null,
          monthly_income: parseNumber(args.monthly_income),
          employment_seniority: args.employment_seniority || null,
          num_people: parseNumber(args.num_people),
          has_pets: parseBool(args.has_pets),
          nationality: args.nationality || null,
          city_origin: args.city_origin || null,

          // Preferencias búsqueda
          max_rent: parseNumber(args.max_rent),
          max_buy_price: parseNumber(args.max_buy_price),
          move_in_date: parseDate(args.move_in_date),
          buy_deadline: parseDate(args.buy_deadline),
          mortgage_approved: parseBool(args.mortgage_approved),
          needs_mortgage_service: parseBool(args.needs_mortgage_service),
          min_lease_months: parseNumber(args.min_lease_months),

          // Datos inmueble (propietarios)
          sell_property_address: args.sell_property_address || null,
          sell_property_type: args.sell_property_type || null,
          sell_num_bedrooms: parseNumber(args.sell_num_bedrooms),
          sell_num_bathrooms: parseNumber(args.sell_num_bathrooms),
          sell_area_m2: parseNumber(args.sell_area_m2),
          sell_estimated_price: parseNumber(args.sell_estimated_price),
          sell_has_terrace: parseBool(args.sell_has_terrace),
          sell_has_parking: parseBool(args.sell_has_parking),
          sell_has_pool: parseBool(args.sell_has_pool),
          sell_has_elevator: parseBool(args.sell_has_elevator),
          sell_is_furnished: parseBool(args.sell_is_furnished),
          sell_is_reformed: parseBool(args.sell_is_reformed),
          sell_has_garden: parseBool(args.sell_has_garden),
          sell_has_balcony: parseBool(args.sell_has_balcony),
          sell_floor: args.sell_floor || null,
          sell_orientation: args.sell_orientation || null,
          sell_property_condition: args.sell_property_condition || null,
          sell_additional_info: args.sell_additional_info || null,

          // Transcript y notas
          agent_notes: args.notes || null,
          chat_transcript: messages,
          privacy_accepted: true,
          privacy_accepted_at: new Date().toISOString(),
        }

        // Limpiar nulos para no sobreescribir con upsert si ya hay datos
        const cleanLeadData = Object.fromEntries(
          Object.entries(leadData).filter(([_, v]) => v !== null && v !== undefined)
        )

        const { error: leadError } = await supabase
          .from('leads_crm')
          .upsert(cleanLeadData, { onConflict: 'email' })

        if (leadError) {
          console.error('save_lead DB error:', JSON.stringify(leadError))
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'save_lead',
            content: `Error al guardar el lead: ${leadError.message}`
          })
        } else {
          console.log('Lead guardado correctamente:', args.email)
          
          // Trigger Notification
          try {
            const notifyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-lead-matches`
            const summaryLines = (args.notes || '').split('\n').filter((l: string) => l.trim().length > 0)
            const summaryHtml = summaryLines.map((l: string) => `<li>${l}</li>`).join('')
            
            fetch(notifyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify({
                leadData: {
                  name: args.full_name,
                  email: args.email,
                  phone: args.phone,
                  agent_notes: args.notes
                },
                type: args.intent,
                isSummary: true,
                summaryHtml: summaryHtml ? `<ul>${summaryHtml}</ul>` : null
              })
            }).catch(err => console.error('Notification trigger error:', err))
          } catch (notifyErr) {
            console.error('Failed to prepare notification:', notifyErr)
          }

          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            name: 'save_lead',
            content: `Lead guardado correctamente. Email: ${args.email}, Intent: ${args.intent}. Todos los datos de la conversación han sido registrados en el CRM.`
          })
        }
      }

      // ── search_properties ───────────────────────────────────────────────────
      if (call.function.name === 'search_properties') {
        console.log('Searching properties:', JSON.stringify(args))

        let query = supabase
          .from('properties')
          .select('id, title, price, slug, operation, description, bedrooms, bathrooms, area_m2, zone, city')
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
            const area = p.area_m2 ? ` — ${p.area_m2}m²` : ''
            const zone = p.zone || p.city || ''
            const location = zone ? ` — ${zone}` : ''
            return `${i + 1}. ${p.title} — ${p.price?.toLocaleString('es-ES')}€ — ${beds}${area}${location}`
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

// ── persistConversation ────────────────────────────────────────────────────────

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
