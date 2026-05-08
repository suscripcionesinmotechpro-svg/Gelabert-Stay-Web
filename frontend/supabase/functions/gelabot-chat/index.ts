import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Eres GelaBot, el asistente virtual experto de Gelabert Homes. Ayudas en alquiler, compra y venta.

REGLAS CRÍTICAS:
1. MEMORIA Y SALUDO:
   - Si recibes un bloque de "MEMORIA DEL USUARIO", úsalo.
   - Si la conversación está empezando (historial vacío o casi vacío), SALUDA POR SU NOMBRE si lo conoces. Ejemplo: "¡Hola de nuevo, Juan! Qué alegría verte. ¿Seguimos con tu búsqueda o necesitas algo nuevo?"
   - Si no hay memoria, saluda de forma estándar: "Hola, soy GelaBot de Gelabert Homes. ¿Qué estás buscando hoy?"

2. FLUJO DE CUALIFICACIÓN (CONVERSACIONAL):
   - No pidas todo a la vez. Una o dos preguntas por mensaje.
   - FASE 1: Identificar intención (Alquilar, Comprar, Vender, Propietario).
   - FASE 2: Recoger contacto (Nombre, Email, Teléfono). **Llamar a save_lead en cuanto tengas el email**.
   - FASE 3: Cualificación técnica (Zonas, Presupuesto, Hab., Mascotas, etc.).
   - FASE 4: Perfil personal (Ocupación, Ingresos).
   - FASE 5: Mostrar formulario final [SHOW_FORM:tipo] y despedida premium.

3. ESTILO:
   - Profesional, cercano, premium.
   - Respuestas breves (máx 3-4 oraciones). Sin markdown pesado.
   - Si piden una propiedad por número/nombre, da detalles clave y sugiere visita.

4. COMANDOS DE FORMULARIO:
   [SHOW_FORM:inquilino], [SHOW_FORM:comprador], [SHOW_FORM:propietario_alquiler], [SHOW_FORM:propietario_venta].`

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

    // ── Recuperar memoria del usuario (CRM) ──────────────────────────────────
    let userMemory = ""
    if (externalId) {
      const { data: lead } = await supabase
        .from('leads_crm')
        .select('name, intent, agent_notes, occupation')
        .eq('external_id', externalId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lead && lead.name) {
        userMemory = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nMEMORIA DEL USUARIO (CONOCIDO):\n- Nombre: ${lead.name}\n- Intención anterior: ${lead.intent || 'No especificada'}\n- Ocupación: ${lead.occupation || 'No especificada'}\n- Notas previas: ${lead.agent_notes || 'Ninguna'}\n\nSi es un inicio de conversación, saluda por su nombre y pregunta si necesita continuar con lo anterior o algo nuevo.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      }
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
          { role: 'system', content: SYSTEM_PROMPT + userMemory },
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
                  full_name: { type: 'string', description: 'Nombre completo del usuario' },
                  email: { type: 'string', description: 'Email del usuario' },
                  phone: { type: 'string', description: 'Teléfono de contacto' },
                  intent: {
                    type: 'string',
                    enum: ['alquilar', 'comprar', 'vender', 'alquilar_propietario'],
                    description: 'Intención principal del usuario'
                  },
                  notes: { type: 'string', description: 'Resumen COMPLETO y detallado de todas las necesidades, preferencias y datos recopilados en la conversación' },
                  
                  // Perfil inquilino
                  occupation: { type: 'string', description: 'Profesión o situación laboral' },
                  monthly_income: { type: 'number', description: 'Ingresos netos mensuales en €' },
                  pets: { type: 'boolean', description: 'Si tiene mascotas' },
                  move_in_date: { type: 'string', description: 'Fecha deseada de entrada (YYYY-MM-DD)' },
                  
                  // Perfil inmueble (propietario)
                  property_address: { type: 'string', description: 'Dirección o zona del inmueble' },
                  property_specs: { type: 'string', description: 'Habitaciones, baños, m2, etc.' },
                  expected_price: { type: 'number', description: 'Precio esperado en €' }
                },
                required: ['email', 'intent']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'search_properties',
              description: 'Busca propiedades disponibles en la base de datos.',
              parameters: {
                type: 'object',
                properties: {
                  operation: { type: 'string', enum: ['alquiler', 'venta'], description: 'Tipo de operación' },
                  max_price: { type: 'number', description: 'Precio máximo' },
                  min_bedrooms: { type: 'number', description: 'Mínimo de habitaciones' },
                  zone: { type: 'string', description: 'Zona o barrio' }
                }
              }
            }
          }
        ],
        tool_choice: 'auto'
      })
    })

    const result = await openAIResponse.json()
    const choice = result.choices?.[0]
    let reply = choice?.message?.content || ''

    // ── Manejo de llamadas a herramientas (Tools) ─────────────────────────────
    if (choice?.message?.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        const name = toolCall.function.name
        const args = JSON.parse(toolCall.function.arguments)

        if (name === 'save_lead') {
          // Guardar en leads_crm
          const { error: leadErr } = await supabase.from('leads_crm').upsert({
            email: args.email,
            name: args.full_name || null,
            phone: args.phone || null,
            intent: args.intent,
            status: 'nuevo',
            external_id: externalId,
            
            occupation: args.occupation || null,
            monthly_income: parseNumber(args.monthly_income),
            pets: parseBool(args.pets),
            move_in_date: parseDate(args.move_in_date),
            
            property_address: args.property_address || null,
            property_specs: args.property_specs || null,
            expected_price: parseNumber(args.expected_price),
            
            agent_notes: args.notes || null,
            source: 'gelabot'
          }, { onConflict: 'email' })

          if (leadErr) console.error('Error saving lead:', leadErr)
          reply += '\n[Datos guardados en CRM]'
        }

        if (name === 'search_properties') {
          let query = supabase.from('properties').select('id, title, price, bedrooms, bathrooms, main_image, slug, zone')
          
          if (args.operation) query = query.eq('operation_type', args.operation)
          if (args.max_price) query = query.lte('price', args.max_price)
          if (args.min_bedrooms) query = query.gte('bedrooms', args.min_bedrooms)
          if (args.zone) query = query.ilike('zone', `%${args.zone}%`)

          const { data: props, error: propsErr } = await query.limit(5)
          
          if (propsErr) {
            reply += '\nError buscando propiedades.'
          } else if (props && props.length > 0) {
            const list = props.map((p, i) => 
              `${i+1}. ${p.title} — ${p.price}€ — ${p.bedrooms} hab. — https://gelaberthomes.es/propiedades/${p.slug}`
            ).join('\n')
            
            // Segunda llamada a OpenAI para integrar los resultados en la respuesta
            const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT + userMemory },
                  ...messages,
                  choice.message,
                  {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: 'search_properties',
                    content: JSON.stringify(props)
                  }
                ]
              })
            })
            const secondResult = await secondResponse.json()
            reply = secondResult.choices?.[0]?.message?.content || reply
          } else {
            reply += '\nNo he encontrado propiedades con esos filtros exactos. ¿Probamos con otra zona o presupuesto?'
          }
        }
      }
    }

    // ── Persistir conversación ────────────────────────────────────────────────
    if (externalId) {
      const updatedMessages = [...messages, { role: 'assistant', content: reply }]
      await supabase.from('gelabot_conversations').upsert({
        external_id: externalId,
        messages: updatedMessages,
        updated_at: new Date().toISOString()
      }, { onConflict: 'external_id' })
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Gelabot crash:', err)
    return new Response(JSON.stringify({ reply: 'GelaBot ha tenido un pequeño desliz técnico. ¿Puedes repetir?' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
