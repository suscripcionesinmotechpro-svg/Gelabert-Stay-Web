import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth.tsx';

export interface ProcessingVideo {
  propertyId: string;
  propertyName: string;
  videoUrl: string;
  title: string;
  jobId: string;
  provider: string;
  videoType: 'gallery' | 'common_area' | 'room';
  areaIdx?: number;
  roomIdx?: number;
  videoIdx?: number;
  progress?: string;
  errorMessage?: string;
}

export const useGlobalVideoPolling = () => {
  const { user } = useAuth();
  const [processingVideos, setProcessingVideos] = useState<ProcessingVideo[]>([]);

  const pollVideos = async () => {
    if (!user) return;

    try {
      // 1. Fetch all properties that might have videos in progress
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, videos_metadata, common_areas, rooms');

      if (error) throw error;
      if (!properties) return;

      const found: ProcessingVideo[] = [];

      properties.forEach((prop: any) => {
        // A. Gallery videos
        const galleryVids = prop.videos_metadata || [];
        galleryVids.forEach((v: any, vIdx: number) => {
          if (v.processing && v.jobId) {
            found.push({
              propertyId: prop.id,
              propertyName: prop.title || 'Propiedad sin título',
              videoUrl: v.url,
              title: v.title || 'Vídeo de galería',
              jobId: v.jobId,
              provider: v.provider || 'replicate',
              videoType: 'gallery',
              videoIdx: vIdx,
              progress: 'esperando...'
            });
          }
        });

        // B. Common areas
        const areas = prop.common_areas || [];
        areas.forEach((area: any, areaIdx: number) => {
          const areaVids = area.videos || [];
          areaVids.forEach((v: any, vIdx: number) => {
            const isObj = typeof v === 'object' && v !== null;
            if (isObj && v.processing && v.jobId) {
              found.push({
                propertyId: prop.id,
                propertyName: prop.title || 'Propiedad sin título',
                videoUrl: v.url,
                title: v.title || `Vídeo en ${area.name || area.type}`,
                jobId: v.jobId,
                provider: v.provider || 'replicate',
                videoType: 'common_area',
                areaIdx,
                videoIdx: vIdx,
                progress: 'esperando...'
              });
            }
          });
        });

        // C. Rooms
        const rooms = prop.rooms || [];
        rooms.forEach((room: any, roomIdx: number) => {
          const v = room.video;
          if (v && typeof v === 'object' && v.processing && v.jobId) {
            found.push({
              propertyId: prop.id,
              propertyName: prop.title || 'Propiedad sin título',
              videoUrl: v.url,
              title: v.title || `Vídeo en ${room.name || `Habitación ${roomIdx + 1}`}`,
              jobId: v.jobId,
              provider: v.provider || 'replicate',
              videoType: 'room',
              roomIdx,
              progress: 'esperando...'
            });
          }
        });
      });

      // 2. Poll the API for each found video
      const updatedFound: ProcessingVideo[] = [];

      for (const pv of found) {
        try {
          const params = new URLSearchParams({
            id: pv.jobId,
            provider: pv.provider
          });

          let checkData: any;
          try {
            const checkRes = await fetch(`/api/enhance-video-premium?${params.toString()}`);
            const rawText = await checkRes.text();

            try {
              checkData = JSON.parse(rawText);
            } catch {
              const errMsg = `Error de servidor (${checkRes.status}): La respuesta no es JSON válido. Respuesta: ${rawText.slice(0, 300)}`;
              console.error('[Poll] Non-JSON response:', rawText.slice(0, 500));
              updatedFound.push({ ...pv, progress: 'error', errorMessage: errMsg });
              continue;
            }

            if (!checkRes.ok) {
              const errMsg = checkData?.error || `Error HTTP ${checkRes.status}`;
              updatedFound.push({ ...pv, progress: 'error', errorMessage: errMsg });
              continue;
            }
          } catch (fetchErr: any) {
            const errMsg = `Error de conexión: ${fetchErr?.message || String(fetchErr)}`;
            updatedFound.push({ ...pv, progress: 'error de conexión', errorMessage: errMsg });
            continue;
          }

          if (checkData.status === 'succeeded') {
            // ─────────────────────────────────────────────────────────────────
            // El servidor nos da la URL de salida de Replicate/TensorPix.
            // Ahora el CLIENTE (navegador) hace la descarga y la subida a
            // Supabase Storage — sin límites de timeout de funciones serverless.
            // ─────────────────────────────────────────────────────────────────
            const outputUrl: string = checkData.outputUrl;

            let enhancedPublicUrl: string | null = null;

            try {
              // Update progress state before starting the upload so the widget shows it
              setProcessingVideos(prev =>
                prev.map(p => p.jobId === pv.jobId
                  ? { ...p, progress: 'Descargando desde la nube...' }
                  : p
                )
              );

              // Download the video in the browser
              const downloadRes = await fetch(outputUrl);
              if (!downloadRes.ok) throw new Error(`No se pudo descargar el vídeo mejorado: ${downloadRes.statusText}`);
              const videoBlob = await downloadRes.blob();

              // Build target path in Supabase Storage
              const originalPath = pv.videoUrl.split('/property-images/')[1];
              const pathParts = originalPath ? originalPath.split('/') : [];
              const folderName = pathParts[0] || pv.propertyId;
              const rawFileName = (pathParts[1] || 'video').split('.')[0];
              const targetFilename = `${folderName}/${rawFileName}_enhanced_premium.mp4`;

              setProcessingVideos(prev =>
                prev.map(p => p.jobId === pv.jobId
                  ? { ...p, progress: 'Subiendo a Supabase...' }
                  : p
                )
              );

              // Upload to Supabase Storage
              const { error: uploadErr } = await supabase.storage
                .from('property-images')
                .upload(targetFilename, videoBlob, {
                  contentType: 'video/mp4',
                  cacheControl: '31536000',
                  upsert: true
                });

              if (uploadErr) throw uploadErr;

              const { data: pubData } = supabase.storage
                .from('property-images')
                .getPublicUrl(targetFilename);

              enhancedPublicUrl = pubData.publicUrl;
            } catch (uploadError: any) {
              const errMsg = `Error al subir el vídeo: ${uploadError?.message || String(uploadError)}`;
              console.error('[Poll] Upload error:', errMsg);
              updatedFound.push({ ...pv, progress: 'error', errorMessage: errMsg });
              continue;
            }

            // Update DB with the new URL
            const { data: currentProp } = await supabase
              .from('properties')
              .select('videos_metadata, common_areas, rooms')
              .eq('id', pv.propertyId)
              .single();

            if (currentProp && enhancedPublicUrl) {
              const log = 'El vídeo original se envió al servicio de procesamiento en la nube con redes neuronales convolucionales. Se aplicó un proceso de estabilización digital de movimiento de cámara, reducción de ruido temporal e interpolación espacial para aumentar nitidez de bordes. El archivo original fue reemplazado por la versión premium.';
              const method = 'Ajuste Ultra Premium (IA)';
              const cost = '0.30';

              if (pv.videoType === 'gallery' && pv.videoIdx !== undefined) {
                const vids = [...(currentProp.videos_metadata || [])];
                const videoItem = vids[pv.videoIdx];
                vids[pv.videoIdx] = {
                  ...videoItem,
                  url: enhancedPublicUrl,
                  optimized: true,
                  processing: false,
                  jobId: undefined,
                  provider: undefined,
                  enhanceType: undefined,
                  cost,
                  method,
                  log
                };
                await supabase.from('properties').update({ videos_metadata: vids }).eq('id', pv.propertyId);

              } else if (pv.videoType === 'common_area' && pv.areaIdx !== undefined && pv.videoIdx !== undefined) {
                const areas = [...(currentProp.common_areas || [])];
                const area = areas[pv.areaIdx];
                const vids = [...(area.videos || [])];
                const videoItem = vids[pv.videoIdx];
                vids[pv.videoIdx] = {
                  ...videoItem,
                  url: enhancedPublicUrl,
                  optimized: true,
                  processing: false,
                  jobId: undefined,
                  provider: undefined,
                  enhanceType: undefined,
                  cost,
                  method,
                  log
                };
                areas[pv.areaIdx] = { ...area, videos: vids };
                await supabase.from('properties').update({ common_areas: areas }).eq('id', pv.propertyId);

              } else if (pv.videoType === 'room' && pv.roomIdx !== undefined) {
                const rooms = [...(currentProp.rooms || [])];
                const room = rooms[pv.roomIdx];
                const videoItem = room.video;
                rooms[pv.roomIdx] = {
                  ...room,
                  video: {
                    ...videoItem,
                    url: enhancedPublicUrl,
                    optimized: true,
                    processing: false,
                    jobId: undefined,
                    provider: undefined,
                    enhanceType: undefined,
                    cost,
                    method,
                    log
                  }
                };
                await supabase.from('properties').update({ rooms }).eq('id', pv.propertyId);
              }

              // Success notification
              await supabase.from('notifications').insert({
                user_id: user.id,
                title: '✅ Vídeo optimizado con éxito',
                message: `El vídeo "${pv.title}" de la propiedad "${pv.propertyName}" ha terminado de optimizarse con IA Premium.`,
                type: 'video_enhance_success',
                is_read: false,
                action_url: `/admin/propiedades/${pv.propertyId}`,
                related_id: pv.propertyId,
                related_type: 'property'
              });
            }
            // Video succeeded — do NOT add to updatedFound (remove from widget)

          } else if (checkData.status === 'failed') {
            const failedErrorMsg = checkData.error || checkData.errorMessage || 'Error desconocido durante la optimización';

            // Clean up DB state
            const { data: currentProp } = await supabase
              .from('properties')
              .select('videos_metadata, common_areas, rooms')
              .eq('id', pv.propertyId)
              .single();

            if (currentProp) {
              if (pv.videoType === 'gallery' && pv.videoIdx !== undefined) {
                const vids = [...(currentProp.videos_metadata || [])];
                vids[pv.videoIdx] = { ...vids[pv.videoIdx], processing: false, jobId: undefined, provider: undefined, enhanceType: undefined, lastError: failedErrorMsg };
                await supabase.from('properties').update({ videos_metadata: vids }).eq('id', pv.propertyId);

              } else if (pv.videoType === 'common_area' && pv.areaIdx !== undefined && pv.videoIdx !== undefined) {
                const areas = [...(currentProp.common_areas || [])];
                const area = areas[pv.areaIdx];
                const vids = [...(area.videos || [])];
                vids[pv.videoIdx] = { ...vids[pv.videoIdx], processing: false, jobId: undefined, provider: undefined, enhanceType: undefined, lastError: failedErrorMsg };
                areas[pv.areaIdx] = { ...area, videos: vids };
                await supabase.from('properties').update({ common_areas: areas }).eq('id', pv.propertyId);

              } else if (pv.videoType === 'room' && pv.roomIdx !== undefined) {
                const rooms = [...(currentProp.rooms || [])];
                const room = rooms[pv.roomIdx];
                rooms[pv.roomIdx] = {
                  ...room,
                  video: { ...room.video, processing: false, jobId: undefined, provider: undefined, enhanceType: undefined, lastError: failedErrorMsg }
                };
                await supabase.from('properties').update({ rooms }).eq('id', pv.propertyId);
              }

              // Failure notification
              await supabase.from('notifications').insert({
                user_id: user.id,
                title: '❌ Error de optimización',
                message: `La optimización del vídeo "${pv.title}" de la propiedad "${pv.propertyName}" ha fallado. Error: ${failedErrorMsg.slice(0, 200)}`,
                type: 'video_enhance_failed',
                is_read: false,
                action_url: `/admin/propiedades/${pv.propertyId}`,
                related_id: pv.propertyId,
                related_type: 'property'
              });
            }
            // Failed — also do NOT keep in updatedFound (remove from widget)

          } else {
            // Still processing — keep in list with updated progress
            updatedFound.push({
              ...pv,
              progress: checkData.progress || 'optimizando...',
              errorMessage: undefined
            });
          }
        } catch (e: any) {
          const errMsg = e?.message || String(e);
          console.error('[Global Video Poll Single Error]:', errMsg);
          updatedFound.push({ ...pv, progress: 'error', errorMessage: errMsg });
        }
      }

      setProcessingVideos(updatedFound);
    } catch (e) {
      console.error('[Global Video Polling Error]:', e);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Run immediately on mount
    pollVideos();

    // Run every 20 seconds
    const interval = setInterval(pollVideos, 20000);
    return () => clearInterval(interval);
  }, [user]);

  return { processingVideos };
};
