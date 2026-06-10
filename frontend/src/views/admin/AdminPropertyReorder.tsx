import { useState, useEffect } from 'react';
import { sortPropertiesByAvailability } from '../../utils/propertySorting';
import {
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  closestCenter,
  DndContext,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
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
        index={index}
        title={property.title}
        title_en={property.title_en ?? undefined}
        price={property.price ?? 0}
        location={[property.zone, property.city].filter(Boolean).join(', ')}
        area={property.area_m2 ?? 0}
        bedrooms={property.bedrooms}
        bathrooms={property.bathrooms}
        operation={(property.operation || '').toUpperCase() as 'ALQUILER' | 'VENTA' | 'TRASPASO'}
        commercialStatus={property.commercial_status}
        isFeatured={property.is_featured}
        imageUrl={property.main_image || ''}
        linkTo={`/propiedades/${property.reference || property.slug || property.id}`}
        floor={property.floor}
        orientation={property.orientation}
        description={property.short_description || undefined}
        description_en={property.short_description_en || undefined}
        gallery={property.gallery}
        videoUrl={property.video_url}
        videos={property.videos}
        floorPlanUrl={property.floor_plan}
        id={property.id}
        reference={property.reference ?? undefined}
        property_type={property.property_type}
        is_room_rental={property.is_room_rental}
        rooms={property.rooms}
        common_areas={property.common_areas}
        createdAt={property.created_at}
        tags={property.tags}
        availability={property.availability ?? undefined}
        className="pointer-events-none" // Disable clicks during reordering
      />
    </div>
  );
};

export const AdminPropertyReorder = () => {
  const { properties, loading, refetch } = useProperties(undefined, true);
  const { updatePropertyOrder } = usePropertyMutations();
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (properties.length > 0) {
      setItems(sortPropertiesByAvailability(properties));
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
        
        const newItems = arrayMove(prevItems, oldIndex, newIndex);
        
        // Sincronizar el estado comercial si se mueve entre secciones
        const movedItem = { ...newItems[newIndex] };
        const targetSectionItem = prevItems[newIndex];
        
        if (movedItem.commercial_status !== targetSectionItem.commercial_status) {
          movedItem.commercial_status = targetSectionItem.commercial_status;
          newItems[newIndex] = movedItem;
          toast.success(`Estado de "${movedItem.title}" cambiado a ${movedItem.commercial_status}`);
        }
        
        return newItems;
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
        commercial_status: item.commercial_status,
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
    <div className="w-full bg-[#050505] min-h-screen -mt-8 -mx-8 px-8 pb-20 relative overflow-hidden">
      {/* Premium Mesh Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C9A962]/5 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#C9A962]/5 blur-[150px] rounded-full mix-blend-screen animation-delay-2000" />
      </div>

      {/* Header section matching Propiedades.tsx */}
      <section className="relative min-h-[25vh] flex items-center overflow-hidden border-b border-white/5 py-16 mb-12 -mx-8 px-8">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center brightness-[0.3] saturate-[1.25]"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/20 via-[#050505]/50 to-[#050505]/95" />
        </div>

        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <Link to="/admin/propiedades" className="p-2 bg-white/5 border border-white/10 rounded-full text-white/40 hover:text-[#C9A962] hover:border-[#C9A962] transition-all">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5]">
                Organizar Listado
              </h1>
            </div>
            <p className="font-primary text-[#DFDFE6]/40 text-sm uppercase tracking-[0.2em] font-bold">
              Simulador de orden real • Arrastra para reordenar
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0A0A0A]/80 backdrop-blur-xl p-4 border border-white/10 rounded-sm shadow-2xl">
            <button
              onClick={() => refetch()}
              className="p-3 text-[#888888] hover:text-[#FAF8F5] border border-white/5 hover:bg-white/5 transition-all rounded-sm"
              title="Refrescar datos"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={cn(
                "flex items-center gap-3 px-8 py-3 font-primary font-bold text-xs uppercase tracking-[0.2em] transition-all rounded-sm shadow-2xl",
                hasChanges 
                  ? "bg-[#C9A962] text-[#0A0A0A] hover:bg-[#D4B673] shadow-[#C9A962]/20" 
                  : "bg-white/5 text-[#444444] cursor-not-allowed border border-white/5"
              )}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Guardando...' : 'Publicar Nuevo Orden'}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1600px] mx-auto">
        {hasChanges && (
          <div className="mb-12 bg-[#C9A962]/5 border border-[#C9A962]/20 p-6 flex items-center justify-between animate-fade-in rounded-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#C9A962]/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(201,169,98,0.2)]">
                <LayoutGrid className="w-5 h-5 text-[#C9A962]" />
              </div>
              <div>
                <p className="font-primary text-sm text-[#C9A962] font-bold uppercase tracking-wider mb-0.5">
                  Cambios Pendientes
                </p>
                <p className="font-primary text-[#C9A962]/60 text-xs uppercase tracking-widest">
                  Haz clic en "Publicar Nuevo Orden" para aplicar los cambios en la web pública.
                </p>
              </div>
            </div>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((property, idx) => (
                <SortableProperty key={property.id} property={property} index={idx} />
              ))}
            </div>
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
