import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Shotstack API base URL (production)
const SHOTSTACK_API = 'https://api.shotstack.io/edit/v1';

// ─── Helper: pick the best Shotstack filter based on Gemini analysis ──────────
function pickShotstackFilter(brightness: number, contrast: number, saturation: number): string {
  // brightness > 1.08 → lighten
  // saturation > 1.05 or contrast > 1.05 → boost (both contrast + saturation)
  // contrast only → contrast
  // default fallback → boost
  if (brightness >= 1.08) return 'lighten';
  if (saturation >= 1.05 || contrast >= 1.05) return 'boost';
  if (contrast >= 1.03) return 'contrast';
  return 'boost'; // safe default for real estate
}

// ─── Helper: download URL to Buffer ───────────────────────────────────────────
async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.statusText} (${url})`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── POST: Start a Shotstack render ───────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      videoUrl,
      filename,
      propertyId,
      videoType,
      videoIdx,
      areaIdx,
      roomIdx,
      userToken,
      userId
    } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Falta la URL del vídeo' }, { status: 400 });
    }

    const shotstackKey = (process.env.SHOTSTACK_API_KEY || '').trim();
    if (!shotstackKey || shotstackKey === 'undefined' || shotstackKey === 'null') {
      return NextResponse.json(
        { error: 'No se ha configurado SHOTSTACK_API_KEY. Añádela en las variables de entorno de Netlify.' },
        { status: 500 }
      );
    }

    // ── Step 1: Analyse frames with Gemini to pick the best filter ────────────
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    let filter = 'boost'; // safe default for real estate

    if (geminiKey && geminiKey !== 'undefined' && geminiKey !== 'null') {
      try {
        const prompt = `Analiza esta URL de un vídeo inmobiliario y determina qué ajuste de imagen necesita.
Devuelve un JSON con brightness, contrast, saturation (valores entre 0.95 y 1.25 donde 1.0 = sin cambio):
{"brightness": 1.10, "contrast": 1.05, "saturation": 1.05}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (geminiRes.ok) {
          const resJson = await geminiRes.json();
          const textResult = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResult) {
            const parsed = JSON.parse(textResult.trim());
            filter = pickShotstackFilter(
              parsed.brightness ?? 1.0,
              parsed.contrast ?? 1.0,
              parsed.saturation ?? 1.0
            );
          }
        }
      } catch (e) {
        console.warn('[Basic Enhance] Gemini analysis failed, using default filter:', e);
      }
    }

    console.log(`[Basic Enhance] Starting Shotstack render with filter="${filter}" for ${videoUrl}`);

    // ── Step 2: Create Shotstack render job ───────────────────────────────────
    const shotstackBody = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: 'video',
                  src: videoUrl,
                  volume: 1
                },
                start: 0,
                length: 'auto',
                filter
              }
            ]
          }
        ]
      },
      output: {
        format: 'mp4',
        resolution: 'hd'
      }
    };

    const shotstackRes = await fetch(`${SHOTSTACK_API}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': shotstackKey
      },
      body: JSON.stringify(shotstackBody)
    });

    const shotstackRawText = await shotstackRes.text();
    let shotstackData: any;
    try {
      shotstackData = JSON.parse(shotstackRawText);
    } catch {
      throw new Error(`Shotstack devolvió una respuesta no válida: ${shotstackRawText.slice(0, 300)}`);
    }

    if (!shotstackRes.ok || !shotstackData?.response?.id) {
      throw new Error(
        `Error al crear render en Shotstack (HTTP ${shotstackRes.status}): ${shotstackData?.message || shotstackRawText.slice(0, 300)}`
      );
    }

    const renderId = shotstackData.response.id;
    console.log(`[Basic Enhance] Shotstack render queued. renderId=${renderId}`);

    // ── Step 3: Mark video as processing in DB ────────────────────────────────
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } }
    });

    const { data: prop } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (prop) {
      let updatePayload: any = {};

      if (videoType === 'gallery' && videoIdx !== undefined) {
        const vids = [...(prop.videos_metadata || [])];
        vids[videoIdx] = {
          ...vids[videoIdx],
          processing: true,
          jobId: renderId,
          provider: 'shotstack',
          enhanceType: 'basic',
          shotstackFilter: filter
        };
        updatePayload = { videos_metadata: vids };
      } else if (videoType === 'common_area' && areaIdx !== undefined && videoIdx !== undefined) {
        const areas = [...(prop.common_areas || [])];
        const area = areas[areaIdx];
        const vids = [...(area.videos || [])];
        vids[videoIdx] = {
          ...vids[videoIdx],
          processing: true,
          jobId: renderId,
          provider: 'shotstack',
          enhanceType: 'basic',
          shotstackFilter: filter
        };
        areas[areaIdx] = { ...area, videos: vids };
        updatePayload = { common_areas: areas };
      } else if (videoType === 'room' && roomIdx !== undefined) {
        const rooms = [...(prop.rooms || [])];
        rooms[roomIdx] = {
          ...rooms[roomIdx],
          video: {
            ...rooms[roomIdx].video,
            processing: true,
            jobId: renderId,
            provider: 'shotstack',
            enhanceType: 'basic',
            shotstackFilter: filter
          }
        };
        updatePayload = { rooms };
      }

      await supabaseClient.from('properties').update(updatePayload).eq('id', propertyId);
    }

    return NextResponse.json({
      success: true,
      provider: 'shotstack',
      id: renderId,
      filename,
      filter
    });

  } catch (err: any) {
    console.error('[Basic Enhance POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ─── GET: Poll Shotstack render status ────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const provider = searchParams.get('provider');
    const filename = searchParams.get('filename');
    const propertyId = searchParams.get('propertyId');
    const videoType = searchParams.get('videoType');
    const videoIdx = searchParams.get('videoIdx');
    const areaIdx = searchParams.get('areaIdx');
    const roomIdx = searchParams.get('roomIdx');
    const userToken = searchParams.get('userToken');
    const userId = searchParams.get('userId');

    if (!id || !provider || !filename) {
      return NextResponse.json({ error: 'Faltan parámetros (id, provider, filename)' }, { status: 400 });
    }

    if (provider !== 'shotstack') {
      return NextResponse.json({ error: 'Proveedor no soportado. Usa provider=shotstack.' }, { status: 400 });
    }

    const shotstackKey = (process.env.SHOTSTACK_API_KEY || '').trim();
    if (!shotstackKey) {
      return NextResponse.json({ error: 'SHOTSTACK_API_KEY no configurada' }, { status: 500 });
    }

    // ── Poll Shotstack for render status ──────────────────────────────────────
    const pollRes = await fetch(`${SHOTSTACK_API}/render/${id}`, {
      headers: { 'x-api-key': shotstackKey }
    });

    const pollRawText = await pollRes.text();
    let pollData: any;
    try {
      pollData = JSON.parse(pollRawText);
    } catch {
      return NextResponse.json({
        status: 'error',
        error: `Shotstack devolvió respuesta no válida (HTTP ${pollRes.status}): ${pollRawText.slice(0, 300)}`
      });
    }

    if (!pollRes.ok) {
      return NextResponse.json({
        status: 'error',
        error: `Error de Shotstack (HTTP ${pollRes.status}): ${pollData?.message || pollRawText.slice(0, 200)}`
      });
    }

    const renderStatus = pollData?.response?.status;
    console.log(`[Basic Enhance GET] renderId=${id} status=${renderStatus}`);

    // ── Failed ────────────────────────────────────────────────────────────────
    if (renderStatus === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: pollData?.response?.error || 'El render de Shotstack ha fallado'
      });
    }

    // ── Still processing ──────────────────────────────────────────────────────
    if (renderStatus !== 'done') {
      const progressMap: Record<string, string> = {
        queued: 'En cola...',
        fetching: 'Descargando vídeo...',
        rendering: 'Aplicando ajustes de color...',
        saving: 'Guardando resultado...'
      };
      return NextResponse.json({
        status: 'processing',
        progress: progressMap[renderStatus] || renderStatus
      });
    }

    // ── Done: download and upload to Supabase ─────────────────────────────────
    const shotstackOutputUrl = pollData?.response?.url;
    if (!shotstackOutputUrl) {
      return NextResponse.json({
        status: 'failed',
        error: 'Shotstack completó el render pero no devolvió URL de salida'
      });
    }

    console.log(`[Basic Enhance GET] Render done. Downloading from Shotstack: ${shotstackOutputUrl}`);

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: userToken ? { Authorization: `Bearer ${userToken}` } : {} }
    });

    // Download from Shotstack
    const outputBuffer = await downloadToBuffer(shotstackOutputUrl);

    // Upload to Supabase Storage
    const decodedFilename = decodeURIComponent(filename);
    const pathParts = decodedFilename.split('/');
    const folderName = pathParts[0];
    const fileBase = pathParts[1]?.split('.')[0] || 'video';
    const targetFilename = `${folderName}/${fileBase}_enhanced_basic.mp4`;

    const { error: uploadErr } = await supabaseClient.storage
      .from('property-images')
      .upload(targetFilename, outputBuffer, {
        contentType: 'video/mp4',
        cacheControl: '31536000',
        upsert: true
      });

    if (uploadErr) throw new Error(`Error al subir a Supabase: ${uploadErr.message}`);

    const { data: storageData } = supabaseClient.storage.from('property-images').getPublicUrl(targetFilename);
    const publicUrl = storageData.publicUrl;

    console.log(`[Basic Enhance GET] Uploaded to Supabase: ${publicUrl}`);

    // ── Update DB if we have the context ─────────────────────────────────────
    if (propertyId && videoType) {
      try {
        const { data: prop } = await supabaseClient
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single();

        if (prop) {
          let updatePayload: any = {};
          const method = 'Ajuste de Luz (Shotstack)';
          const cost = '0.06';
          const logText = `El vídeo se procesó en la nube con Shotstack. Se aplicó un ajuste de color automático recomendado por IA (filtro: ${searchParams.get('filter') || 'boost'}).`;
          let videoTitle = 'Vídeo';

          if (videoType === 'gallery' && videoIdx !== null) {
            const vids = [...(prop.videos_metadata || [])];
            const idx = parseInt(videoIdx!);
            const videoItem = vids[idx];
            videoTitle = videoItem?.title || videoTitle;
            vids[idx] = {
              ...videoItem,
              url: publicUrl,
              optimized: true,
              processing: false,
              jobId: undefined,
              provider: undefined,
              enhanceType: undefined,
              shotstackFilter: undefined,
              cost,
              method,
              log: logText
            };
            updatePayload = { videos_metadata: vids };
          } else if (videoType === 'common_area' && areaIdx !== null && videoIdx !== null) {
            const areas = [...(prop.common_areas || [])];
            const aIdx = parseInt(areaIdx!);
            const vIdx = parseInt(videoIdx!);
            const area = areas[aIdx];
            const vids = [...(area.videos || [])];
            videoTitle = vids[vIdx]?.title || `Vídeo en ${area.name || area.type}`;
            vids[vIdx] = {
              ...vids[vIdx],
              url: publicUrl,
              optimized: true,
              processing: false,
              jobId: undefined,
              provider: undefined,
              enhanceType: undefined,
              shotstackFilter: undefined,
              cost,
              method,
              log: logText
            };
            areas[aIdx] = { ...area, videos: vids };
            updatePayload = { common_areas: areas };
          } else if (videoType === 'room' && roomIdx !== null) {
            const rooms = [...(prop.rooms || [])];
            const rIdx = parseInt(roomIdx!);
            const room = rooms[rIdx];
            videoTitle = room.video?.title || `Vídeo en Habitación ${room.name || rIdx + 1}`;
            rooms[rIdx] = {
              ...room,
              video: {
                ...room.video,
                url: publicUrl,
                optimized: true,
                processing: false,
                jobId: undefined,
                provider: undefined,
                enhanceType: undefined,
                shotstackFilter: undefined,
                cost,
                method,
                log: logText
              }
            };
            updatePayload = { rooms };
          }

          await supabaseClient.from('properties').update(updatePayload).eq('id', propertyId);

          if (userId) {
            await supabaseClient.from('notifications').insert({
              user_id: userId,
              title: '✅ Ajuste de luz completado',
              message: `El ajuste de luz para "${videoTitle}" de "${prop.title || 'Propiedad'}" se ha completado correctamente.`,
              type: 'video_enhance_success',
              is_read: false,
              action_url: `/admin/propiedades/${propertyId}`,
              related_id: propertyId,
              related_type: 'property'
            });
          }
        }
      } catch (dbErr: any) {
        console.error('[Basic Enhance GET] DB update failed:', dbErr.message);
        // Still return success — the file was uploaded
      }
    }

    return NextResponse.json({
      status: 'succeeded',
      enhancedUrl: publicUrl,
      filename: targetFilename
    });

  } catch (err: any) {
    console.error('[Basic Enhance GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
