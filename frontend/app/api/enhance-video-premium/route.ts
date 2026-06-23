import { NextResponse } from 'next/server';
import Replicate from 'replicate';

// ─────────────────────────────────────────────────────────────────────────────
// POST — Inicia el trabajo de mejora premium en Replicate o TensorPix
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const {
      videoUrl,
      filename,
      propertyId,
      videoType,
      videoIdx,
      areaIdx,
      roomIdx,
      userId
    } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Falta la URL del vídeo' }, { status: 400 });
    }

    const replicateToken = (process.env.REPLICATE_API_TOKEN || '').trim();
    const tensorpixKey = (process.env.TENSORPIX_API_KEY || '').trim();

    if (replicateToken && replicateToken !== 'undefined' && replicateToken !== 'null') {
      // ─── REPLICATE PROVIDER ──────────────────────────────
      const replicate = new Replicate({ auth: replicateToken });

      // Construir URL del webhook con contexto de la propiedad
      const siteUrl = (process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
      let webhookUrl: string | undefined;

      if (siteUrl) {
        const webhookParams = new URLSearchParams({
          ...(propertyId && { propertyId }),
          ...(videoType && { videoType }),
          ...(videoIdx !== undefined && { videoIdx: String(videoIdx) }),
          ...(areaIdx !== undefined && { areaIdx: String(areaIdx) }),
          ...(roomIdx !== undefined && { roomIdx: String(roomIdx) }),
          ...(userId && { userId }),
          ...(filename && { filename: filename.split('/').slice(-2).join('/') })
        });
        webhookUrl = `${siteUrl}/.netlify/functions/replicate-webhook-background?${webhookParams.toString()}`;
        console.log('[Enhance Premium] Webhook URL:', webhookUrl);
      } else {
        console.warn('[Enhance Premium] No SITE_URL — sin webhook. El polling del cliente actuará de fallback.');
      }

      const prediction = await replicate.predictions.create({
        version: "3e56ce4b57863bd03048b42bc09bdd4db20d427cca5fde9d8ae4dc60e1bb4775",
        input: {
          video_path: videoUrl,
          resolution: "FHD",
          model: "RealESRGAN_x4plus"
        },
        ...(webhookUrl && {
          webhook: webhookUrl,
          // Solo recibimos eventos de finalización para no saturar el servidor
          webhook_events_filter: ["completed"]
        })
      });

      return NextResponse.json({
        success: true,
        provider: 'replicate',
        id: prediction.id,
        filename
      });

    } else if (tensorpixKey && tensorpixKey !== 'undefined' && tensorpixKey !== 'null') {
      // ─── TENSORPIX PROVIDER ──────────────────────────────
      // TensorPix no soporta webhooks — el polling del cliente actúa de fallback
      const response = await fetch('https://tensorpix.ai/api/jobs/from-url/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${tensorpixKey}`
        },
        body: JSON.stringify({
          video_url: videoUrl,
          ml_models: ['stabilization', 'denoise']
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`TensorPix API error: ${errText}`);
      }

      const jobData = await response.json();
      return NextResponse.json({
        success: true,
        provider: 'tensorpix',
        id: jobData.id,
        filename
      });

    } else {
      return NextResponse.json({
        error: 'No se ha configurado ninguna API Key para la mejora Premium (REPLICATE_API_TOKEN o TENSORPIX_API_KEY).'
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('[Enhance Video Premium POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// GET — Consulta el estado del trabajo de mejora.
//
// DISEÑO CLAVE: Este endpoint NO descarga ni sube el vídeo. Solo verifica
// el estado en Replicate/TensorPix y devuelve la URL de salida cuando termina.
// La descarga y la subida a Supabase las hace el CLIENTE (navegador), donde
// no existe el límite de timeout de 10s de las funciones serverless de Netlify.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const provider = searchParams.get('provider');

    if (!id || !provider) {
      return NextResponse.json({ error: 'Faltan parámetros de consulta (id, provider)' }, { status: 400 });
    }

    if (provider === 'replicate') {
      const replicateToken = (process.env.REPLICATE_API_TOKEN || '').trim();
      const replicate = new Replicate({ auth: replicateToken });

      const prediction = await replicate.predictions.get(id);

      if (prediction.status === 'succeeded') {
        const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        if (!outputUrl) {
          throw new Error('No output URL returned from Replicate');
        }
        // Devolvemos la URL de salida — el CLIENTE hará la descarga y subida
        return NextResponse.json({
          status: 'succeeded',
          outputUrl
        });

      } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
        return NextResponse.json({
          status: 'failed',
          error: prediction.error || 'Prediction failed or was canceled'
        });

      } else {
        // still starting | processing | queued etc.
        return NextResponse.json({
          status: 'processing',
          progress: prediction.status
        });
      }

    } else if (provider === 'tensorpix') {
      const tensorpixKey = (process.env.TENSORPIX_API_KEY || '').trim();

      const response = await fetch(`https://tensorpix.ai/api/jobs/${id}/`, {
        headers: {
          'Authorization': `Token ${tensorpixKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch TensorPix job details: ${response.statusText}`);
      }

      const jobData = await response.json();

      if (jobData.status === 2) {
        const outputUrl = jobData.output_video_url;
        if (!outputUrl) throw new Error('No output URL returned from TensorPix');
        // Devolvemos la URL de salida — el CLIENTE hará la descarga y subida
        return NextResponse.json({
          status: 'succeeded',
          outputUrl
        });

      } else if (jobData.status === 3 || jobData.status === 4) {
        return NextResponse.json({
          status: 'failed',
          error: 'TensorPix job failed or was canceled'
        });

      } else {
        return NextResponse.json({
          status: 'processing',
          progress: jobData.progress !== undefined ? `${jobData.progress}%` : 'enhancing'
        });
      }

    } else {
      return NextResponse.json({ error: 'Proveedor de API no soportado' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('[Enhance Video Premium GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
