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
Eres GelaBot. Tu objetivo es captar leads de forma directa y profesional.

## REGLAS CRÍTICAS:
1. **Identidad**: Si NO conoces el Nombre, Teléfono o Correo, PÍDELOS (los 3 en un solo mensaje).
2. **Historial**: REVISA EL HISTORIAL. Si el usuario ya dio su nombre o tú ya le saludaste por su nombre, NO LO VUELVAS A PEDIR.
3. **Acción**: Solo usa \`save_lead\` cuando tengas al menos el Email.
4. **Respuesta**: Tras identificarse, pregunta zona/presupuesto y busca propiedades reales.

## FLUJO:
- Usuario elige intención.
- GelaBot pide: Nombre, Teléfono y Correo (3 datos juntos).
- GelaBot confirma y pide detalles de búsqueda.
- GelaBot muestra propiedades y el formulario final: [SHOW_FORM:tipo].

## COMANDOS:
- [SHOW_FORM:inquilino] | [SHOW_FORM:propietario_alquiler] | [SHOW_FORM:propietario_venta] | [SHOW_FORM:comprador]
`

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
              description: "Guarda el lead en el CRM",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  intent: { type: "string", enum: ["alquilar", "alquilar_propietario", "vender", "comprar"] },
                  search_preferences: { type: "string" },
                  qualification_data: { type: "object" }
                },
                required: ["intent", "email"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "search_properties",
              description: "Busca propiedades reales",
              parameters: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["alquiler", "venta"] },
                  max_price: { type: "number" }
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
          const { error } = await supabase.from('leads_crm').upsert({
            name: args.full_name,
            email: args.email,
            phone: args.phone,
            intent: args.intent,
            status: 'nuevo'
          }, { onConflict: 'email' })

          toolResults.push({
            tool_call_id: call.id,
            role: "tool",
            name: "save_lead",
            content: error ? `Error: ${error.message}` : "Datos guardados en CRM."
          })
        }

        if (call.function.name === "search_properties") {
          const args = JSON.parse(call.function.arguments)
          let query = supabase.from('properties').select('*').eq('commercial_status', 'disponible')
          if (args.type === 'alquiler') query = query.eq('operation', 'alquiler')
          if (args.type === 'venta') query = query.eq('operation', 'venta')
          if (args.max_price) query = query.lte('price', args.max_price)
          
          const { data: props } = await query.limit(3)
          toolResults.push({
            tool_call_id: call.id,
            role: "tool",
            name: "search_properties",
            content: JSON.stringify(props || [])
          })
        }
      }

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

    return new Response(JSON.stringify({ reply: botReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ reply: "Hubo un error. ¿Podemos reintentar?" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
