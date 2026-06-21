"use client";
import React, { useState } from 'react';
import { Loader2, Sparkles, Film, ArrowRight, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ProcessingVideo } from '../../hooks/useGlobalVideoPolling';

interface VideoProcessingWidgetProps {
  processingVideos: ProcessingVideo[];
}

export const VideoProcessingWidget = ({ processingVideos }: VideoProcessingWidgetProps) => {
  const [minimized, setMinimized] = useState(false);

  if (processingVideos.length === 0) return null;

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
            const isTensorPix = video.provider === 'tensorpix';
            const progressVal = video.progress || '';
            const percentMatch = progressVal.match(/(\d+)%/);
            const percentage = percentMatch ? parseInt(percentMatch[1], 10) : null;

            return (
              <div key={video.videoUrl + idx} className={`flex flex-col gap-2 ${idx > 0 ? 'pt-3.5' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 bg-[#C9A962]/5 border border-[#C9A962]/10 rounded-sm shrink-0">
                    <Film className="w-3.5 h-3.5 text-[#C9A962]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-primary text-xs font-bold text-[#FAF8F5] truncate">
                      {video.title}
                    </p>
                    <p className="font-primary text-[10px] text-zinc-500 truncate mt-0.5">
                      Propiedad: <span className="text-zinc-400 font-bold">{video.propertyName}</span>
                    </p>
                  </div>
                </div>

                {/* Progress bar / Indicator */}
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <div className="flex items-center justify-between text-[9px] font-primary select-none">
                    <span className="text-zinc-500 uppercase tracking-wider font-bold">
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
              </div>
            );
          })}
        </div>
      )}

      {/* Mini notification helper */}
      {!minimized && (
        <div className="px-4 py-2 border-t border-[#1F1F1F] bg-[#0A0A0A] flex items-center justify-between text-[9px] font-primary text-zinc-600 select-none">
          <span>Segundo plano activo</span>
          <span>Puedes salir de esta página</span>
        </div>
      )}
    </div>
  );
};
