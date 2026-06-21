import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { supabase } from '../../../src/lib/supabase';

// Helper to download external URL to buffer
async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: Request) {
  try {
    const { videoUrl, filename } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Falta la URL del vídeo' }, { status: 400 });
    }

    const replicateToken = (process.env.REPLICATE_API_TOKEN || '').trim();
    const tensorpixKey = (process.env.TENSORPIX_API_KEY || '').trim();

    if (replicateToken && replicateToken !== 'undefined' && replicateToken !== 'null') {
      // ─── REPLICATE PROVIDER (Option A: Basic color/restoration) ─────────────────
      const replicate = new Replicate({ auth: replicateToken });

      const prediction = await replicate.predictions.create({
        version: "3e56ce4b57863bd03048b42bc09bdd4db20d427cca5fde9d8ae4dc60e1bb4775", // Real-ESRGAN video model
        input: {
          video_path: videoUrl,
          resolution: "HD", // Lower resolution (HD instead of FHD) for faster processing
          model: "RealESRGAN_x4plus"
        }
      });

      return NextResponse.json({
        success: true,
        provider: 'replicate',
        id: prediction.id,
        filename
      });

    } else if (tensorpixKey && tensorpixKey !== 'undefined' && tensorpixKey !== 'null') {
      // ─── TENSORPIX PROVIDER (Option A: Basic Color Restoration) ──────────────────
      const response = await fetch('https://tensorpix.ai/api/jobs/from-url/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${tensorpixKey}`
        },
        body: JSON.stringify({
          video_url: videoUrl,
          ml_models: ['color_restoration'] // Fast color enhancement filter
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
        error: 'No se ha configurado ninguna API Key para la mejora (REPLICATE_API_TOKEN o TENSORPIX_API_KEY).'
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('[Enhance Video Basic Start Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const provider = searchParams.get('provider');
    const filename = searchParams.get('filename');

    if (!id || !provider || !filename) {
      return NextResponse.json({ error: 'Faltan parámetros de consulta (id, provider, filename)' }, { status: 400 });
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

        // Download result and upload to Supabase Storage as basic enhanced
        const buffer = await downloadToBuffer(outputUrl);
        const pathParts = filename.split('/');
        const folderName = pathParts[0];
        const fileBase = pathParts[1].split('.')[0];
        const targetFilename = `${folderName}/${fileBase}_enhanced_basic.mp4`;

        const { error: uploadErr } = await supabase.storage
          .from('property-images')
          .upload(targetFilename, buffer, {
            contentType: 'video/mp4',
            cacheControl: '31536000',
            upsert: true,
          });

        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from('property-images').getPublicUrl(targetFilename);

        return NextResponse.json({
          status: 'succeeded',
          enhancedUrl: data.publicUrl,
          filename: targetFilename
        });
      } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
        return NextResponse.json({
          status: 'failed',
          error: prediction.error || 'Prediction failed or was canceled'
        });
      } else {
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

      // In TensorPix, status 2 typically represents "succeeded"
      if (jobData.status === 2) {
        const outputUrl = jobData.output_video_url;
        if (!outputUrl) throw new Error('No output URL returned from TensorPix');

        // Download result and upload to Supabase Storage as basic enhanced
        const buffer = await downloadToBuffer(outputUrl);
        const pathParts = filename.split('/');
        const folderName = pathParts[0];
        const fileBase = pathParts[1].split('.')[0];
        const targetFilename = `${folderName}/${fileBase}_enhanced_basic.mp4`;

        const { error: uploadErr } = await supabase.storage
          .from('property-images')
          .upload(targetFilename, buffer, {
            contentType: 'video/mp4',
            cacheControl: '31536000',
            upsert: true,
          });

        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from('property-images').getPublicUrl(targetFilename);

        return NextResponse.json({
          status: 'succeeded',
          enhancedUrl: data.publicUrl,
          filename: targetFilename
        });
      } else if (jobData.status === 3 || jobData.status === 4) { // failed / canceled
        return NextResponse.json({
          status: 'failed',
          error: 'TensorPix job failed or was canceled'
        });
      } else {
        return NextResponse.json({
          status: 'processing',
          progress: 'enhancing'
        });
      }
    } else {
      return NextResponse.json({ error: 'Proveedor de API no soportado' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('[Enhance Video Basic Get Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
