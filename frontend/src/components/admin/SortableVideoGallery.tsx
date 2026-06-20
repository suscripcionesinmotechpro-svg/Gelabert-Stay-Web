import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Upload, X, Plus, Download, Sparkles, Loader2, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { PropertyVideo } from '../../types/property';
import { getVideoDuration, estimateVideoCost } from '../../utils/video';
import { toast } from 'react-hot-toast';

interface SortableVideoItemProps {
  video: PropertyVideo;
  onRemove: (url: string) => void;
  onTitleChange: (url: string, title: string) => void;
  duration: number;
  processingVideo: string | null;
  processingStatus: string | null;
  onEnhance: (type: 'basic' | 'premium') => void;
}

const SortableVideoItem = ({
  video,
  onRemove,
  onTitleChange,
  duration,
  processingVideo,
  processingStatus,
  onEnhance
}: SortableVideoItemProps) => {
  const { url, title } = video;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 1 : 0,
  };

  const isDirectVideo = !url.includes('youtube.com') && !url.includes('youtu.be') && !url.includes('vimeo.com');
  const costs = estimateVideoCost(duration);

  // Get thumbnail for YouTube or Vimeo
  let thumbnail = null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('watch?v=') 
      ? url.split('v=')[1]?.split('&')[0] 
      : url.split('/').pop()?.split('?')[0];
    if (videoId) {
      thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex gap-4 p-4 bg-[#070707] border border-[#1F1F1F] rounded-sm group relative"
    >
      {/* Grip Handle for DND */}
      <div 
        className="flex items-center cursor-grab active:cursor-grabbing text-[#444444] hover:text-[#C9A962] transition-colors px-1 touch-none self-stretch shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Video Preview */}
      <div className="relative w-32 aspect-video bg-black overflow-hidden shrink-0 rounded-sm border border-[#1F1F1F]">
        {thumbnail ? (
          <img src={thumbnail} alt="Video thumbnail" className="w-full h-full object-cover pointer-events-none opacity-60" />
        ) : (
          <video src={url} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Play className="w-6 h-6 text-white opacity-70" />
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <label className="font-primary text-[10px] text-[#888888] uppercase tracking-wider font-bold">
            Título del Vídeo
          </label>
          <button
            type="button"
            onClick={() => onRemove(url)}
            className="text-[#444444] hover:text-red-500 transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <input
          type="text"
          className="w-full h-9 bg-[#0A0A0A] border border-[#1F1F1F] px-3 text-xs text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-colors font-primary placeholder:text-[#333]"
          value={title}
          onChange={(e) => onTitleChange(url, e.target.value)}
          placeholder="Ej: Tour de la propiedad"
        />

        {/* Actions for Direct Videos */}
        {isDirectVideo && (
          <div className="flex flex-wrap items-center gap-3 mt-1.5 border-t border-[#111] pt-1.5">
            {duration > 0 && (
              <span className="font-primary text-[10px] text-[#666] select-none">
                Duración: {Math.floor(duration / 60)}m {Math.round(duration % 60)}s
              </span>
            )}

            <a
              href={url}
              download={title ? `${title.replace(/\s+/g, '_')}.mp4` : 'video.mp4'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-[#FAF8F5] hover:text-[#C9A962] font-primary uppercase tracking-wider font-bold transition-colors select-none"
            >
              <Download className="w-3 h-3" /> Descargar (Máx. Calidad)
            </a>

            {processingVideo === url ? (
              <div className="flex items-center gap-1.5 text-[10px] text-[#C9A962] font-primary uppercase tracking-wider font-bold animate-pulse select-none">
                <Loader2 className="w-3 h-3 animate-spin" /> {processingStatus || 'Procesando...'}
              </div>
            ) : (
              <div className="relative group/enhance">
                <button
                  type="button"
                  className="flex items-center gap-1 text-[10px] text-[#C9A962] hover:underline font-primary uppercase tracking-wider font-bold transition-all"
                >
                  <Sparkles className="w-3 h-3" /> Optimizar con IA
                </button>
                
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover/enhance:block hover/enhance:block bg-[#0A0A0A] border border-[#1F1F1F] p-2 flex flex-col gap-1 w-64 z-20 shadow-xl rounded-sm">
                  <p className="font-primary text-[9px] uppercase tracking-wider text-[#555] font-bold px-2 py-1 select-none">
                    Seleccionar Tipo de Mejora
                  </p>
                  <button
                    type="button"
                    onClick={() => onEnhance('basic')}
                    className="w-full text-left px-2 py-1.5 hover:bg-[#1A1A1A] transition-colors flex flex-col rounded-sm"
                  >
                    <span className="font-primary text-[10px] text-[#FAF8F5] font-bold">A. Ajuste de Luz (Gemini)</span>
                    <span className="font-primary text-[9px] text-[#666]">Luz y contraste optimizados • Coste: {costs.basic}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnhance('premium')}
                    className="w-full text-left px-2 py-1.5 hover:bg-[#1A1A1A] transition-colors flex flex-col rounded-sm"
                  >
                    <span className="font-primary text-[10px] text-[#C9A962] font-bold">B. Ajuste Ultra Premium (IA)</span>
                    <span className="font-primary text-[9px] text-[#666]">Estabilizado, nitidez y reducción de ruido • Coste: {costs.premium}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface SortableVideoGalleryProps {
  videos: PropertyVideo[];
  onChange: (videos: PropertyVideo[]) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export const SortableVideoGallery = ({ videos, onChange, onUpload, uploading }: SortableVideoGalleryProps) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [processingVideo, setProcessingVideo] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    videos.forEach((video) => {
      const url = video.url;
      if (url && !durations[url] && !url.includes('youtube.com') && !url.includes('youtu.be') && !url.includes('vimeo.com')) {
        getVideoDuration(url).then((d) => {
          if (d > 0) {
            setDurations((prev) => ({ ...prev, [url]: d }));
          }
        });
      }
    });
  }, [videos]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex(v => v.url === active.id);
      const newIndex = videos.findIndex(v => v.url === over.id);
      onChange(arrayMove(videos, oldIndex, newIndex));
    }
  };

  const addUrlVideo = () => {
    if (!videoUrl.trim()) return;
    onChange([...videos, { url: videoUrl.trim(), title: 'Vídeo' }]);
    setVideoUrl('');
  };

  const handleTitleChange = (url: string, title: string) => {
    onChange(videos.map(v => v.url === url ? { ...v, title } : v));
  };

  const handleEnhance = async (url: string, type: 'basic' | 'premium') => {
    const video = videos.find(v => v.url === url);
    if (!video) return;
    const title = video.title;

    setProcessingVideo(url);
    setProcessingStatus(type === 'basic' ? 'Analizando con Gemini...' : 'Enviando a servidor premium...');

    try {
      if (type === 'basic') {
        const response = await fetch('/api/enhance-video-basic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: url, filename: url.split('/property-images/')[1] })
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to enhance video basic');
        }
        const data = await response.json();
        
        onChange(videos.map(v => v.url === url ? { url: data.enhancedUrl, title } : v));
        toast.success('Vídeo optimizado con éxito');
      } else {
        const response = await fetch('/api/enhance-video-premium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: url, filename: url.split('/property-images/')[1] })
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to start premium enhance');
        }
        const data = await response.json();
        
        setProcessingStatus('Estabilizando y mejorando con IA...');
        let complete = false;
        let attempts = 0;
        const maxAttempts = 60; // 5 mins max
        
        while (!complete && attempts < maxAttempts) {
          attempts++;
          await new Promise(r => setTimeout(r, 5000));
          const checkRes = await fetch(`/api/enhance-video-premium?id=${data.id}&provider=${data.provider}&filename=${data.filename}`);
          if (!checkRes.ok) {
            throw new Error('Error al verificar estado de la optimización');
          }
          const checkData = await checkRes.json();
          if (checkData.status === 'succeeded') {
            onChange(videos.map(v => v.url === url ? { url: checkData.enhancedUrl, title } : v));
            complete = true;
            toast.success('Vídeo estabilizado y mejorado con éxito');
          } else if (checkData.status === 'failed') {
            throw new Error(checkData.error || 'Fallo en el procesamiento premium');
          }
        }
        if (!complete) {
          throw new Error('El procesamiento tardó demasiado tiempo, inténtalo de nuevo.');
        }
      }
    } catch (e: any) {
      toast.error(`Error de optimización: ${e.message}`);
      console.error(e);
    } finally {
      setProcessingVideo(null);
      setProcessingStatus(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-primary text-xs text-[#666666] uppercase tracking-wider">
          Vídeos (YouTube/Vimeo o archivos)
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]"
            placeholder="Pega aquí el enlace de YouTube o Vimeo..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrlVideo())}
          />
          <button 
            type="button" 
            onClick={addUrlVideo}
            className="flex items-center justify-center w-10 h-10 bg-[#C9A962]/10 border border-[#C9A962]/30 text-[#C9A962] hover:bg-[#C9A962]/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={videos.map(v => v.url)} strategy={verticalListSortingStrategy}>
            {videos.map((video) => (
              <SortableVideoItem 
                key={video.url} 
                video={video} 
                onRemove={(url) => onChange(videos.filter(v => v.url !== url))} 
                onTitleChange={handleTitleChange}
                duration={durations[video.url] || 0}
                processingVideo={processingVideo}
                processingStatus={processingStatus}
                onEnhance={(type) => handleEnhance(video.url, type)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-[#1F1F1F] hover:border-[#C9A962] cursor-pointer transition-colors bg-[#0A0A0A] rounded-sm mt-2">
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
              <span className="font-primary text-[10px] text-[#C9A962] uppercase tracking-widest font-bold">Subiendo Vídeo(s)...</span>
            </div>
          ) : (
            <>
              <Upload className="w-4 h-4 text-[#444444]" />
              <span className="font-primary text-[10px] text-[#444444] uppercase tracking-widest font-bold">Subir archivo de vídeo</span>
            </>
          )}
          <input type="file" accept="video/*" multiple className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      </div>
    </div>
  );
};
