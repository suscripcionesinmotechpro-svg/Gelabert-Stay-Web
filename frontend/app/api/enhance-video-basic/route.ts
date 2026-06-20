import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { supabase } from '../../../src/lib/supabase';

// Configure Ffmpeg paths
try {
  fs.chmodSync(ffmpegInstaller.path, '755');
  fs.chmodSync(ffprobeInstaller.path, '755');
} catch (e) {
  console.warn('Failed to chmod binaries:', e);
}

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export const maxDuration = 120; // Allow up to 2 minutes of API execution for long videos

export async function POST(req: Request) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enhance-video-'));
  const tempInputPath = path.join(tempDir, 'input.mp4');
  const tempOutputPath = path.join(tempDir, 'output.mp4');

  try {
    const { videoUrl, filename } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Falta la URL del vídeo' }, { status: 400 });
    }

    const rawApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    const apiKey = rawApiKey.trim();

    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      return NextResponse.json({ 
        error: 'La API Key de Gemini no está configurada en el servidor.' 
      }, { status: 500 });
    }

    // 1. Download video from Supabase Storage to local temp directory
    const res = await fetch(videoUrl);
    if (!res.ok) {
      throw new Error(`Failed to download video from storage: ${res.statusText}`);
    }
    const fileStream = fs.createWriteStream(tempInputPath);
    await finished(Readable.fromWeb(res.body as any).pipe(fileStream));

    // 2. Get video duration via ffprobe
    const duration: number = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempInputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration || 0);
      });
    });

    if (duration <= 0) {
      throw new Error('No se pudo determinar la duración del vídeo.');
    }

    // 3. Extract 3 frames at 25%, 50%, and 75% of duration
    const count = 3;
    const timestamps = [
      (duration * 0.25).toFixed(2),
      (duration * 0.50).toFixed(2),
      (duration * 0.75).toFixed(2),
    ];

    const extractedFrames: string[] = await new Promise((resolve, reject) => {
      const frames: string[] = [];
      ffmpeg(tempInputPath)
        .on('filenames', (filenames) => {
          filenames.forEach(f => frames.push(path.join(tempDir, f)));
        })
        .on('end', () => resolve(frames))
        .on('error', (err) => reject(err))
        .screenshots({
          count,
          timestamps,
          folder: tempDir,
          filename: 'frame-%i.png',
          size: '640x?' // Downscale for faster analysis and lower payload size
        });
    });

    if (extractedFrames.length === 0) {
      throw new Error('Error al extraer fotogramas del vídeo.');
    }

    // Convert frames to base64
    const base64Images = extractedFrames.map(framePath => {
      const fileBuffer = fs.readFileSync(framePath);
      return fileBuffer.toString('base64');
    });

    // 4. Send frames to Gemini 2.5 Flash for light analysis
    const prompt = `Analiza estos 3 fotogramas clave de un vídeo de una propiedad inmobiliaria.
Determina los ajustes promedio de brillo (brightness), contraste (contrast) y saturación (saturation) idóneos para embellecer el vídeo en su totalidad, hacerlo más luminoso, vivo y profesional.

Rango de valores permitidos (donde 1.0 representa el valor original sin cambios):
- brightness: de 0.95 a 1.25 (valores superiores a 1.0 aumentan la luz, valores inferiores la reducen si es demasiado brillante)
- contrast: de 0.95 a 1.15 (valores superiores a 1.0 aumentan la diferencia entre sombras y luces)
- saturation: de 0.95 a 1.15 (valores superiores a 1.0 avivan los colores de maderas, paredes, plantas, etc.)

Reglas de decisión:
- Si el espacio es oscuro (habitación poco iluminada o con luz escasa), el brillo debe subir a 1.10 - 1.25.
- Si el vídeo está apagado o plano de color, el contraste y la saturación deben subir a 1.05 - 1.12.
- Si el vídeo ya está bien expuesto, mantén el brillo en 1.0 o 1.02.
- Evita valores extremos que deformen el realismo.

Devuelve la respuesta estrictamente en formato JSON con la siguiente estructura:
{
  "brightness": 1.10,
  "contrast": 1.05,
  "saturation": 1.05
}`;

    const parts: any[] = [
      { text: prompt },
      ...base64Images.map(b64 => ({
        inlineData: {
          mimeType: 'image/png',
          data: b64,
        },
      })),
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    let filters = { brightness: 1.08, contrast: 1.04, saturation: 1.05 }; // fallback values

    if (geminiRes.ok) {
      const resJson = await geminiRes.json();
      const textResult = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResult) {
        try {
          filters = JSON.parse(textResult.trim());
        } catch (e) {
          console.warn('[Enhance Video API] Failed to parse Gemini response, using fallback.');
        }
      }
    } else {
      console.warn('[Enhance Video API] Gemini request failed, using fallback.');
    }

    console.log('[AI Video Enhancement filters applied]:', filters);

    // 5. Apply filters to video using FFmpeg
    // eq filter in ffmpeg: brightness is [-1.0, 1.0] (0.0 default), contrast is [-2.0, 2.0] (1.0 default), saturation is [0.0, 3.0] (1.0 default)
    const eqBrightness = filters.brightness - 1.0;
    const eqContrast = filters.contrast;
    const eqSaturation = filters.saturation;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .videoFilter(`eq=brightness=${eqBrightness.toFixed(2)}:contrast=${eqContrast.toFixed(2)}:saturation=${eqSaturation.toFixed(2)}`)
        .videoCodec('libx264')
        .outputOptions([
          '-pix_fmt yuv420p',
          '-c:a copy', // Copy audio directly to prevent lag and preserve high quality
          '-preset ultrafast',
          '-crf 23'
        ])
        .output(tempOutputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    // 6. Upload enhanced video back to Supabase Storage
    const outputBuffer = fs.readFileSync(tempOutputPath);
    
    // We overwrite or save as enhanced file path
    const pathParts = filename.split('/');
    const folderName = pathParts[0];
    const fileBase = pathParts[1].split('.')[0];
    const targetFilename = `${folderName}/${fileBase}_enhanced_basic.mp4`;

    const { error: uploadErr } = await supabase.storage
      .from('property-images')
      .upload(targetFilename, outputBuffer, {
        contentType: 'video/mp4',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadErr) {
      throw uploadErr;
    }

    const { data } = supabase.storage.from('property-images').getPublicUrl(targetFilename);

    return NextResponse.json({
      success: true,
      enhancedUrl: data.publicUrl,
      filename: targetFilename
    });

  } catch (err: any) {
    console.error('[Enhance Video Basic API Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('Failed to clean up temp files:', e);
    }
  }
}
