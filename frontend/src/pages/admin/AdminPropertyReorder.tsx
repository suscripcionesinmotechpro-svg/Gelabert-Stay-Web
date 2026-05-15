import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProperties, usePropertyMutations } from '../../hooks/useProperties';
import { PropertyCard } from '../../components/PropertyCard';
import { Save, RefreshCw, LayoutGrid, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface SortableItemProps {
  property: any;
  index: number;
}

const SortableProperty = ({ property, index }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <PropertyCard
        {...property}
        imageUrl={property.main_image}
        index={index}
        className="pointer-events-none" // Disable clicks during reordering
      />
    </div>
  );
};

export const AdminPropertyReorder = () => {
  const { properties, loading, refetch } = useProperties({ limit: 100 }, true);
  const { updatePropertyOrder } = usePropertyMutations();
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (properties.length > 0) {
      setItems(properties);
    }
  }, [properties]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags when clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over.id);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const orderMap = items.map((item, index) => ({
        id: item.id,
        order_index: index,
      }));
      await updatePropertyOrder(orderMap);
      toast.success('Orden de propiedades actualizado correctamente');
      setHasChanges(false);
      refetch();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Error al guardar el nuevo orden');
    } finally {
      setSaving(false);
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40 bg-[#0F0F0F]/80 backdrop-blur-md py-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin/propiedades" className="text-[#666666] hover:text-[#C9A962] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-secondary text-2xl text-[#FAF8F5]">Organizar Listado</h1>
          </div>
          <p className="font-primary text-[#666666] text-xs uppercase tracking-widest">
            Simulador en tiempo real: Arrastra para reordenar las propiedades
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 text-[#888888] hover:text-[#FAF8F5] border border-white/5 hover:bg-white/5 transition-all rounded-sm"
            title="Refrescar datos"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 font-primary font-bold text-sm uppercase tracking-[0.2em] transition-all rounded-sm shadow-xl",
              hasChanges 
                ? "bg-[#C9A962] text-[#0A0A0A] hover:bg-[#D4B673] animate-glow-pulse" 
                : "bg-white/5 text-[#444444] cursor-not-allowed border border-white/5"
            )}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Guardando...' : 'Publicar Orden'}
          </button>
        </div>
      </div>

      {/* Info Alert */}
      {hasChanges && (
        <div className="bg-[#C9A962]/10 border border-[#C9A962]/20 p-4 flex items-center gap-3 animate-fade-in">
          <LayoutGrid className="w-5 h-5 text-[#C9A962]" />
          <p className="font-primary text-xs text-[#C9A962] font-bold uppercase tracking-wider">
            Tienes cambios sin publicar. Haz clic en "Publicar Orden" para que se vean en la web.
          </p>
        </div>
      )}

      {/* Sortable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
            {items.map((property, idx) => (
              <SortableProperty key={property.id} property={property} index={idx} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

// Re-using cn utility from parent if not imported
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
