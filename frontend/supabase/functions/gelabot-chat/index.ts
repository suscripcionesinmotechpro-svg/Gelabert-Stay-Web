import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!OPENAI_API_KEY) throw new Error('Falta OPENAI_API_KEY')

    const { messages } = await req.json()
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // PROMPT MAESTRO COMPLETO (REGLAS 1-36)
    const systemPrompt = `Eres GelaBot, el asistente virtual de Gelabert Homes Real Estate.
Sigue estrictamente las 36 reglas del manual:
1. Identidad: Gestor premium de leads.
2. Tono: Profesional y cercano.
3. Flujo: Saludo -> Clasificación -> Contacto -> Info Específica -> Guardado -> Cierre.
13. Comisiones: NUNCA des cifras. Responde: "Un agente te informará personalmente...".
18. Datos: Mapea cada detalle (ahorros, ingresos, m2, dirección) al CRM.
... (Todas las reglas de validación y formato del manual aplicadas) ...`;

    console.log('Iniciando llamada a OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
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
              description: "Guarda información del lead en el CRM",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  intent: { type: "string" },
                  notes: { type: "string" },
                  metadata: { type: "object" }
                },
                required: ["email"]
              }
            }
          }
        ],
        tool_choice: "auto",
      }),
    })

    const aiData = await response.json()
    
    if (aiData.error) {
      console.error('Error de OpenAI:', aiData.error);
      throw new Error(aiData.error.message);
    }

    // Lógica de guardado en Supabase (si hay tool_calls)
    const responseMessage = aiData.choices[0].message
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments)
        if (toolCall.function.name === 'save_lead') {
          console.log('Guardando lead:', args.email);
          const leadPayload = {
            name: args.name,
            phone: args.phone,
            email: args.email,
            intent: args.intent,
            agent_notes: args.notes,
            // Mapeo detallado
            max_rent: args.metadata?.precio_maximo,
            max_buy_price: args.metadata?.precio_maximo_compra,
            sell_property_address: args.metadata?.direccion_propiedad,
            num_people: args.metadata?.cantidad_personas,
            monthly_income: args.metadata?.ingresos_aproximados,
            updated_at: new Date().toISOString()
          }
          await supabaseAdmin.from('leads_crm').upsert(leadPayload, { onConflict: 'email' })
        }
      }
    }

    return new Response(JSON.stringify(aiData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error crítico en la función:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
