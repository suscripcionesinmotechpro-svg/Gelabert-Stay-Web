"use client";
import React, { useState } from 'react';
import { Loader2, Sparkles, Film, Download, CheckCircle2, RotateCw, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ProcessingVideo } from '../../hooks/useGlobalVideoPolling';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.tsx';

interface VideoProcessingWidgetProps {
  processingVideos: ProcessingVideo[];
}

export const VideoProcessingWidget = ({ processingVideos }: VideoProcessingWidgetProps) => {
  const [minimized, setMinimized] = useState(false);
  const { user } = useAuth();

  if (processingVideos.length === 0) return null;

  const handleCancel = async (video: ProcessingVideo) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar y reiniciar el estado de esta optimización de vídeo?')) {
      return;
    }

    const toastId = toast.loading('Cancelando optimización...');
    try {
      // 1. Fetch fresh property record
      const { data: prop, error: fetchErr } = await supabase
        .from('properties')
        .select('*')
        .eq('id', video.propertyId)
        .single();

      if (fetchErr || !prop) {
        throw new Error(`No se pudo obtener la propiedad: ${fetchErr?.message || 'No encontrada'}`);
      }

      let updatePayload: any = {};

      if (video.videoType === 'gallery' && video.videoIdx !== undefined) {
        const vids = [...(prop.videos_metadata || [])];
        if (vids[video.videoIdx]) {
          vids[video.videoIdx] = {
            ...vids[video.videoIdx],
            processing: false,
            jobId: undefined,
            provider: undefined,
            enhanceType: undefined
          };
          updatePayload = { videos_metadata: vids };
        }
      } else if (video.videoType === 'common_area' && video.areaIdx !== undefined && video.videoIdx !== undefined) {
        const areas = [...(prop.common_areas || [])];
        const area = areas[video.areaIdx];
        if (area && area.videos) {
          const vids = [...area.videos];
          if (vids[video.videoIdx]) {
            const v = vids[video.videoIdx];
            vids[video.videoIdx] = typeof v === 'object' && v !== null ? {
              ...v,
              processing: false,
              jobId: undefined,
              provider: undefined,
              enhanceType: undefined
            } : v;
            areas[video.areaIdx] = { ...area, videos: vids };
            updatePayload = { common_areas: areas };
          }
        }
      } else if (video.videoType === 'room' && video.roomIdx !== undefined) {
        const rooms = [...(prop.rooms || [])];
        const room = rooms[video.roomIdx];
        if (room && room.video) {
          rooms[video.roomIdx] = {
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
      }

      const { error: updateErr } = await supabase
        .from('properties')
        .update(updatePayload)
        .eq('id', video.propertyId);

      if (updateErr) throw updateErr;

      toast.success('Optimización cancelada/desbloqueada correctamente.', { id: toastId });
    } catch (err: any) {
      console.error('[Widget Cancel Error]:', err);
      toast.error(`Error al cancelar: ${err.message}`, { id: toastId });
    }
  };

  const handleRetry = async (video: ProcessingVideo) => {
    const toastId = toast.loading('Reintentando optimización...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token;

      if (!userToken) {
        throw new Error('Sesión no encontrada o expirada. Por favor, inicia sesión.');
      }

      const apiPath = video.enhanceType === 'basic' ? '/api/enhance-video-basic' : '/api/enhance-video-premium';

      // Start the enhancement prediction
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: video.videoUrl,
          filename: video.videoUrl.split('/property-images/')[1],
          propertyId: video.propertyId,
          videoType: video.videoType,
          videoIdx: video.videoIdx,
          areaIdx: video.areaIdx,
          roomIdx: video.roomIdx,
          userToken,
          userId: user?.id
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Fallo al iniciar el servicio de optimización.');
      }

      const data = await response.json();

      // Fetch fresh property record
      const { data: prop, error: fetchErr } = await supabase
        .from('properties')
        .select('*')
        .eq('id', video.propertyId)
        .single();

      if (fetchErr || !prop) {
        throw new Error(`Propiedad no encontrada para actualizar jobId.`);
      }

      let updatePayload: any = {};

      if (video.videoType === 'gallery' && video.videoIdx !== undefined) {
        const vids = [...(prop.videos_metadata || [])];
        if (vids[video.videoIdx]) {
          vids[video.videoIdx] = {
            ...vids[video.videoIdx],
            processing: true,
            jobId: data.id,
            provider: data.provider,
            enhanceType: video.enhanceType
          };
          updatePayload = { videos_metadata: vids };
        }
      } else if (video.videoType === 'common_area' && video.areaIdx !== undefined && video.videoIdx !== undefined) {
        const areas = [...(prop.common_areas || [])];
        const area = areas[video.areaIdx];
        if (area && area.videos) {
          const vids = [...area.videos];
          if (vids[video.videoIdx]) {
            const v = vids[video.videoIdx];
            vids[video.videoIdx] = typeof v === 'object' && v !== null ? {
              ...v,
              processing: true,
              jobId: data.id,
              provider: data.provider,
              enhanceType: video.enhanceType
            } : v;
            areas[video.areaIdx] = { ...area, videos: vids };
            updatePayload = { common_areas: areas };
          }
        }
      } else if (video.videoType === 'room' && video.roomIdx !== undefined) {
        const rooms = [...(prop.rooms || [])];
        const room = rooms[video.roomIdx];
        if (room && room.video) {
          rooms[video.roomIdx] = {
            ...room,
            video: {
              ...room.video,
              processing: true,
              jobId: data.id,
              provider: data.provider,
              enhanceType: video.enhanceType
            }
          };
          updatePayload = { rooms };
        }
      }

      const { error: updateErr } = await supabase
        .from('properties')
        .update(updatePayload)
        .eq('id', video.propertyId);

      if (updateErr) throw updateErr;

      toast.success('Optimización reiniciada correctamente.', { id: toastId });
    } catch (err: any) {
      console.error('[Widget Retry Error]:', err);
      toast.error(`Error al reintentar: ${err.message}`, { id: toastId });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm shadow-2xl z-[9999] overflow-hidden select-none animate-fadeIn">
      {/* Header */}
      <div 
        onClick={() => setMinimized(!minimized)}
        className="flex items-center justify-between px-4 py-3 bg-[#0F0F0F] border-b border-[#1F1F1F] cursor-pointer hover:bg-[#151515] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-[#C9A962] animate-spin" />
          <span className="font-primary text-xs font-bold uppercase tracking-widest text-[#FAF8F5]">
            Optimizando Vídeo ({processingVideos.length})
          </span>
        </div>
        <button className="text-zinc-500 hover:text-[#C9A962] transition-colors">
          {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="max-h-60 overflow-y-auto p-4 flex flex-col gap-3.5 bg-[#070707] divide-y divide-[#111111]">
          {processingVideos.map((video, idx) => {
            const progressVal = video.progress || '';
            const percentMatch = progressVal.match(/(\d+)%/);
            const percentage = percentMatch ? parseInt(percentMatch[1], 10) : null;

            return (
              <div key={video.videoUrl + idx} className={`flex flex-col gap-2.5 ${idx > 0 ? 'pt-3.5' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 bg-[#C9A962]/5 border border-[#C9A962]/10 rounded-sm shrink-0">
                    <Film className="w-3.5 h-3.5 text-[#C9A962]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-primary text-xs font-bold text-[#FAF8F5] truncate">
                      {video.title}
                    </p>
                    <p className="font-primary text-[10px] text-zinc-400 truncate mt-0.5">
                      Propiedad: <span className="text-zinc-300 font-bold">{video.propertyName}</span>
                    </p>
                  </div>
                </div>

                {/* Progress bar / Indicator */}
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <div className="flex items-center justify-between text-[9px] font-primary select-none">
                    <span className="text-zinc-400 uppercase tracking-wider font-bold">
                      {video.enhanceType === 'basic' ? 'Ajuste de Luz (Opción A)' : 'Ajuste Ultra Premium (Opción B)'}
                    </span>
                    <span className="text-[#C9A962] font-bold uppercase tracking-wider">
                      {progressVal}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-[#C9A962] rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: percentage !== null ? `${percentage}%` : '40%' 
                      }}
                    />
                    {percentage === null && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A962]/20 to-transparent w-1/2 h-full animate-shimmer" style={{ animationDuration: '1.5s' }} />
                    )}
                  </div>
                </div>

                {/* Quick actions for retry & cancel */}
                <div className="flex gap-2 justify-end mt-0.5">
                  <button
                    type="button"
                    onClick={() => handleRetry(video)}
                    className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider bg-transparent border border-[#C9A962]/40 text-[#C9A962] hover:bg-[#C9A962] hover:text-black hover:border-transparent transition-all rounded-sm flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-2.5 h-2.5" /> Reintentar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(video)}
                    className="px-2 py-1 text-[8px] font-bold uppercase tracking-wider bg-transparent border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-transparent transition-all rounded-sm flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-2.5 h-2.5" /> Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini notification helper */}
      {!minimized && (
        <div className="px-4 py-2 border-t border-[#1F1F1F] bg-[#0A0A0A] flex items-center justify-between text-[9px] font-primary text-zinc-400 select-none">
          <span>Segundo plano activo</span>
          <span>Puedes salir de esta página</span>
        </div>
      )}
    </div>
  );
};
