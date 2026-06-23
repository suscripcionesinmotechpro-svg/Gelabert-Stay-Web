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
import { Play, Upload, X, Plus, Download, Sparkles, Loader2, GripVertical, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { PropertyVideo } from '../../types/property';
import { getVideoDuration, estimateVideoCost } from '../../utils/video';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth.tsx';

interface SortableVideoItemProps {
  video: PropertyVideo;
  onRemove: (url: string) => void;
  onTitleChange: (url: string, title: string) => void;
  duration: number;
  processingVideo: string | null;
  processingStatus: string | null;
  onEnhance: () => void;
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
  const [showMenu, setShowMenu] = useState(false);
  
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

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const isCurrentlyProcessing = processingVideo === url || video.processing;
  const currentStatusText = processingVideo === url && processingStatus 
    ? processingStatus 
    : 'Optimizando en la nube (segundo plano)...';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex gap-4 p-4 bg-[#070707] border border-[#1F1F1F] rounded-sm group relative animate-fadeIn"
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
          <div className="flex flex-col gap-2 mt-1.5 border-t border-[#111] pt-1.5">
            <div className="flex flex-wrap items-center gap-3">
              {(duration > 0 || video.duration > 0) && (
                <span className="font-primary text-[10px] text-[#666] select-none">
                  Duración: {Math.floor((duration || video.duration || 0) / 60)}m {Math.round((duration || video.duration || 0) % 60)}s
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

              {isCurrentlyProcessing ? (
                <div className="flex items-center gap-3 select-none">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#C9A962] font-primary uppercase tracking-wider font-bold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {currentStatusText}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('¿Estás seguro de que quieres cancelar y reiniciar el estado de esta optimización?')) {
                        try {
                          const updatedVideos = videos.map(v => v.url === url ? {
                            ...v,
                            processing: false,
                            jobId: undefined,
                            provider: undefined,
                            enhanceType: undefined
                          } : v);
                          onChange(updatedVideos);
                          if (propertyId) {
                            await supabase
                              .from('properties')
                              .update({ videos_metadata: updatedVideos })
                              .eq('id', propertyId);
                          }
                          toast.success('Optimización cancelada.');
                        } catch (err: any) {
                          toast.error(`Error al cancelar: ${err.message}`);
                        }
                      }
                    }}
                    className="text-[9px] font-bold uppercase tracking-wider text-red-400 hover:text-red-500 transition-colors border border-red-500/20 hover:border-red-500/50 px-1.5 py-0.5 rounded-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Optimizar este vídeo con IA Premium? El proceso puede tardar entre 10 y 30 minutos dependiendo de la duración del vídeo. Continuará en segundo plano.')) {
                        onEnhance();
                      }
                    }}
                    className="flex items-center gap-1 text-[10px] text-[#C9A962] hover:underline font-primary uppercase tracking-wider font-bold transition-all"
                  >
                    <Sparkles className="w-3 h-3" /> Optimizar con IA Premium
                  </button>
                  {costs.premium && (
                    <span className="font-primary text-[9px] text-[#555] ml-1">• {costs.premium}</span>
                  )}
                </div>
              )}
            </div>

            {/* Check de Optimización y Detalles */}
            {video.optimized && !video.processing && (
              <div className="mt-1 p-2.5 bg-green-950/20 border border-green-500/30 rounded-sm flex flex-col gap-1.5 select-none animate-fadeIn">
                <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  Vídeo Optimizado con IA
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-primary text-[#888]">
                  <div>
                    <span className="text-[#555] font-bold uppercase tracking-tight">Método:</span>{' '}
                    <span className="text-[#FAF8F5]">{video.method}</span>
                  </div>
                  <div>
                    <span className="text-[#555] font-bold uppercase tracking-tight">Coste cobrado:</span>{' '}
                    <span className="text-[#FAF8F5]">{video.cost}</span>
                  </div>
                </div>
                {video.log && (
                  <div className="text-[9px] font-primary text-[#777] leading-relaxed border-t border-[#1F1F1F] pt-1.5">
                    <span className="text-[#555] font-bold uppercase tracking-tight block mb-0.5">Proceso de optimización:</span>
                    {video.log}
                  </div>
                )}
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
  propertyId?: string;
  propertyName?: string;
}

export const SortableVideoGallery = ({ 
  videos, 
  onChange, 
  onUpload, 
  uploading,
  propertyId,
  propertyName
}: SortableVideoGalleryProps) => {
  const { user } = useAuth();
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

  // NOTE: Polling is handled globally by useGlobalVideoPolling hook (in AdminLayout / AgentLayout).
  // No local polling here to avoid race conditions.

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

  const handleEnhance = async (url: string) => {
    const video = videos.find(v => v.url === url);
    if (!video) return;
    const title = video.title;

    setProcessingVideo(url);
    setProcessingStatus('Enviando a servidor premium...');

    try {
      const videoIdx = videos.findIndex(v => v.url === url);

      const response = await fetch('/api/enhance-video-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: url,
          filename: url.split('/property-images/')[1],
          propertyId,
          videoType: 'gallery',
          videoIdx: videoIdx >= 0 ? videoIdx : undefined,
          userId: user?.id
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al iniciar la mejora premium');
      }

      const data = await response.json();

      // Mark video as processing in local state and persist to DB
      const updatedVideos = videos.map(v => v.url === url ? {
        ...v,
        processing: true,
        jobId: data.id,
        provider: data.provider,
        enhanceType: 'premium' as const
      } : v);

      onChange(updatedVideos);
      if (propertyId) {
        await supabase
          .from('properties')
          .update({ videos_metadata: updatedVideos })
          .eq('id', propertyId);
      }
      toast.success('Vídeo enviado a optimizar con IA Premium. Se procesará en segundo plano.');

      // Notification
      if (user) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: '🎥 Optimizando vídeo con IA Premium',
          message: `La optimización para el vídeo "${title}" de la propiedad "${propertyName || 'Propiedad'}" ha comenzado en la nube.`,
          type: 'video_enhance',
          is_read: false,
          action_url: propertyId ? `/admin/propiedades/${propertyId}` : undefined,
          related_id: propertyId,
          related_type: 'property'
        });
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
    <div className="flex flex-col gap-4 animate-fadeIn">
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
                onEnhance={() => handleEnhance(video.url)}
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
