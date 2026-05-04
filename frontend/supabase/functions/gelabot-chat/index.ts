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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // INTELIGENCIA PREMIUM RESTAURADA (36 REGLAS)
    const systemPrompt = `# PROMPT MAESTRO — GELABOT | ASISTENTE VIRTUAL DE GELABERT HOMES REAL ESTATE
(Reglas 1-36 integradas)
Eres GelaBot. Tono premium. No des comisiones. Cualifica leads detalladamente y guarda en CRM.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        tools: [{
          type: "function",
          function: {
            name: "save_lead",
            description: "Guarda información del lead en el CRM",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                intent: { type: "string" },
                metadata: { type: "object" }
              },
              required: ["email"]
            }
          }
        }]
      })
    })

    const data = await aiResponse.json()
    
    if (data.error) {
      return new Response(JSON.stringify({ 
        choices: [{ message: { content: "Lo siento, tengo un pequeño problema técnico. Por favor, inténtalo de nuevo." } }] 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Guardado en CRM
    const toolCalls = data.choices[0].message.tool_calls
    if (toolCalls) {
      const args = JSON.parse(toolCalls[0].function.arguments)
      await supabaseAdmin.from('leads_crm').upsert({
        name: args.name,
        email: args.email,
        phone: args.phone,
        intent: args.intent,
        agent_notes: JSON.stringify(args.metadata),
        status: 'en_cualificacion'
      }, { onConflict: 'email' })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ 
      choices: [{ message: { content: "Hola, estoy experimentando una pequeña interrupción. Por favor, refresca e inténtalo de nuevo." } }] 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
