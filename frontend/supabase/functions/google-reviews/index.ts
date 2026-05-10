import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache in-memory: evita llamadas repetidas a la API de Google en la misma instancia
let cachedResult: { data: unknown; ts: number } | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

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
    const findUrl = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
    findUrl.searchParams.set('input', 'Gelabert Homes Real Estate');
    findUrl.searchParams.set('inputtype', 'textquery');
    findUrl.searchParams.set('fields', 'place_id,name,rating');
    findUrl.searchParams.set('locationbias', 'point:36.5236896,-4.6026549');
    findUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const findRes = await fetch(findUrl.toString());
    const findData = await findRes.json();
    const placeId: string | undefined = findData.candidates?.[0]?.place_id;

    if (!placeId) {
      const empty = { reviews: [], rating: 0, total: 0 };
      cachedResult = { data: empty, ts: Date.now() };
      return new Response(JSON.stringify(empty), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Paso 2: Obtener detalles con reseñas
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set('place_id', placeId);
    detailsUrl.searchParams.set('fields', 'name,rating,reviews,user_ratings_total');
    detailsUrl.searchParams.set('reviews_sort', 'newest');
    detailsUrl.searchParams.set('language', 'es');
    detailsUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);

    const detailsRes = await fetch(detailsUrl.toString());
    const detailsData = await detailsRes.json();
    const place = detailsData.result;

    const result = {
      reviews: place?.reviews || [],
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
