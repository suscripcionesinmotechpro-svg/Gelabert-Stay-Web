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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Eres GelaBot, el asistente virtual premium de Gelabert Homes.
            Cualifica leads siguiendo el protocolo: Contacto -> Interés -> Perfil financiero -> Resumen.
            Guarda los datos usando 'save_lead'.`
          },
          ...messages
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_lead",
              description: "Guarda la información del lead en el CRM",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  user_persona: { type: "string", enum: ["inquilino", "comprador", "vendedor", "propietario"] },
                  budget_max: { type: "number" }
                }
              }
            }
          }
        ]
      })
    })

    const data = await response.json()
    let botReply = data.choices?.[0]?.message?.content || "";
    const toolCalls = data.choices?.[0]?.message?.tool_calls;

    if (toolCalls) {
      for (const call of toolCalls) {
        if (call.function.name === "save_lead") {
          const args = JSON.parse(call.function.arguments);
          await supabase.from('leads_crm').upsert(args, { onConflict: 'email' });
        }
      }
      if (!botReply) botReply = "He tomado nota de tus datos. ¿En qué más puedo ayudarte?";
    }

    return new Response(JSON.stringify({ reply: botReply || "Entiendo. Cuéntame más." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ reply: "Error de conexión." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
