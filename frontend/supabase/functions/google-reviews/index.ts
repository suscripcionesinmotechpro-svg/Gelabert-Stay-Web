import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache: 15 min TTL
let memCache: { data: unknown; ts: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Serve from memory cache if valid
    if (memCache && Date.now() - memCache.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify(memCache.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Init Supabase admin client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch place stats first to verify cache freshness in DB
    const { data: statsRows } = await supabase
      .from('google_place_stats')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const stats = statsRows || { rating: 5.0, total_ratings: 0, last_synced_at: null };
    const lastSynced = stats.last_synced_at ? new Date(stats.last_synced_at).getTime() : 0;
    const isFresh = (Date.now() - lastSynced) < 12 * 60 * 60 * 1000; // 12 hours freshness

    // ── 1. Try to sync fresh reviews from Google Places API only if expired 
    if (!isFresh && GOOGLE_MAPS_API_KEY) {
      console.log('Database reviews cache is older than 12h or empty. Syncing from Google Places API...');
      try {
        const placeId = 'ChIJwdd_aedMr08RetzIGPwX69c';
        const detailsUrl = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
        detailsUrl.searchParams.set('languageCode', 'es');
        detailsUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);

        const detailsRes = await fetch(detailsUrl.toString(), {
          headers: { 'X-Goog-FieldMask': 'id,displayName,rating,reviews,userRatingCount' },
        });

        if (detailsRes.ok) {
          const place = await detailsRes.json();
          const freshReviews = place.reviews || [];

          // Upsert each review — new ones get inserted, existing ones updated
          for (const r of freshReviews) {
            const authorName: string = r.authorAttribution?.displayName || 'Anónimo';
            const reviewId = `${authorName.replace(/\s+/g, '_').toLowerCase()}_${r.rating}_${(r.text?.text || '').slice(0, 20).replace(/\s+/g, '_')}`;

            await supabase.from('google_reviews').upsert({
              id: reviewId,
              author_name: authorName,
              author_url: r.authorAttribution?.uri || '',
              profile_photo_url: r.authorAttribution?.photoUri || '',
              rating: r.rating || 5,
              text: r.text?.text || '',
              relative_time_description: r.relativePublishTimeDescription || '',
              time: null,
              language: 'es',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          }

          // Update place stats
          await supabase.from('google_place_stats').upsert({
            id: 1,
            rating: place.rating || 5.0,
            total_ratings: place.userRatingCount || 0,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'id' });

          console.log(`Synced ${freshReviews.length} reviews from Google Places API`);
          
          // Update local variables for return
          stats.rating = place.rating || 5.0;
          stats.total_ratings = place.userRatingCount || 0;
        } else {
          console.warn('Google Places API returned non-ok status:', detailsRes.status);
        }
      } catch (googleErr) {
        console.warn('Could not reach Google Places API, serving from DB:', googleErr);
      }
    } else {
      console.log('Database reviews cache is fresh. Serving from database directly.');
    }

    // ── 2. Read ALL reviews from Supabase DB ─────────
    const { data: dbReviews, error: dbErr } = await supabase
      .from('google_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbErr) throw dbErr;

    // Map to legacy format expected by frontend
    const legacyReviews = (dbReviews || []).map((r: any) => ({
      author_name: r.author_name,
      rating: r.rating,
      text: r.text,
      relative_time_description: r.relative_time_description,
      profile_photo_url: r.profile_photo_url,
      author_url: r.author_url,
    }));

    const result = {
      reviews: legacyReviews,
      rating: stats.rating,
      total: stats.total_ratings || legacyReviews.length,
      placeId: 'ChIJwdd_aedMr08RetzIGPwX69c',
    };

    memCache = { data: result, ts: Date.now() };

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
