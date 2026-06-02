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

    // Paso 1: Usar el Place ID activo verificado para Gelabert Homes Real Estate
    const placeId = 'ChIJwdd_aedMr08RetzIGPwX69c';

    // Paso 2: Obtener detalles con reseñas usando la nueva API de Google Places (v1)
    const detailsUrl = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
    detailsUrl.searchParams.set('languageCode', 'es');
    detailsUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const detailsRes = await fetch(detailsUrl.toString(), {
      headers: {
        'X-Goog-FieldMask': 'id,displayName,rating,reviews,userRatingCount',
      }
    });
    const detailsData = await detailsRes.json();

    if (detailsRes.status !== 200) {
      console.error('Google Maps API Error:', detailsData);
      return new Response(JSON.stringify({
        error: `Google API Error: ${detailsRes.status}`,
        debug: {
          placeId,
          detailsStatus: detailsRes.status,
          detailsErrorMessage: detailsData.error?.message || 'Unknown error',
        },
        reviews: [],
        rating: 0,
        total: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const place = detailsData;
    const legacyReviews = (place.reviews || []).map((r: any) => ({
      author_name: r.authorAttribution?.displayName || 'Anónimo',
      rating: r.rating || 5,
      text: r.text?.text || '',
      relative_time_description: r.relativePublishTimeDescription || '',
      profile_photo_url: r.authorAttribution?.photoUri || '',
      author_url: r.authorAttribution?.uri || '',
    }));

    // Intercepción: Corregir calificación de Fernando a 4 estrellas
    if (Array.isArray(legacyReviews)) {
      legacyReviews.forEach((review: any) => {
        if (review.author_name && review.author_name.toLowerCase().includes('fernando')) {
          review.rating = 4;
        }
      });
    }

    const result = {
      reviews: legacyReviews,
      rating: place.rating || 5.0,
      total: place.userRatingCount || 0,
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
