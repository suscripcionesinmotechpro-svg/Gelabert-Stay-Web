import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

// Supabase admin client (server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

function verifySignature(body: string, webhookId: string, webhookTimestamp: string, webhookSignature: string, secret: string): boolean {
  try {
    const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const secretBytes = Buffer.from(rawSecret, 'base64');
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
    const hmac = createHmac('sha256', secretBytes);
    hmac.update(signedContent);
    const expectedSig = `v1,${hmac.digest('base64')}`;
    return webhookSignature.split(' ').some(sig => sig === expectedSig);
  } catch { return false; }
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = event.body || '';
  const params = event.queryStringParameters || {};

  // 1. Verificar firma
  const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const webhookId = event.headers['webhook-id'];
    const webhookTimestamp = event.headers['webhook-timestamp'];
    const webhookSignature = event.headers['webhook-signature'];
    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      return { statusCode: 400, body: 'Missing webhook signature headers' };
    }
    if (!verifySignature(body, webhookId, webhookTimestamp, webhookSignature, webhookSecret)) {
      console.error('[Webhook] Firma invalida');
      return { statusCode: 401, body: 'Invalid signature' };
    }
  } else {
    console.warn('[Webhook] REPLICATE_WEBHOOK_SECRET no configurado');
  }

  // 2. Parsear payload
  let prediction: any;
  try { prediction = JSON.parse(body); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }

  const propertyId = params.propertyId;
  const videoType = params.videoType as 'gallery' | 'common_area' | 'room' | undefined;
  const videoIdx = params.videoIdx !== undefined ? parseInt(params.videoIdx) : undefined;
  const areaIdx = params.areaIdx !== undefined ? parseInt(params.areaIdx) : undefined;
  const roomIdx = params.roomIdx !== undefined ? parseInt(params.roomIdx) : undefined;
  const userId = params.userId;
  const filename = params.filename;

  console.log(`[Webhook] id=${prediction.id} status=${prediction.status} property=${propertyId} type=${videoType}`);

  if (!propertyId || !videoType) {
    return { statusCode: 400, body: 'Missing context params' };
  }

  if (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    return { statusCode: 200, body: `Ignored: ${prediction.status}` };
  }

  // 3. Obtener propiedad
  const { data: prop, error: fetchErr } = await supabase
    .from('properties')
    .select('videos_metadata, common_areas, rooms')
    .eq('id', propertyId)
    .single();

  if (fetchErr || !prop) {
    console.error('[Webhook] Propiedad no encontrada:', fetchErr);
    return { statusCode: 404, body: 'Property not found' };
  }

  // 4a. SUCCEEDED
  if (prediction.status === 'succeeded') {
    const outputUrl: string = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!outputUrl) return { statusCode: 200, body: 'OK - no output URL' };

    try {
      console.log('[Webhook] Descargando...');
      const downloadRes = await fetch(outputUrl);
      if (!downloadRes.ok) throw new Error(`Download failed: ${downloadRes.statusText}`);
      const videoBuffer = Buffer.from(await downloadRes.arrayBuffer());
      console.log(`[Webhook] ${(videoBuffer.byteLength / 1024 / 1024).toFixed(1)} MB descargados`);

      let targetFilename: string;
      if (filename) {
        const base = filename.replace(/\.[^.]+$/, '');
        targetFilename = `${base}_enhanced_premium.mp4`;
      } else {
        targetFilename = `enhanced/${propertyId}/${prediction.id}.mp4`;
      }

      console.log('[Webhook] Subiendo a Supabase:', targetFilename);
      const { error: uploadErr } = await supabase.storage
        .from('property-images')
        .upload(targetFilename, videoBuffer, { contentType: 'video/mp4', cacheControl: '31536000', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: pubData } = supabase.storage.from('property-images').getPublicUrl(targetFilename);
      const enhancedUrl = pubData.publicUrl;
      console.log('[Webhook] URL publica:', enhancedUrl);

      const enhancedFields = {
        url: enhancedUrl,
        optimized: true,
        processing: false,
        jobId: undefined,
        provider: undefined,
        enhanceType: undefined,
        cost: '0.30€',
        method: 'Ajuste Ultra Premium (IA)',
        log: 'El video original se proceso con redes neuronales convolucionales. Se aplico estabilizacion digital, reduccion de ruido temporal e interpolacion espacial para aumentar la nitidez. El archivo fue reemplazado por la version premium.'
      };

      let updatePayload: any = {};
      if (videoType === 'gallery' && videoIdx !== undefined) {
        const vids = [...(prop.videos_metadata || [])];
        if (vids[videoIdx]) { vids[videoIdx] = { ...vids[videoIdx], ...enhancedFields }; }
        updatePayload = { videos_metadata: vids };
      } else if (videoType === 'common_area' && areaIdx !== undefined && videoIdx !== undefined) {
        const areas = [...(prop.common_areas || [])];
        if (areas[areaIdx]?.videos) {
          const vids = [...areas[areaIdx].videos];
          if (vids[videoIdx]) {
            vids[videoIdx] = typeof vids[videoIdx] === 'object' ? { ...vids[videoIdx], ...enhancedFields } : enhancedFields;
            areas[areaIdx] = { ...areas[areaIdx], videos: vids };
          }
          updatePayload = { common_areas: areas };
        }
      } else if (videoType === 'room' && roomIdx !== undefined) {
        const rooms = [...(prop.rooms || [])];
        if (rooms[roomIdx]?.video) {
          rooms[roomIdx] = { ...rooms[roomIdx], video: { ...rooms[roomIdx].video, ...enhancedFields } };
          updatePayload = { rooms };
        }
      }

      await supabase.from('properties').update(updatePayload).eq('id', propertyId);

      if (userId) {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Video optimizado con exito',
          message: 'El video ha terminado de procesarse con IA Premium y ya esta disponible en la ficha de la propiedad.',
          type: 'video_enhance_success',
          is_read: false,
          action_url: `/admin/propiedades/${propertyId}`,
          related_id: propertyId,
          related_type: 'property'
        });
      }

      console.log('[Webhook] Completado:', targetFilename);
      return { statusCode: 200, body: 'OK' };

    } catch (err: any) {
      console.error('[Webhook] Error:', err);
      const errorFields = { processing: false, lastError: `Webhook error: ${err.message}` };
      try {
        if (videoType === 'gallery' && videoIdx !== undefined) {
          const vids = [...(prop.videos_metadata || [])];
          if (vids[videoIdx]) { vids[videoIdx] = { ...vids[videoIdx], ...errorFields }; }
          await supabase.from('properties').update({ videos_metadata: vids }).eq('id', propertyId);
        }
      } catch {}
      if (userId) {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Error al guardar video optimizado',
          message: `Replicate termino bien, pero fallo al guardar: ${err.message.slice(0, 200)}`,
          type: 'video_enhance_failed',
          is_read: false,
          action_url: `/admin/propiedades/${propertyId}`,
          related_id: propertyId,
          related_type: 'property'
        });
      }
      return { statusCode: 500, body: err.message };
    }
  }

  // 4b. FAILED / CANCELED
  const errorMsg = prediction.error || `Prediction ${prediction.status}`;
  console.warn('[Webhook] Prediccion fallida:', errorMsg);

  const failedFields = { processing: false, jobId: undefined, provider: undefined, enhanceType: undefined, lastError: errorMsg };
  try {
    if (videoType === 'gallery' && videoIdx !== undefined) {
      const vids = [...(prop.videos_metadata || [])];
      if (vids[videoIdx]) { vids[videoIdx] = { ...vids[videoIdx], ...failedFields }; }
      await supabase.from('properties').update({ videos_metadata: vids }).eq('id', propertyId);
    } else if (videoType === 'common_area' && areaIdx !== undefined && videoIdx !== undefined) {
      const areas = [...(prop.common_areas || [])];
      if (areas[areaIdx]?.videos?.[videoIdx]) {
        areas[areaIdx].videos[videoIdx] = { ...areas[areaIdx].videos[videoIdx], ...failedFields };
        await supabase.from('properties').update({ common_areas: areas }).eq('id', propertyId);
      }
    } else if (videoType === 'room' && roomIdx !== undefined) {
      const rooms = [...(prop.rooms || [])];
      if (rooms[roomIdx]?.video) {
        rooms[roomIdx] = { ...rooms[roomIdx], video: { ...rooms[roomIdx].video, ...failedFields } };
        await supabase.from('properties').update({ rooms }).eq('id', propertyId);
      }
    }
    if (userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Optimizacion de video fallida',
        message: `Replicate no pudo procesar el video. Error: ${errorMsg.slice(0, 200)}`,
        type: 'video_enhance_failed',
        is_read: false,
        action_url: `/admin/propiedades/${propertyId}`,
        related_id: propertyId,
        related_type: 'property'
      });
    }
  } catch (err) { console.error('[Webhook] Error limpiando estado:', err); }

  return { statusCode: 200, body: 'OK - failure recorded' };
};

export { handler };
