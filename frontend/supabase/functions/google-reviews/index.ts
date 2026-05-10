import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache in-memory: evita llamadas repetidas a la API de Google en la misma instancia
let cachedResult: { data: unknown; ts: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos para actualizaciones más rápidas

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Devolver caché si sigue siendo válida
    if (cachedResult && Date.now() - cachedResult.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cachedResult.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured', reviews: [], rating: 0, total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Paso 1: Buscar el Place ID usando nombre + coordenadas
    // Hardcoded Place ID for Gelabert Homes Real Estate
    const placeId = 'ChIJwfd_aeVM70oRetjIGPwX69c';

    // Paso 2: Obtener detalles con reseñas
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set('place_id', placeId);
    detailsUrl.searchParams.set('fields', 'name,rating,reviews,user_ratings_total');
    detailsUrl.searchParams.set('reviews_sort', 'newest');
    detailsUrl.searchParams.set('language', 'es');
    detailsUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const detailsRes = await fetch(detailsUrl.toString());
    const detailsData = await detailsRes.json();

    if (detailsData.status !== 'OK') {
      console.error('Google Maps API Error:', detailsData);
      return new Response(JSON.stringify({ error: `Google API Error: ${detailsData.status}`, reviews: [], rating: 0, total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const place = detailsData.result;
    
    const reviews = place?.reviews || [];
    
    // Intercepción: Corregir calificación de Fernando a 4 estrellas
    if (Array.isArray(reviews)) {
      reviews.forEach((review: any) => {
        if (review.author_name && review.author_name.toLowerCase().includes('fernando')) {
          review.rating = 4;
        }
      });
    }

    const result = {
      reviews: reviews,
      rating: place?.rating || 0,
      total: place?.user_ratings_total || 0,
      placeId,
    };

    cachedResult = { data: result, ts: Date.now() };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('google-reviews error:', err);
    return new Response(JSON.stringify({ error: String(err), reviews: [], rating: 0, total: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
