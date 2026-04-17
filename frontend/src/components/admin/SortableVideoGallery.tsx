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
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Upload, X, Plus } from 'lucide-react';
import { useState } from 'react';

interface SortableVideoItemProps {
  url: string;
  onRemove: (url: string) => void;
}

const SortableVideoItem = ({ url, onRemove }: SortableVideoItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 1 : 0,
  };

  // Intentar obtener miniatura si es YouTube
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
      className="relative w-28 h-28 shrink-0 touch-none flex flex-col items-center justify-center border-2 border-[#1F1F1F] hover:border-[#444444] bg-[#0F0F0F] rounded-sm group overflow-hidden cursor-grab active:cursor-grabbing" 
      {...attributes} 
      {...listeners}
    >
      {thumbnail ? (
        <img src={thumbnail} alt="Video thumbnail" className="w-full h-full object-cover pointer-events-none opacity-50" />
      ) : (
        <Play className="w-8 h-8 text-[#444444] group-hover:text-[#C9A962] transition-colors" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors pointer-events-none">
        <Play className="w-6 h-6 text-white drop-shadow-lg" />
      </div>
      
      <button 
        type="button" 
        onClick={(e) => { e.stopPropagation(); onRemove(url); }} 
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 p-1 bg-red-500 rounded-sm text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="absolute bottom-0 left-0 w-full bg-black/60 px-1 py-0.5 pointer-events-none">
        <p className="text-[8px] text-[#FAF8F5] truncate font-primary">
          {url.split('/').pop()?.split('?')[0] || url}
        </p>
      </div>
    </div>
  );
};

interface SortableVideoGalleryProps {
  videos: string[];
  onChange: (videos: string[]) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export const SortableVideoGallery = ({ videos, onChange, onUpload, uploading }: SortableVideoGalleryProps) => {
  const [videoUrl, setVideoUrl] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = videos.indexOf(active.id as string);
      const newIndex = videos.indexOf(over.id as string);
      onChange(arrayMove(videos, oldIndex, newIndex));
    }
  };

  const addUrlVideo = () => {
    if (!videoUrl.trim()) return;
    onChange([...videos, videoUrl.trim()]);
    setVideoUrl('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-primary text-xs text-[#666666] uppercase tracking-wider">
          Vídeos (Añade enlaces de YouTube/Vimeo o sube archivos)
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
      
      <div className="flex flex-wrap gap-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={videos} strategy={rectSortingStrategy}>
            {videos.map((url) => (
              <SortableVideoItem 
                key={url} 
                url={url} 
                onRemove={(removedUrl) => onChange(videos.filter(u => u !== removedUrl))} 
              />
            ))}
          </SortableContext>
        </DndContext>

        <label className="flex flex-col items-center justify-center w-28 h-28 shrink-0 border-2 border-dashed border-[#1F1F1F] hover:border-[#C9A962] cursor-pointer transition-colors bg-[#0A0A0A]">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-[#444444] mb-1" />
              <span className="font-primary text-[10px] text-[#444444] text-center px-1">Subir Vídeo(s)</span>
            </>
          )}
          <input type="file" accept="video/*" multiple className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
      </div>
    </div>
  );
};
