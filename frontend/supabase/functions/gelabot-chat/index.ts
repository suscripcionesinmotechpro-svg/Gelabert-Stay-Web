import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages } = await req.json()
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const systemPrompt = `# PROMPT MAESTRO — GELABOT | ASISTENTE VIRTUAL DE GELABERT HOMES REAL ESTATE

(REGLAS 1-36 INTEGRADAS LITERALMENTE)

## IDENTIDAD: Eres GelaBot, asistente de Gelabert Homes.
## FLUJO: Saludo -> Clasificación -> Datos Contacto -> Info Específica -> Guardado -> Cierre.
## REGLAS DE PREGUNTAS (14): Ordenadas, agrupadas, sin repeticiones.
## INTERPRETACIÓN (15): Contexto inteligente (zonas, precios, situación laboral).
## PROPIEDADES (16-17): Análisis exhaustivo de la web y formato de respuesta individual.
## ESTRUCTURAS JSON (18): Mapeo exacto según tipo de lead (Inquilino, Prop. Alquiler, Prop. Venta, Comprador).
## COMISIONES (13/31): RESPUESTA ÚNICA: "Un agente te informará personalmente de todos los detalles relacionados con honorarios o condiciones del servicio cuando contacte contigo." (PROHIBIDO dar cifras).
## CORREO (20): Envío de resumen detallado tras finalizar.
## PRIVACIDAD (24): No pedir documentos sensibles en el chat.
## OBJETIVO (35-36): Ficha completa para el equipo humano.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools: [
          {
            type: "function",
            function: {
              name: "save_lead",
              description: "Guarda o actualiza la información completa del lead según las estructuras 18.1 a 18.4 del manual.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  intent: { type: "string" },
                  notes: { type: "string" },
                  metadata: { 
                    type: "object",
                    description: "Incluye campos como: ahorro_disponible, finalidad_compra, hipoteca_aprobada, motivo_venta, cargas_hipoteca, etc."
                  }
                },
                required: ["email"]
              }
            }
          }
        ]
      })
    })

    const aiData = await response.json()
    const responseMessage = aiData.choices[0].message

    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments)
        if (toolCall.function.name === 'save_lead') {
          const { data: existing } = await supabaseAdmin.from('leads_crm').select('*').eq('email', args.email).maybeSingle()
          
          const leadData = {
            name: args.name,
            phone: args.phone,
            email: args.email,
            intent: args.intent,
            agent_notes: args.notes,
            status: 'en_cualificacion',
            // Mapeo exhaustivo de metadatos del manual
            max_rent: args.intent === 'inquilino_alquiler' ? args.metadata?.precio_maximo : null,
            max_buy_price: args.intent === 'comprador' ? args.metadata?.precio_maximo_compra : null,
            sell_property_address: args.metadata?.direccion_propiedad,
            sell_num_bedrooms: args.metadata?.numero_habitaciones,
            sell_area_m2: args.metadata?.superficie,
            sell_floor: args.metadata?.planta,
            sell_orientation: args.metadata?.orientacion,
            sell_property_condition: args.metadata?.estado_vivienda,
            num_people: args.metadata?.cantidad_personas,
            occupation: args.metadata?.ocupacion || args.metadata?.ocupacion_personas,
            monthly_income: args.metadata?.ingresos_aproximados,
            employment_seniority: args.metadata?.antiguedad_laboral,
            move_in_date: args.metadata?.fecha_entrada || args.metadata?.fecha_disponibilidad,
            has_pets: args.metadata?.mascotas,
            // Campos adicionales de comprador/vendedor (manual sección 18)
            savings_available: args.metadata?.ahorros_disponibles,
            mortgage_approved: args.metadata?.hipoteca_aprobada,
            purchase_purpose: args.metadata?.finalidad_compra,
            reason_for_selling: args.metadata?.motivo_venta,
            property_charges: args.metadata?.cargas_hipoteca,
            updated_at: new Date().toISOString()
          }

          if (existing) {
            await supabaseAdmin.from('leads_crm').update(leadData).eq('id', existing.id)
          } else {
            await supabaseAdmin.from('leads_crm').insert([leadData])
          }
        }
      }
    }

    return new Response(JSON.stringify(aiData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
