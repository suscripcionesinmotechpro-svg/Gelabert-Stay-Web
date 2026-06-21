import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aumqjpqngmhpbwytpets.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

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

    const isNetlify = process.env.NETLIFY === 'true' || process.env.NODE_ENV === 'production';

    if (isNetlify) {
      // ─── PRODUCTION: Netlify Background Function ──────────────────────
      const origin = req.headers.get('origin') || req.headers.get('host') || '';
      const protocol = origin.includes('localhost') || origin.includes('127.0.0.1') ? 'http' : 'https';
      
      let siteUrl = `${protocol}://${origin}`;
      if (!origin) {
        siteUrl = 'https://gelaberthomes.es';
      }

      const bgFunctionUrl = `${siteUrl}/.netlify/functions/enhance-video-basic-background`;
      
      console.log(`[Basic Enhance Route] Triggering Netlify Background Function: ${bgFunctionUrl}`);
      
      // Fire-and-forget background function invocation
      fetch(bgFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          filename,
          propertyId,
          videoType,
          videoIdx,
          areaIdx,
          roomIdx,
          userToken,
          userId
        })
      }).catch(err => {
        console.error('[Basic Enhance Route] Background trigger failed:', err);
      });

      return NextResponse.json({
        success: true,
        provider: 'local',
        id: 'local-job',
        filename
      });

    } else {
      // ─── LOCAL DEVELOPMENT: Synchronous FFmpeg ─────────────────────────
      console.log('[Basic Enhance Route] Running synchronous FFmpeg enhancement locally...');

      // Dynamic import FFmpeg modules to prevent serverless import crashes in production
      const ffmpeg = (await import('fluent-ffmpeg')).default;
      const ffmpegInstaller = (await import('@ffmpeg-installer/ffmpeg')).default;
      const ffprobeInstaller = (await import('@ffprobe-installer/ffprobe')).default;

      // Configure FFmpeg paths
      ffmpeg.setFfmpegPath(ffmpegInstaller.path);
      ffmpeg.setFfprobePath(ffprobeInstaller.path);

      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${userToken}`
          }
        }
      });

      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enhance-video-local-'));
      const tempInputPath = path.join(tempDir, 'input.mp4');
      const tempOutputPath = path.join(tempDir, 'output.mp4');

      try {
        // Download video
        const res = await fetch(videoUrl);
        if (!res.ok) throw new Error(`Failed to download video: ${res.statusText}`);
        const fileStream = fs.createWriteStream(tempInputPath);
        await finished(Readable.fromWeb(res.body as any).pipe(fileStream));

        // Duration
        const duration: number = await new Promise((resolve, reject) => {
          ffmpeg.ffprobe(tempInputPath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration || 0);
          });
        });

        if (duration <= 0) throw new Error('Could not determine video duration');

        // Extract 3 screenshots
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
              size: '640x?'
            });
        });

        const base64Images = extractedFrames.map(framePath => {
          return fs.readFileSync(framePath).toString('base64');
        });

        // Gemini Analysis
        const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
        let filters = { brightness: 1.08, contrast: 1.04, saturation: 1.05 };

        if (geminiKey) {
          try {
            const prompt = `Analiza estos 3 fotogramas clave de un vídeo de una propiedad inmobiliaria.
Determina los ajustes promedio de brillo (brightness), contraste (contrast) y saturación (saturation) idóneos para embellecer el vídeo en su totalidad, hacerlo más luminoso, vivo y profesional.

Rango de valores permitidos (donde 1.0 representa el valor original sin cambios):
- brightness: de 0.95 a 1.25 (valores superiores a 1.0 aumentan la luz, valores inferiores la reducen si es demasiado brillante)
- contrast: de 0.95 a 1.15 (valores superiores a 1.0 aumentan la diferencia entre sombras y luces)
- saturation: de 0.95 a 1.15 (valores superiores a 1.0 avivan los colores de maderas, paredes, plantas, etc.)

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
              }
            }
          } catch (e) {
            console.error('Local Gemini analysis error:', e);
          }
        }

        // Apply filters in FFmpeg
        const eqBrightness = filters.brightness - 1.0;
        const eqContrast = filters.contrast;
        const eqSaturation = filters.saturation;

        await new Promise<void>((resolve, reject) => {
          ffmpeg(tempInputPath)
            .videoFilter(`eq=brightness=${eqBrightness.toFixed(2)}:contrast=${eqContrast.toFixed(2)}:saturation=${eqSaturation.toFixed(2)}`)
            .videoCodec('libx264')
            .outputOptions([
              '-pix_fmt yuv420p',
              '-c:a copy',
              '-preset ultrafast',
              '-crf 23'
            ])
            .output(tempOutputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        // Upload back to Supabase Storage
        const outputBuffer = fs.readFileSync(tempOutputPath);
        const pathParts = filename.split('/');
        const folderName = pathParts[0];
        const fileBase = pathParts[1].split('.')[0];
        const targetFilename = `${folderName}/${fileBase}_enhanced_basic.mp4`;

        const { error: uploadErr } = await supabaseClient.storage
          .from('property-images')
          .upload(targetFilename, outputBuffer, {
            contentType: 'video/mp4',
            cacheControl: '31536000',
            upsert: true,
          });

        if (uploadErr) throw uploadErr;

        const { data } = supabaseClient.storage.from('property-images').getPublicUrl(targetFilename);
        const publicUrl = data.publicUrl;

        // Update database directly
        const { data: prop } = await supabaseClient
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .single();

        if (prop) {
          let updatePayload: any = {};
          const method = 'Ajuste de Luz (Local FFmpeg)';
          const cost = '0.05';
          const logText = `El vídeo se procesó localmente de forma síncrona. Se aplicaron ajustes automáticos de luz y color recomendados por IA (brillo: ${filters.brightness.toFixed(2)}x, contraste: ${filters.contrast.toFixed(2)}x, saturación: ${filters.saturation.toFixed(2)}x). preset=ultrafast.`;

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

          await supabaseClient.from('properties').update(updatePayload).eq('id', propertyId);

          if (userId) {
            await supabaseClient.from('notifications').insert({
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
        }

        return NextResponse.json({
          success: true,
          enhancedUrl: publicUrl,
          filename: targetFilename
        });

      } catch (err: any) {
        console.error('[Local Basic Enhance Error]:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
      } finally {
        try {
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        } catch (e) {}
      }
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

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    if (provider === 'local') {
      // Find if any property has a video with this jobId and is still marked as processing
      const { data: properties } = await supabaseClient
        .from('properties')
        .select('id, videos_metadata, common_areas, rooms');

      let stillProcessing = false;
      let enhancedUrl = '';

      if (properties) {
        for (const prop of properties) {
          const vids = prop.videos_metadata || [];
          const foundVid = vids.find((v: any) => v.jobId === id);
          if (foundVid) {
            stillProcessing = foundVid.processing;
            enhancedUrl = foundVid.url;
            break;
          }

          const areas = prop.common_areas || [];
          for (const area of areas) {
            const areaVids = area.videos || [];
            const foundAreaVid = areaVids.find((v: any) => typeof v === 'object' && v !== null && v.jobId === id);
            if (foundAreaVid) {
              stillProcessing = foundAreaVid.processing;
              enhancedUrl = foundAreaVid.url;
              break;
            }
          }

          const rooms = prop.rooms || [];
          const foundRoom = rooms.find((r: any) => r.video && typeof r.video === 'object' && r.video.jobId === id);
          if (foundRoom) {
            stillProcessing = foundRoom.video.processing;
            enhancedUrl = foundRoom.video.url;
            break;
          }
        }
      }

      // If we found a video matching the jobId that is still processing, return processing state
      if (stillProcessing) {
        return NextResponse.json({
          status: 'processing',
          progress: 'Mejorando exposición y luz...'
        });
      }

      // Otherwise, the job has finished (or was removed). Return success with the target URL
      const pathParts = filename.split('/');
      const folderName = pathParts[0];
      const fileBase = pathParts[1].split('.')[0];
      const targetFilename = `${folderName}/${fileBase}_enhanced_basic.mp4`;

      const { data } = supabaseClient.storage.from('property-images').getPublicUrl(targetFilename);

      return NextResponse.json({
        status: 'succeeded',
        enhancedUrl: data.publicUrl,
        filename: targetFilename
      });

    } else {
      return NextResponse.json({ error: 'Proveedor de API no soportado' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('[Enhance Video Basic Get Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
