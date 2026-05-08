import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const slug = url.searchParams.get('slug')

  if (!id && !slug) {
    return new Response("Missing property ID or slug", { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  // Fetch property details
  let query = supabase.from('properties').select('title, description, main_image, slug, price, operation')
  if (id) query = query.eq('id', id)
  else query = query.eq('slug', slug)

  const { data: property, error } = await query.single()

  if (error || !property) {
    console.error('Property not found:', error)
    return Response.redirect('https://gelaberthomes.es/propiedades')
  }

  const cleanDescription = stripHtml(property.description || '');
  const title = `${property.title} | Gelabert Homes`
  const description = `${property.operation === 'alquiler' ? 'Alquiler' : 'Venta'}: ${property.price?.toLocaleString('es-ES')}€ - ${cleanDescription.substring(0, 160)}...`
  const image = property.main_image || 'https://gelaberthomes.es/logo-meta-v3.png'
  const targetUrl = `https://gelaberthomes.es/propiedades/${property.slug}`

  // Return HTML with Open Graph tags for crawlers, and redirect for humans
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${targetUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${targetUrl}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${image}">

    <!-- Redirection -->
    <meta http-equiv="refresh" content="0; url=${targetUrl}">
</head>
<body>
    <p>Redirigiendo a <a href="${targetUrl}">${title}</a>...</p>
    <script>window.location.href = "${targetUrl}";</script>
</body>
</html>`

  return new Response(html, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html' },
  })
})
