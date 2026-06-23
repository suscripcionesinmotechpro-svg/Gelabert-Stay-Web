"use client";
import React, { useState } from 'react';
import { Loader2, Sparkles, Film, Download, CheckCircle2, RotateCw, XCircle, ChevronDown, ChevronUp, Copy, Check, AlertCircle } from 'lucide-react';
import { ProcessingVideo } from '../../hooks/useGlobalVideoPolling';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth.tsx';

interface VideoProcessingWidgetProps {
  processingVideos: ProcessingVideo[];
}

export const VideoProcessingWidget = ({ processingVideos }: VideoProcessingWidgetProps) => {
  const [minimized, setMinimized] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { user } = useAuth();

  if (processingVideos.length === 0) return null;

  const hasError = processingVideos.some(v => v.errorMessage || v.progress === 'error' || v.progress === 'error de conexión');

  const handleCopyError = async (error: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(error);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = error;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

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
            enhanceType: undefined,
            optimized: false,
            cost: undefined,
            method: undefined,
            log: undefined,
            shotstackFilter: undefined
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
              enhanceType: undefined,
              optimized: false,
              cost: undefined,
              method: undefined,
              log: undefined,
              shotstackFilter: undefined
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
              enhanceType: undefined,
              optimized: false,
              cost: undefined,
              method: undefined,
              log: undefined,
              shotstackFilter: undefined
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
      // Start a new premium enhancement prediction
      const response = await fetch('/api/enhance-video-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: video.videoUrl,
          filename: video.videoUrl.split('/property-images/')[1]
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
            enhanceType: 'premium'
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
              enhanceType: 'premium'
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
              enhanceType: 'premium'
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
          {hasError
            ? <AlertCircle className="w-4 h-4 text-red-400 animate-pulse" />
            : <Loader2 className="w-4 h-4 text-[#C9A962] animate-spin" />
          }
          <span className="font-primary text-xs font-bold uppercase tracking-widest text-[#FAF8F5]">
            {hasError ? `Error en Vídeo (${processingVideos.length})` : `Optimizando Vídeo (${processingVideos.length})`}
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
            const isError = !!video.errorMessage || progressVal === 'error' || progressVal === 'error de conexión';
            const percentMatch = progressVal.match(/(\d+)%/);
            const percentage = percentMatch ? parseInt(percentMatch[1], 10) : null;

            return (
              <div key={video.videoUrl + idx} className={`flex flex-col gap-2.5 ${idx > 0 ? 'pt-3.5' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 p-1 border rounded-sm shrink-0 ${
                    isError
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-[#C9A962]/5 border-[#C9A962]/10'
                  }`}>
                    {isError
                      ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      : <Film className="w-3.5 h-3.5 text-[#C9A962]" />
                    }
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

                {/* Error panel */}
                {isError && video.errorMessage && (
                  <div className="bg-red-950/30 border border-red-500/20 rounded-sm p-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Error exacto</span>
                      <button
                        type="button"
                        onClick={() => handleCopyError(video.errorMessage!, idx)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider border transition-all
                          border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-transparent cursor-pointer"
                        title="Copiar error"
                      >
                        {copiedIdx === idx
                          ? <><Check className="w-2.5 h-2.5" /> Copiado</>  
                          : <><Copy className="w-2.5 h-2.5" /> Copiar</>
                        }
                      </button>
                    </div>
                    <p className="font-mono text-[9px] text-red-300 break-all leading-relaxed select-text">
                      {video.errorMessage}
                    </p>
                  </div>
                )}

                {/* Progress bar / Indicator */}
                {!isError && (
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <div className="flex items-center justify-between text-[9px] font-primary select-none">
                    <span className="text-zinc-400 uppercase tracking-wider font-bold">
                      Ajuste Ultra Premium (IA)
                    </span>
                    <span className="text-[#C9A962] font-bold uppercase tracking-wider">
                      {progressVal}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden relative">
                    {percentage !== null ? (
                      <div 
                        className="h-full bg-[#C9A962] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    ) : (
                      // Indeterminate animation — sliding bar, not stuck at 40%
                      <div
                        className="absolute top-0 left-0 h-full w-2/5 bg-gradient-to-r from-transparent via-[#C9A962] to-transparent rounded-full"
                        style={{
                          animation: 'slideProgress 1.8s ease-in-out infinite'
                        }}
                      />
                    )}
                  </div>
                </div>
                )}

                {/* Status text when error but no detail */}
                {isError && !video.errorMessage && (
                  <p className="text-[10px] text-red-400 font-primary">
                    {progressVal} — usa Reintentar o Cancelar para recuperarte.
                  </p>
                )}

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
