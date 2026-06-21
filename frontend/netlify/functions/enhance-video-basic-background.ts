import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

// Configure FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to download external URL to local file
async function downloadToFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download video: ${res.statusText}`);
  const fileStream = fs.createWriteStream(destPath);
  await finished(Readable.fromWeb(res.body as any).pipe(fileStream));
}

export const handler: Handler = async (event, context) => {
  // Netlify Background Functions automatically run in the background.
  // The client receives 202 Accepted immediately when calling this function.

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let bodyData: any = {};
  try {
    bodyData = JSON.parse(event.body || '{}');
  } catch (e) {
    console.error('Failed to parse body:', e);
    return { statusCode: 400, body: 'Invalid JSON' };
  }

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
  } = bodyData;

  if (!videoUrl || !filename || !propertyId || !userToken) {
    console.error('Missing required parameters in background function');
    return { statusCode: 400, body: 'Missing parameters' };
  }

  // Initialize Supabase authenticated as the calling user
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enhance-video-bg-'));
  const tempInputPath = path.join(tempDir, 'input.mp4');
  const tempOutputPath = path.join(tempDir, 'output.mp4');

  try {
    console.log(`[BG Enhance] Starting download of ${videoUrl}`);
    await downloadToFile(videoUrl, tempInputPath);

    // 1. Get video duration
    const duration: number = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempInputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration || 0);
      });
    });

    console.log(`[BG Enhance] Video duration: ${duration}s`);
    if (duration <= 0) throw new Error('Could not determine video duration');

    // 2. Extract 3 frames at 25%, 50%, and 75%
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
          count: 3,
          timestamps,
          folder: tempDir,
          filename: 'frame-%i.png',
          size: '640x?' // Downscale for faster analysis
        });
    });

    console.log(`[BG Enhance] Extracted ${extractedFrames.length} frames`);

    // 3. Convert frames to base64 for Gemini
    const base64Images = extractedFrames.map(framePath => {
      return fs.readFileSync(framePath).toString('base64');
    });

    // 4. Ask Gemini for enhancement values
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
    let filters = { brightness: 1.08, contrast: 1.04, saturation: 1.05 }; // Default fallback

    if (geminiKey && geminiKey !== 'undefined' && geminiKey !== 'null') {
      try {
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

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (geminiRes.ok) {
          const resJson = await geminiRes.json();
          const textResult = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResult) {
            filters = JSON.parse(textResult.trim());
            console.log('[BG Enhance] Gemini filter recommendations:', filters);
          }
        } else {
          console.warn('[BG Enhance] Gemini API call returned error, using fallback');
        }
      } catch (geminiErr) {
        console.error('[BG Enhance] Gemini analysis failed, using fallback:', geminiErr);
      }
    } else {
      console.log('[BG Enhance] Gemini API key not configured, using fallback filter values');
    }

    // 5. Apply filters using FFmpeg
    // eq filter in ffmpeg: brightness is [-1.0, 1.0] (0.0 default), contrast is [-2.0, 2.0] (1.0 default), saturation is [0.0, 3.0] (1.0 default)
    const eqBrightness = filters.brightness - 1.0;
    const eqContrast = filters.contrast;
    const eqSaturation = filters.saturation;

    console.log(`[BG Enhance] Applying FFmpeg filters: brightness=${eqBrightness}, contrast=${eqContrast}, saturation=${eqSaturation}`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInputPath)
        .videoFilter(`eq=brightness=${eqBrightness.toFixed(2)}:contrast=${eqContrast.toFixed(2)}:saturation=${eqSaturation.toFixed(2)}`)
        .videoCodec('libx264')
        .outputOptions([
          '-pix_fmt yuv420p',
          '-c:a copy', // Copy audio directly to prevent lag and preserve quality
          '-preset ultrafast', // Use ultrafast preset for maximum speed (vital on serverless)
          '-crf 23'
        ])
        .output(tempOutputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    console.log('[BG Enhance] Video processed successfully. Uploading to Storage...');

    // 6. Upload enhanced video back to Supabase Storage
    const outputBuffer = fs.readFileSync(tempOutputPath);
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

    if (uploadErr) throw uploadErr;

    const { data } = supabase.storage.from('property-images').getPublicUrl(targetFilename);
    const publicUrl = data.publicUrl;
    console.log(`[BG Enhance] Public URL: ${publicUrl}`);

    // 7. Update database record
    console.log(`[BG Enhance] Fetching property ID: ${propertyId}`);
    const { data: prop, error: fetchErr } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (fetchErr || !prop) {
      throw new Error(`Failed to fetch property: ${fetchErr?.message || 'Not found'}`);
    }

    let updatePayload: any = {};
    const method = 'Ajuste de Luz (Local FFmpeg)';
    const cost = '0.05';
    const logText = `El vídeo se procesó localmente usando FFmpeg en la nube. Se aplicaron ajustes automáticos de luz y color recomendados por IA (brillo: ${filters.brightness.toFixed(2)}x, contraste: ${filters.contrast.toFixed(2)}x, saturación: ${filters.saturation.toFixed(2)}x). preset=ultrafast.`;

    let videoTitle = 'Vídeo de Propiedad';

    if (videoType === 'gallery' && videoIdx !== undefined) {
      const vids = [...(prop.videos_metadata || [])];
      const videoItem = vids[videoIdx];
      videoTitle = videoItem?.title || videoTitle;
      vids[videoIdx] = {
        ...videoItem,
        url: publicUrl,
        optimized: true,
        processing: false,
        jobId: undefined,
        provider: undefined,
        enhanceType: undefined,
        cost,
        method,
        log: logText
      };
      updatePayload = { videos_metadata: vids };
    } else if (videoType === 'common_area' && areaIdx !== undefined && videoIdx !== undefined) {
      const areas = [...(prop.common_areas || [])];
      const area = areas[areaIdx];
      const vids = [...(area.videos || [])];
      const videoItem = vids[videoIdx];
      videoTitle = videoItem?.title || `Vídeo en ${area.name || area.type}`;
      vids[videoIdx] = {
        ...videoItem,
        url: publicUrl,
        optimized: true,
        processing: false,
        jobId: undefined,
        provider: undefined,
        enhanceType: undefined,
        cost,
        method,
        log: logText
      };
      areas[areaIdx] = { ...area, videos: vids };
      updatePayload = { common_areas: areas };
    } else if (videoType === 'room' && roomIdx !== undefined) {
      const rooms = [...(prop.rooms || [])];
      const room = rooms[roomIdx];
      const videoItem = room.video;
      videoTitle = videoItem?.title || `Vídeo en Habitación ${room.name || roomIdx + 1}`;
      rooms[roomIdx] = {
        ...room,
        video: {
          ...videoItem,
          url: publicUrl,
          optimized: true,
          processing: false,
          jobId: undefined,
          provider: undefined,
          enhanceType: undefined,
          cost,
          method,
          log: logText
        }
      };
      updatePayload = { rooms };
    }

    const { error: updateErr } = await supabase
      .from('properties')
      .update(updatePayload)
      .eq('id', propertyId);

    if (updateErr) throw updateErr;

    console.log('[BG Enhance] Property metadata updated successfully. Creating success notification.');

    // 8. Create user notification
    if (userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '✅ Ajuste de luz completado',
        message: `El ajuste de luz rápido para "${videoTitle}" de la propiedad "${prop.title || 'Propiedad'}" se ha completado correctamente en 30 segundos.`,
        type: 'video_enhance_success',
        is_read: false,
        action_url: `/admin/propiedades/${propertyId}`,
        related_id: propertyId,
        related_type: 'property'
      });
    }

  } catch (err: any) {
    console.error('[BG Enhance Error]:', err);

    // Update DB to stop processing spinner and report failure
    try {
      const { data: prop } = await supabase
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
            processing: false,
            jobId: undefined,
            provider: undefined,
            enhanceType: undefined
          };
          updatePayload = { videos_metadata: vids };
        } else if (videoType === 'common_area' && areaIdx !== undefined && videoIdx !== undefined) {
          const areas = [...(prop.common_areas || [])];
          const area = areas[areaIdx];
          const vids = [...(area.videos || [])];
          vids[videoIdx] = {
            ...vids[videoIdx],
            processing: false,
            jobId: undefined,
            provider: undefined,
            enhanceType: undefined
          };
          areas[areaIdx] = { ...area, videos: vids };
          updatePayload = { common_areas: areas };
        } else if (videoType === 'room' && roomIdx !== undefined) {
          const rooms = [...(prop.rooms || [])];
          const room = rooms[roomIdx];
          rooms[roomIdx] = {
            ...room,
            video: {
              ...room.video,
              processing: false,
              jobId: undefined,
              provider: undefined,
              enhanceType: undefined
            }
          };
          updatePayload = { rooms };
        }

        await supabase.from('properties').update(updatePayload).eq('id', propertyId);

        if (userId) {
          await supabase.from('notifications').insert({
            user_id: userId,
            title: '❌ Error en ajuste de luz',
            message: `El ajuste de luz para el vídeo de la propiedad "${prop.title || 'Propiedad'}" falló: ${err.message || 'Error interno'}.`,
            type: 'video_enhance_failed',
            is_read: false,
            action_url: `/admin/propiedades/${propertyId}`,
            related_id: propertyId,
            related_type: 'property'
          });
        }
      }
    } catch (dbErr) {
      console.error('Failed to clean up processing state in database:', dbErr);
    }
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

  return { statusCode: 200, body: 'Background process finished' };
};
