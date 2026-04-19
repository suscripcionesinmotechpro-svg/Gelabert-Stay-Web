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
import { Upload, X } from 'lucide-react';

interface SortableImageItemProps {
  url: string;
  isMain: boolean;
  onRemove: (url: string) => void;
}

const SortableImageItem = ({ url, isMain, onRemove }: SortableImageItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 1 : 0,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative w-28 h-28 shrink-0 touch-none flex flex-col items-center justify-center border-2 ${isMain ? 'border-[#C9A962]' : 'border-[#1F1F1F] hover:border-[#444444]'} bg-[#0F0F0F] rounded-sm group overflow-hidden cursor-grab active:cursor-grabbing`} 
      {...attributes} 
      {...listeners}
    >
      <img src={url} alt="Propiedad" className="w-full h-full object-cover pointer-events-none" />
      {isMain && (
        <div className="absolute top-0 left-0 w-full bg-[#C9A962]/90 text-black text-[10px] uppercase text-center font-bold py-0.5 pointer-events-none">
          Portada
        </div>
      )}
      <button 
        type="button" 
        onClick={(e) => { e.stopPropagation(); onRemove(url); }} 
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 p-1 bg-red-500 rounded-sm text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

interface SortableImageGalleryProps {
  images: string[];
  onChange: (images: string[]) => void;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
}

export const SortableImageGallery = ({ images, onChange, onUpload, uploading }: SortableImageGalleryProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="font-primary text-xs text-[#666666] uppercase tracking-wider">
          Imágenes (Arrastra para reordenar, la primera será la portada)
        </label>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={rectSortingStrategy}>
            {images.map((url, index) => (
              <SortableImageItem 
                key={url} 
                url={url} 
                isMain={index === 0} 
                onRemove={(removedUrl) => onChange(images.filter(u => u !== removedUrl))} 
              />
            ))}
          </SortableContext>
        </DndContext>

        {onUpload && (
          <label className="flex flex-col items-center justify-center w-28 h-28 shrink-0 border-2 border-dashed border-[#1F1F1F] hover:border-[#C9A962] cursor-pointer transition-colors bg-[#0A0A0A]">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-[#444444] mb-1" />
                <span className="font-primary text-[10px] text-[#444444] text-center px-1">Subir Foto(s)</span>
              </>
            )}
            <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
};
