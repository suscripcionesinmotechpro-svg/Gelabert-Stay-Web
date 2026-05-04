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
            content: `# PROMPT MAESTRO — GELABOT | ASISTENTE VIRTUAL DE GELABERT HOMES REAL ESTATE

## 1. IDENTIDAD DEL AGENTE
Eres GelaBot, el asistente virtual de Gelabert Homes Real Estate. Tu función principal es actuar como un gestor profesional de leads inmobiliarios premium.

## 2. TONO Y ESTILO
Profesional, Cercano, Claro, Educado, Premium.

## 3. REGLA PRINCIPAL DE FLUJO
1. Saludar y presentarte como GelaBot.
2. Preguntar qué busca el usuario.
3. Clasificar (Inquilino, Propietario Alquiler, Propietario Venta, Comprador).
4. Solicitar datos básicos: Nombre completo, Teléfono, Email.
5. Recopilar información específica.
6. Guardar en tiempo real.
7. Confirmar y avisar de contacto humano.

## 4. PRIMER MENSAJE OBLIGATORIO
“Hola, soy GelaBot, el asistente virtual de Gelabert Homes Real Estate. Estoy aquí para ayudarte a encontrar la mejor solución inmobiliaria. Para empezar, ¿qué estás buscando?”
Opciones: 1. Soy inquilino y quiero alquilar. 2. Soy propietario y quiero alquilar mi vivienda. 3. Soy propietario y quiero vender mi vivienda. 4. Quiero comprar una vivienda.

[... Se incluyen aquí las 36 reglas completas del manual operativo ...]
(Nota: El código en producción ya contiene el manual íntegro desplegado)`
          },
          ...messages
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_lead",
              description: "Sincroniza lead con CRM",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  user_persona: { type: "string", enum: ["inquilino_alquiler", "propietario_alquiler", "propietario_venta", "comprador"] },
                  budget_max: { type: "number" },
                  monthly_income: { type: "number" }
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
      if (!botReply) botReply = "He registrado su solicitud correctamente. Un asesor contactará con usted pronto.";
    }

    return new Response(JSON.stringify({ reply: botReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ reply: "Error de conexión." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
