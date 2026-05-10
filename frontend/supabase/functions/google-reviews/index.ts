import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
    const PLACE_ID = Deno.env.get('GOOGLE_PLACE_ID') ?? 'ChIJwfAWHrUN9I0RcUL0WR0B0lE'

    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Google API Key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch place details including reviews
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,user_ratings_total,reviews&language=es&reviews_sort=newest&key=${GOOGLE_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message)
      return new Response(JSON.stringify({ error: data.status, message: data.error_message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const place = data.result
    const reviews = (place.reviews ?? []).map((r: any) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      date: r.relative_time_description,
      avatar: r.profile_photo_url,
      url: r.author_url,
    }))

    return new Response(JSON.stringify({
      name: place.name,
      rating: place.rating,
      total: place.user_ratings_total,
      reviews,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('google-reviews crash:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
