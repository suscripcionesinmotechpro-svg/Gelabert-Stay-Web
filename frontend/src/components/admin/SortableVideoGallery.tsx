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
  const [showMenu, setShowMenu] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'basic' | 'premium' | null>(null);
  
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
    if (!showMenu) {
      setSelectedOption(null); // Reset when opening
    }
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
                <div className="flex items-center gap-1.5 text-[10px] text-[#C9A962] font-primary uppercase tracking-wider font-bold animate-pulse select-none">
                  <Loader2 className="w-3 h-3 animate-spin" /> {currentStatusText}
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleMenu}
                    className="flex items-center gap-1 text-[10px] text-[#C9A962] hover:underline font-primary uppercase tracking-wider font-bold transition-all"
                  >
                    <Sparkles className="w-3 h-3" /> Optimizar con IA
                  </button>
                  
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                      <div className="absolute left-0 bottom-full mb-2 bg-[#0A0A0A] border border-[#1F1F1F] p-3 flex flex-col gap-2 w-66 z-20 shadow-xl rounded-sm">
                        <p className="font-primary text-[9px] uppercase tracking-wider text-[#555] font-bold px-1 select-none">
                          Seleccionar Tipo de Mejora
                        </p>
                        
                        <button
                          type="button"
                          onClick={() => setSelectedOption('basic')}
                          className={`w-full text-left p-2 transition-all flex flex-col rounded-sm border ${
                            selectedOption === 'basic'
                              ? 'border-[#C9A962] bg-[#C9A962]/10'
                              : 'border-[#1F1F1F] hover:bg-[#1A1A1A] bg-transparent'
                          }`}
                        >
                          <span className="font-primary text-[10px] text-[#FAF8F5] font-bold">A. Ajuste de Luz (Nube)</span>
                          <span className="font-primary text-[9px] text-[#666]">Iluminación, color y exposición • Coste: {costs.basic}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOption('premium')}
                          className={`w-full text-left p-2 transition-all flex flex-col rounded-sm border ${
                            selectedOption === 'premium'
                              ? 'border-[#C9A962] bg-[#C9A962]/10'
                              : 'border-[#1F1F1F] hover:bg-[#1A1A1A] bg-transparent'
                          }`}
                        >
                          <span className="font-primary text-[10px] text-[#C9A962] font-bold">B. Ajuste Ultra Premium (IA)</span>
                          <span className="font-primary text-[9px] text-[#666]">Estabilizado, nitidez y reducción de ruido • Coste: {costs.premium}</span>
                        </button>


                        <button
                          type="button"
                          disabled={!selectedOption}
                          onClick={() => {
                            if (selectedOption) {
                              setShowMenu(false);
                              onEnhance(selectedOption);
                              setSelectedOption(null);
                            }
                          }}
                          className={`w-full py-1.5 mt-1 text-center font-primary text-[10px] uppercase tracking-wider font-bold rounded-sm transition-all ${
                            selectedOption
                              ? 'bg-[#C9A962] text-black hover:bg-[#FAF8F5] cursor-pointer'
                              : 'bg-[#151515] text-[#444] cursor-not-allowed border border-[#1F1F1F]'
                          }`}
                        >
                          Comenzar Optimización
                        </button>
                      </div>
                    </>
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

  // Background Polling Effect to check state of asynchronous video optimizations
  useEffect(() => {
    const processingList = videos.filter(v => v.processing && v.jobId);
    if (processingList.length === 0) return;

    let active = true;
    const interval = setInterval(async () => {
      if (!active) return;

      for (const video of processingList) {
        try {
          const endpoint = video.enhanceType === 'basic' ? '/api/enhance-video-basic' : '/api/enhance-video-premium';
          const checkRes = await fetch(`${endpoint}?id=${video.jobId}&provider=${video.provider}&filename=${video.url.split('/property-images/')[1]}`);
          if (!checkRes.ok) continue;

          const checkData = await checkRes.json();
          if (checkData.status === 'succeeded') {
            const itemDuration = durations[video.url] || video.duration || 0;
            const costs = estimateVideoCost(itemDuration);
            const finalCost = video.enhanceType === 'basic' ? costs.basic : costs.premium;
            const method = video.enhanceType === 'basic' ? 'Ajuste de Luz (Gemini)' : 'Ajuste Ultra Premium (IA)';
            const log = video.enhanceType === 'basic'
              ? 'El vídeo original se procesó en la nube con TensorPix para aplicar correcciones rápidas de luz y balance de blancos. El archivo de vídeo original fue reemplazado por la versión corregida.'
              : 'El vídeo original se envió al servicio de procesamiento en la nube con redes neuronales convolucionales. Se aplicó un proceso de estabilización digital de movimiento de cámara, reducción de ruido temporal e interpolación espacial para aumentar nitidez de bordes. El archivo original fue reemplazado por la versión premium.';

            const updatedVideos = videos.map(v => v.url === video.url ? {
              ...v,
              url: checkData.enhancedUrl,
              optimized: true,
              processing: false,
              jobId: undefined,
              provider: undefined,
              enhanceType: undefined,
              cost: finalCost,
              method,
              log,
              duration: itemDuration
            } : v);

            onChange(updatedVideos);
            toast.success(`Vídeo "${video.title}" optimizado con éxito`);

            // Insert system success notification
            if (user) {
              await supabase.from('notifications').insert({
                user_id: user.id,
                title: '✅ Vídeo optimizado con éxito',
                message: `El vídeo "${video.title}" de la propiedad "${propertyName || 'Propiedad'}" ha terminado de optimizarse.`,
                type: 'video_enhance_success',
                is_read: false,
                action_url: propertyId ? `/admin/propiedades/${propertyId}` : undefined,
                related_id: propertyId,
                related_type: 'property'
              });
            }
          } else if (checkData.status === 'failed') {
            const updatedVideos = videos.map(v => v.url === video.url ? {
              ...v,
              processing: false,
              jobId: undefined,
              provider: undefined,
              enhanceType: undefined
            } : v);
            onChange(updatedVideos);
            toast.error(`La optimización del vídeo "${video.title}" ha fallado`);

            // Insert system failure notification
            if (user) {
              await supabase.from('notifications').insert({
                user_id: user.id,
                title: '❌ Error de optimización',
                message: `La optimización del vídeo "${video.title}" de la propiedad "${propertyName || 'Propiedad'}" ha fallado.`,
                type: 'video_enhance_failed',
                is_read: false,
                action_url: propertyId ? `/admin/propiedades/${propertyId}` : undefined,
                related_id: propertyId,
                related_type: 'property'
              });
            }
          }
        } catch (err) {
          console.error('[Background Poll Error]:', err);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [videos, durations, user, propertyId, propertyName]);

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
    setProcessingStatus(type === 'basic' ? 'Iniciando Ajuste de Luz...' : 'Enviando a servidor premium...');

    try {
      const itemDuration = durations[url] || video.duration || 0;
      const apiPath = type === 'basic' ? '/api/enhance-video-basic' : '/api/enhance-video-premium';

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url, filename: url.split('/property-images/')[1] })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed to start ${type} enhance`);
      }

      const data = await response.json();
      
      // Update metadata with processing details and save to database immediately
      const updatedVideos = videos.map(v => v.url === url ? {
        ...v,
        processing: true,
        jobId: data.id,
        provider: data.provider,
        enhanceType: type
      } : v);
      
      onChange(updatedVideos);
      if (propertyId) {
        await supabase
          .from('properties')
          .update({ videos_metadata: updatedVideos })
          .eq('id', propertyId);
      }
      toast.success('Vídeo enviado a optimizar. Se procesará en segundo plano.');

      // Insert system notification about started process
      if (user) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: `🎥 Optimizando vídeo (Opción ${type === 'basic' ? 'A' : 'B'})`,
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
