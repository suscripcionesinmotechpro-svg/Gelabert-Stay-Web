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
    let { messages, externalId } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    // Detectar email para vinculación
    const emailMatch = messages.find((m: any) => m.role === 'user' && typeof m.content === 'string' && m.content.includes('@'))?.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]
    
    if (emailMatch && emailMatch !== externalId) {
      const { data: anonConv } = await supabase.from('gelabot_conversations').select('*').eq('external_id', externalId).single()
      const { data: emailConv } = await supabase.from('gelabot_conversations').select('*').eq('external_id', emailMatch).single()
      
      if (anonConv) {
        const mergedMessages = emailConv ? [...emailConv.messages, ...anonConv.messages] : anonConv.messages
        await supabase.from('gelabot_conversations').upsert({
          external_id: emailMatch,
          messages: mergedMessages,
          updated_at: new Date().toISOString()
        }, { onConflict: 'external_id' })
        await supabase.from('gelabot_conversations').delete().eq('external_id', externalId)
        externalId = emailMatch
      }
    }

    // ELIMINADO EL FILTRO messages.slice(-1) QUE CAUSABA PÉRDIDA DE CONTEXTO
    // Usamos el historial que viene del frontend como base de la sesión actual
    const contextMessages = messages

    const systemPrompt = `# GELABOT — AGENTE VIRTUAL CON MEMORIA
Eres GelaBot. Tienes memoria a largo plazo. REVISA EL HISTORIAL DETALLADAMENTE.

## REGLAS CRÍTICAS:
1. **Identidad**: Si el usuario ya dio su Nombre, Email o Teléfono en CUALQUIER punto del historial, NO los vuelvas a pedir. Salúdalo y pasa a la fase de búsqueda.
2. ** save_lead**: Llama a esta función en cuanto tengas el Email.
3. **Bucle**: Si detectas que vas a preguntar algo que ya está en el historial, ¡PARA! Avanza en el proceso.
4. **Propiedades**: Tras identificarse, pregunta zona y presupuesto, usa \`search_properties\` y muestra opciones.

## FLUJO:
1. Identificación (si no está en el historial).
2. Intereses (Compra, Venta, Alquiler).
3. Búsqueda de zona/precio.
4. Mostrar propiedades y formulario final [SHOW_FORM:tipo].
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...contextMessages],
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
                  intent: { type: "string", enum: ["alquilar", "alquilar_propietario", "vender", "comprar"] }
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
                properties: { type: { type: "string", enum: ["alquiler", "venta"] }, max_price: { type: "number" } }
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
          await supabase.from('leads_crm').upsert({
            name: args.full_name, email: args.email, phone: args.phone, intent: args.intent, status: 'nuevo'
          }, { onConflict: 'email' })
          toolResults.push({ tool_call_id: call.id, role: "tool", name: "save_lead", content: "Datos guardados." })
        }
        if (call.function.name === "search_properties") {
          const args = JSON.parse(call.function.arguments)
          let query = supabase.from('properties').select('*').eq('commercial_status', 'disponible')
          if (args.type === 'alquiler') query = query.eq('operation', 'alquiler')
          if (args.type === 'venta') query = query.eq('operation', 'venta')
          if (args.max_price) query = query.lte('price', args.max_price)
          const { data: props } = await query.limit(3)
          toolResults.push({ tool_call_id: call.id, role: "tool", name: "search_properties", content: JSON.stringify(props || []) })
        }
      }

      const secondRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, ...contextMessages, message, ...toolResults]
        })
      })
      const secondData = await secondRes.json()
      botReply = secondData.choices?.[0]?.message?.content || ""
    }

    // Persistir el historial actualizado
    if (externalId) {
      const finalHistory = [...contextMessages, { role: 'assistant', content: botReply }]
      await supabase.from('gelabot_conversations').upsert({
        external_id: externalId,
        messages: finalHistory,
        updated_at: new Date().toISOString()
      }, { onConflict: 'external_id' })
    }

    return new Response(JSON.stringify({ reply: botReply, externalId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ reply: "Error de conexión." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
