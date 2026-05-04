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
    
    // LOG DE VERIFICACIÓN (Solo los primeros caracteres por seguridad)
    console.log(`Verificando API Key: ${OPENAI_API_KEY?.substring(0, 10)}...`);

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'Eres GelaBot, asistente de Gelabert Homes. Usa tono premium.' }, ...messages]
      })
    })

    const data = await aiResponse.json()
    
    if (data.error) {
      console.error('ERROR OPENAI:', data.error.message);
      return new Response(JSON.stringify({ 
        error: data.error.message, 
        code: data.error.code,
        info: "Si ves 'insufficient_quota', es un delay de OpenAI al procesar tu nuevo saldo de $4.77. Suele tardar unos minutos."
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
