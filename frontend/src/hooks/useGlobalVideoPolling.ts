import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth.tsx';

export interface ProcessingVideo {
  propertyId: string;
  propertyName: string;
  videoUrl: string;
  title: string;
  enhanceType: 'basic' | 'premium';
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
      // 1. Fetch properties that might have processing videos
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
              enhanceType: v.enhanceType || 'basic',
              jobId: v.jobId,
              provider: v.provider || 'tensorpix',
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
                enhanceType: v.enhanceType || 'basic',
                jobId: v.jobId,
                provider: v.provider || 'tensorpix',
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
              enhanceType: v.enhanceType || 'basic',
              jobId: v.jobId,
              provider: v.provider || 'tensorpix',
              videoType: 'room',
              roomIdx,
              progress: 'esperando...'
            });
          }
        });
      });

      // 2. For each found video, poll the API to get current status/progress
      const updatedFound: ProcessingVideo[] = [];

      for (const pv of found) {
        try {
          const endpoint = pv.enhanceType === 'basic' ? '/api/enhance-video-basic' : '/api/enhance-video-premium';
          const filename = pv.videoUrl.split('/property-images/')[1];
          let checkData: any;

          try {
            // Build query params — basic enhance needs context to update DB on completion
            const params = new URLSearchParams({
              id: pv.jobId,
              provider: pv.provider,
              filename: filename,
              ...(pv.enhanceType === 'basic' && {
                propertyId: pv.propertyId,
                videoType: pv.videoType,
                ...(pv.videoIdx !== undefined && { videoIdx: String(pv.videoIdx) }),
                ...(pv.areaIdx !== undefined && { areaIdx: String(pv.areaIdx) }),
                ...(pv.roomIdx !== undefined && { roomIdx: String(pv.roomIdx) }),
                ...(user?.id && { userId: user.id })
              })
            });

            const checkRes = await fetch(`${endpoint}?${params.toString()}`);
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
            // Update in DB immediately!
            // Let's get fresh property record first to avoid overwriting other modifications
            const { data: currentProp } = await supabase
              .from('properties')
              .select('videos_metadata, common_areas, rooms')
              .eq('id', pv.propertyId)
              .single();

            if (currentProp) {
              const estimateVideoCost = (dur: number) => {
                const durMin = Math.max(1, Math.ceil(dur / 60));
                return {
                  basic: '0.05',
                  premium: (durMin * 0.30).toFixed(2)
                };
              };
              
              const method = pv.enhanceType === 'basic' ? 'Ajuste de Luz (Gemini)' : 'Ajuste Ultra Premium (IA)';
              
              if (pv.videoType === 'gallery' && pv.videoIdx !== undefined) {
                const vids = [...(currentProp.videos_metadata || [])];
                const videoItem = vids[pv.videoIdx];
                const duration = videoItem.duration || 0;
                const cost = pv.enhanceType === 'basic' ? estimateVideoCost(duration).basic : estimateVideoCost(duration).premium;
                const log = pv.enhanceType === 'basic'
                  ? 'El vídeo original se procesó en la nube con TensorPix para aplicar correcciones rápidas de luz y balance de blancos. El archivo de vídeo original fue reemplazado por la versión corregida.'
                  : 'El vídeo original se envió al servicio de procesamiento en la nube con redes neuronales convolucionales. Se aplicó un proceso de estabilización digital de movimiento de cámara, reducción de ruido temporal e interpolación espacial para aumentar nitidez de bordes. El archivo original fue reemplazado por la versión premium.';

                vids[pv.videoIdx] = {
                  ...videoItem,
                  url: checkData.enhancedUrl,
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
              } 
              
              else if (pv.videoType === 'common_area' && pv.areaIdx !== undefined && pv.videoIdx !== undefined) {
                const areas = [...(currentProp.common_areas || [])];
                const area = areas[pv.areaIdx];
                const vids = [...(area.videos || [])];
                const videoItem = vids[pv.videoIdx];
                const duration = videoItem.duration || 0;
                const cost = pv.enhanceType === 'basic' ? estimateVideoCost(duration).basic : estimateVideoCost(duration).premium;
                const log = pv.enhanceType === 'basic'
                  ? 'El vídeo de la zona común se procesó en la nube con TensorPix para aplicar correcciones rápidas de luz y balance de blancos. El archivo de vídeo original fue reemplazado por la versión corregida.'
                  : 'El vídeo original se envió al servicio de procesamiento en la nube con redes neuronales convolucionales. Se aplicó un proceso de estabilización digital de movimiento de cámara, reducción de ruido temporal e interpolación espacial para aumentar nitidez de bordes. El archivo original fue reemplazado por la versión premium.';

                vids[pv.videoIdx] = {
                  ...videoItem,
                  url: checkData.enhancedUrl,
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
              } 
              
              else if (pv.videoType === 'room' && pv.roomIdx !== undefined) {
                const rooms = [...(currentProp.rooms || [])];
                const room = rooms[pv.roomIdx];
                const videoItem = room.video;
                const duration = videoItem.duration || 0;
                const cost = pv.enhanceType === 'basic' ? estimateVideoCost(duration).basic : estimateVideoCost(duration).premium;
                const log = pv.enhanceType === 'basic'
                  ? 'El vídeo de la habitación se procesó en la nube con TensorPix para aplicar correcciones rápidas de luz y balance de blancos. El archivo de vídeo original fue reemplazado por la versión corregida.'
                  : 'El vídeo original se envió al servicio de procesamiento en la nube con redes neuronales convolucionales. Se aplicó un proceso de estabilización digital de movimiento de cámara, reducción de ruido temporal e interpolación espacial para aumentar nitidez de bordes. El archivo original fue reemplazado por la versión premium.';

                rooms[pv.roomIdx] = {
                  ...room,
                  video: {
                    ...videoItem,
                    url: checkData.enhancedUrl,
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

              // Create notification
              await supabase.from('notifications').insert({
                user_id: user.id,
                title: '✅ Vídeo optimizado con éxito',
                message: `El vídeo "${pv.title}" de la propiedad "${pv.propertyName}" ha terminado de optimizarse.`,
                type: 'video_enhance_success',
                is_read: false,
                action_url: `/admin/propiedades/${pv.propertyId}`,
                related_id: pv.propertyId,
                related_type: 'property'
              });
            }
          } else if (checkData.status === 'failed') {
            const failedErrorMsg = checkData.error || checkData.errorMessage || 'Error desconocido durante la optimización';

            // Update in DB to set processing: false and store the error message
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
              } 
              
              else if (pv.videoType === 'common_area' && pv.areaIdx !== undefined && pv.videoIdx !== undefined) {
                const areas = [...(currentProp.common_areas || [])];
                const area = areas[pv.areaIdx];
                const vids = [...(area.videos || [])];
                vids[pv.videoIdx] = { ...vids[pv.videoIdx], processing: false, jobId: undefined, provider: undefined, enhanceType: undefined, lastError: failedErrorMsg };
                areas[pv.areaIdx] = { ...area, videos: vids };
                await supabase.from('properties').update({ common_areas: areas }).eq('id', pv.propertyId);
              } 
              
              else if (pv.videoType === 'room' && pv.roomIdx !== undefined) {
                const rooms = [...(currentProp.rooms || [])];
                const room = rooms[pv.roomIdx];
                rooms[pv.roomIdx] = {
                  ...room,
                  video: { ...room.video, processing: false, jobId: undefined, provider: undefined, enhanceType: undefined, lastError: failedErrorMsg }
                };
                await supabase.from('properties').update({ rooms }).eq('id', pv.propertyId);
              }

              // Create notification
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
          } else {
            // Still processing: update progress status
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

    // Run every 15 seconds
    const interval = setInterval(pollVideos, 15000);
    return () => clearInterval(interval);
  }, [user]);

  return { processingVideos };
};
