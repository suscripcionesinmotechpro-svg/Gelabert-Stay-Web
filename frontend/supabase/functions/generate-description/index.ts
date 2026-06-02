import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Error: Falta la API Key de OpenAI (OPENAI_API_KEY) en los secretos de Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { form } = await req.json()
    if (!form || !form.title) {
      return new Response(
        JSON.stringify({ error: 'Error: Faltan datos del formulario o el título de la propiedad.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract property fields
    const {
      title,
      property_type,
      operation,
      rent_type,
      price,
      max_price,
      currency = 'EUR',
      city,
      zone,
      address,
      urbanization,
      area_m2,
      bedrooms,
      bathrooms,
      floor,
      conservation_state,
      availability,
      orientation = [],
      has_elevator,
      is_furnished,
      has_terrace,
      has_balcony,
      has_parking,
      parking_included,
      parking_price,
      has_storage,
      has_pool,
      garden,
      has_patio,
      sea_views,
      air_conditioning,
      heating,
      has_fireplace,
      has_wardrobes,
      pets_allowed,
      highlights = [],
      description: userDraft = ''
    } = form

    // Formatting currency helper
    const fmtCurrency = (val: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val)

    // Assemble features list
    const features: string[] = []
    if (area_m2) features.push(`Superficie: ${area_m2} m²`)
    if (bedrooms) features.push(`Habitaciones: ${bedrooms}`)
    if (bathrooms) features.push(`Baños: ${bathrooms}`)
    if (floor) features.push(`Planta: ${floor}`)
    if (conservation_state) features.push(`Estado de conservación: ${conservation_state}`)
    if (availability) features.push(`Disponibilidad: ${availability}`)
    if (orientation && orientation.length > 0) features.push(`Orientación: ${orientation.join(', ')}`)
    
    // Toggleable features
    if (has_elevator) features.push('Ascensor disponible')
    if (is_furnished) features.push('Totalmente amueblado/equipado')
    if (has_terrace) features.push('Tiene terraza')
    if (has_balcony) features.push('Tiene balcón')
    if (has_storage) features.push('Tiene trastero')
    if (has_pool) features.push('Piscina comunitaria o privada')
    if (garden) features.push('Jardín')
    if (has_patio) features.push('Patio')
    if (sea_views) features.push('Espectaculares vistas al mar')
    if (air_conditioning) features.push('Aire acondicionado')
    if (heating) features.push('Calefacción')
    if (has_fireplace) features.push('Chimenea')
    if (has_wardrobes) features.push('Armarios empotrados')
    if (pets_allowed) features.push('Se admiten mascotas')
    
    if (has_parking) {
      if (parking_included) {
        features.push('Plaza de garaje incluida en el precio')
      } else if (parking_price) {
        features.push(`Plaza de garaje disponible por ${fmtCurrency(parking_price)} adicionales`)
      } else {
        features.push('Dispone de plaza de garaje')
      }
    }

    // Assemble pricing description
    let priceInfo = ''
    if (price) {
      priceInfo = fmtCurrency(price)
      if (operation === 'alquiler') priceInfo += '/mes'
      if (max_price) priceInfo += ` - ${fmtCurrency(max_price)}/mes`
    }

    // Formulate a structured payload prompt
    const propertySummary = `
DATOS DE LA PROPIEDAD:
- Título: ${title}
- Tipo de Inmueble: ${property_type}
- Operación: ${operation} ${rent_type ? `(${rent_type})` : ''}
- Precio: ${priceInfo}
- Ubicación: ${city || ''} ${zone ? `(Zona: ${zone})` : ''} ${urbanization ? `(Urbanización: ${urbanization})` : ''} ${address ? `(Dirección: ${address})` : ''}
- Características y extras:
${features.map(f => `  * ${f}`).join('\n')}
- Puntos destacados (Highlights):
${highlights.map((h: string) => `  * ${h}`).join('\n')}
- Borrador inicial/Notas del usuario:
"${userDraft}"
`

    const systemPrompt = `Eres un redactor y copywriter de lujo experto en el mercado inmobiliario español para la marca Gelabert Homes.
Tu trabajo es generar una descripción de alta calidad para la página web del inmueble (que también se exportará a Idealista).

REGLA DE ORO CRÍTICA:
1. FIDELIDAD ABSOLUTA A LA INFORMACIÓN SUMINISTRADA: Cíñete ÚNICAMENTE a los hechos y características proporcionados en los datos de la propiedad.
2. NO INVENTES NADA: Bajo ningún concepto agregues calidades que no estén explícitas (ej: no asumas encimeras de cuarzo, electrodomésticos de marcas específicas, suelos radiantes, ventanas climalit o baños en suite si no están detallados).
3. NO INVENTES UBICACIONES NI DISTANCIAS: No digas "a un paso del mar", "a 5 minutos del colegio", "cerca de supermercados", "excelente conexión a la autovía" o "zona muy tranquila" a menos que sea explícitamente mencionado en el "Borrador inicial/Notas del usuario".
4. Si los datos son breves o escasos, haz una descripción refinada, elegante, fluida y atractiva concentrándote en redactar de manera exquisita los datos conocidos, sin añadir relleno inventado.

REGLAS DE FORMATO Y ESTILO:
- Escribe en español de España con un tono elegante, acogedor, profesional y sofisticado.
- Estructura la descripción de forma impecable usando párrafos organizados.
- FORMATO OBLIGATORIO: Debes entregar el texto exclusivamente en formato HTML limpio.
- ETIQUETAS PERMITIDAS: Utiliza únicamente etiquetas de párrafo \`<p>\`, negritas \`<strong>\`, listas \`<ul>\` y \`<li>\` para enumerar los puntos fuertes reales del inmueble.
- ETIQUETAS PROHIBIDAS: NO utilices las etiquetas \`<h1>\`, \`<h2>\` ni \`<h3>\` ni estilos CSS en línea o bloques de código markdown (\`\`\`).
- Empieza con una introducción atractiva basada en el título y características básicas.
- Describe la distribución y extras de manera ordenada según las características verdaderas provistas.
- Termina con una cordial llamada a la acción invitando a contactar a Gelabert Homes para coordinar una visita personalizada.
`

    console.log(`[AI Description] Request received for title: "${title}"`)

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Por favor, genera la descripción para esta propiedad basándote de forma estricta en estos datos:\n\n${propertySummary}` }
        ],
        temperature: 0.3 // low temperature to minimize hallucinations
      })
    })

    if (!openAIResponse.ok) {
      const errText = await openAIResponse.text()
      console.error('OpenAI Error Response:', errText)
      throw new Error(`OpenAI API returned status ${openAIResponse.status}`)
    }

    const result = await openAIResponse.json()
    const description = result.choices?.[0]?.message?.content || ''

    return new Response(
      JSON.stringify({ description: description.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('generate-description function error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno en la Edge Function' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
