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
import { Upload, X, Plus, FileText } from 'lucide-react';
import { useState } from 'react';

interface SortableFloorPlanItemProps {
  url: string;
  isMain: boolean;
  onRemove: (url: string) => void;
}

const SortableFloorPlanItem = ({ url, isMain, onRemove }: SortableFloorPlanItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 1 : 0,
  };

  const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative w-28 h-28 shrink-0 touch-none flex flex-col items-center justify-center border-2 ${isMain ? 'border-[#C9A962]' : 'border-[#1F1F1F] hover:border-[#444444]'} bg-[#0F0F0F] rounded-sm group overflow-hidden cursor-grab active:cursor-grabbing`} 
      {...attributes} 
      {...listeners}
    >
      {isPdf ? (
        <div className="flex flex-col items-center gap-1 text-[#C9A962] p-2">
          <FileText className="w-8 h-8" />
          <span className="text-[9px] uppercase tracking-wider font-bold truncate max-w-[80px]">PDF Plano</span>
        </div>
      ) : (
        <img src={url} alt="Plano" className="w-full h-full object-cover pointer-events-none" />
      )}
      {isMain && (
        <div className="absolute top-0 left-0 w-full bg-[#C9A962]/90 text-black text-[10px] uppercase text-center font-bold py-0.5 pointer-events-none">
          Principal
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

interface SortableFloorPlansGalleryProps {
  plans: string[];
  onChange: (plans: string[]) => void;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
}

export const SortableFloorPlansGallery = ({ plans, onChange, onUpload, uploading }: SortableFloorPlansGalleryProps) => {
  const [urlInput, setUrlInput] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = plans.indexOf(active.id as string);
      const newIndex = plans.indexOf(over.id as string);
      onChange(arrayMove(plans, oldIndex, newIndex));
    }
  };

  const addUrlPlan = () => {
    if (!urlInput.trim()) return;
    onChange([...plans, urlInput.trim()]);
    setUrlInput('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-primary text-xs text-[#666666] uppercase tracking-wider">
          Enlace externo de plano
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]"
            placeholder="Pega aquí la URL de un plano externo (imagen o PDF)..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrlPlan())}
          />
          <button 
            type="button" 
            onClick={addUrlPlan}
            className="flex items-center justify-center w-10 h-10 bg-[#C9A962]/10 border border-[#C9A962]/30 text-[#C9A962] hover:bg-[#C9A962]/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={plans} strategy={rectSortingStrategy}>
            {plans.map((url, index) => (
              <SortableFloorPlanItem 
                key={url} 
                url={url} 
                isMain={index === 0} 
                onRemove={(removedUrl) => onChange(plans.filter(u => u !== removedUrl))} 
              />
            ))}
          </SortableContext>
        </DndContext>

        {onUpload && (
          <label className="flex flex-col items-center justify-center w-28 h-28 shrink-0 border-2 border-dashed border-[#1F1F1F] hover:border-[#C9A962] cursor-pointer transition-colors bg-[#0A0A0A] rounded-sm">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-[#444444] mb-1" />
                <span className="font-primary text-[10px] text-[#444444] text-center px-1 uppercase tracking-widest font-bold">Subir plano(s)</span>
              </>
            )}
            <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        )}
      </div>
    </div>
  );
};
