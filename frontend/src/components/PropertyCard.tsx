import { motion, type HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { type CommercialStatus, COMMERCIAL_STATUS_LABELS, type PropertyType } from '../types/property';
import { ChevronLeft, ChevronRight, Heart, GitCompare, Maximize2, BedDouble, Bath, Camera, Video, Map } from 'lucide-react';
import { useState, useMemo, memo } from 'react';
import { PremiumImage } from './PremiumImage';
import { getOptimizedImage } from '../utils/images';

export interface PropertyCardProps extends HTMLMotionProps<"div"> {
  title: string;
  title_en?: string | null;
  price: number;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  operation: 'ALQUILER' | 'VENTA' | 'TRASPASO';
  commercialStatus?: CommercialStatus;
  isFeatured?: boolean;
  imageUrl?: string;
  linkTo?: string;
  onClick?: () => void;
  description?: string;
  description_en?: string | null;
  track_id?: string | null;
  gallery?: string[] | null;
  floor?: string | number | null;
  orientation?: string[] | null;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  isInCompare?: boolean;
  onToggleCompare?: (e: React.MouseEvent) => void;
  id?: string;
  reference?: string;
  createdAt?: string | null;
  onTagClick?: (tag: string) => void;
  tags?: string[] | null;
  index?: number;
  videoUrl?: string | null;
  videos?: string[] | null;
  floorPlanUrl?: string | null;
  property_type?: PropertyType | null;
  is_room_rental?: boolean;
  rooms?: any[] | null;
  common_areas?: any[] | null;
}

export const PropertyCard = memo(({
  title,
  title_en,
  price,
  location,
  area,
  bedrooms,
  bathrooms,
  operation,
  commercialStatus,
  isFeatured,
  imageUrl,
  linkTo,
  onClick,
  className,
  description: _description,
  description_en: _description_en,
  gallery,
  floor,
  orientation,
  isFavorite,
  onToggleFavorite,
  isInCompare,
  onToggleCompare,
  id,
  reference,
  createdAt,
  onTagClick,
  tags,
  index,
  videoUrl,
  videos,
  floorPlanUrl,
  property_type,
  is_room_rental,
  rooms,
  common_areas,
  ...props
}: PropertyCardProps) => {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { translatedText: autoTitle } = useAutoTranslate(title, title_en);
  const displayTitle = autoTitle;

  // Combine main image with gallery
  const images = useMemo(() => {
    let list = [imageUrl];
    
    // Add gallery images (these are usually common areas in room rentals)
    if (gallery && gallery.length > 0) {
      list.push(...gallery);
    }

    // For room rental properties (is_room_rental: true)
    if (is_room_rental && rooms && rooms.length > 0) {
      rooms.forEach(room => {
        if (room.images && room.images.length > 0) {
          list.push(...room.images);
        }
      });
    }

    // For individual room properties (property_type: 'habitacion')
    if (property_type === 'habitacion' && common_areas && common_areas.length > 0) {
      const caImages = common_areas.flatMap(area => area.images || []);
      if (caImages.length > 0) {
        // First room photos (already in list), then common areas
        list = [...list, ...caImages];
      }
    }

    return Array.from(new Set(list.filter((img): img is string => !!img)));
  }, [imageUrl, gallery, is_room_rental, rooms, property_type, common_areas]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formattedPrice = useMemo(() => 
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price),
    [price]
  );

  const card = (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1], 
        delay: index !== undefined ? Math.min(index % 8, 8) * 0.1 : 0.05 
      }}
      className={cn(
        "group relative flex flex-col bg-[#0A0A0A] border border-white/5 transition-all duration-700 rounded-2xl overflow-hidden hover:border-[#C9A962]/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
        className
      )}
      {...props}
    >
      <Link to={linkTo || `/propiedades/${reference || id}`} className="block flex-1 flex flex-col">
        {/* Top Section: Image Area */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {/* Main Image Slider Container */}
          <AnimatePresence initial={false}>
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <PremiumImage
                src={getOptimizedImage(images[currentImageIndex], { width: 1200, height: 800, quality: 100, format: 'webp' })} 
                alt={title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                wrapperClassName="w-full h-full"
              />
            </motion.div>
          </AnimatePresence>

          {/* Dynamic Vignette Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 via-transparent to-transparent opacity-60" />
          
          {/* Top Left: Operation Badge */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="bg-[#C9A962] text-[#0A0A0A] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-xl">
              {operation.toLowerCase() === 'alquiler' && is_room_rental
                ? t('property.labels.features.room_rental') 
                : `${t(`property.labels.operation.${operation.toLowerCase()}`)} ${property_type ? t(`property.labels.type.${property_type}`) : ''}`}
            </div>
            {isFeatured && (
              <div className="bg-white/10 backdrop-blur-md text-[#C9A962] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] border border-[#C9A962]/20 rounded-sm">
                ★ {t('property.labels.featured')}
              </div>
            )}
          </div>

          {commercialStatus && (
            <motion.div 
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              className="absolute top-4 right-0 z-50 pointer-events-none"
            >
              <span className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(0,0,0,0.4)] rounded-l-md border-y border-l-2 backdrop-blur-xl inline-block",
                commercialStatus === 'disponible' && "bg-[#25D366] text-black border-[#2CEB73]",
                commercialStatus === 'reservado' && "bg-orange-500 text-white border-orange-300",
                commercialStatus === 'alquilado' && "bg-purple-600 text-white border-purple-300",
                commercialStatus === 'vendido' && "bg-red-600 text-white border-red-300",
                commercialStatus === 'traspasado' && "bg-blue-600 text-white border-blue-300",
              )}>
                {t(COMMERCIAL_STATUS_LABELS[commercialStatus])}
              </span>
            </motion.div>
          )}

          {/* Slider Controls - Always visible on mobile, hover on desktop */}
          {images.length > 1 && (
            <div className="absolute inset-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between px-3 z-30 pointer-events-none">
              <button 
                onClick={prevImage}
                className="p-1.5 sm:p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-[#C9A962] transition-colors pointer-events-auto border border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={nextImage}
                className="p-1.5 sm:p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-[#C9A962] transition-colors pointer-events-auto border border-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Media Indicators */}
          <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 transition-opacity duration-300">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-black/50 backdrop-blur-md text-white text-[10px] font-primary font-medium tracking-wider border border-white/10">
              <Camera className="w-3 h-3" />
              <span>{currentImageIndex + 1} / {images.length}</span>
            </div>
            {(videoUrl || (videos && videos.length > 0)) && (
              <div className="flex items-center justify-center w-6 h-6 rounded-sm bg-black/50 backdrop-blur-md text-white border border-white/10" title={t('property.labels.features.video', 'Vídeo')}>
                <Video className="w-3 h-3" />
              </div>
            )}
            {floorPlanUrl && (
              <div className="flex items-center justify-center w-6 h-6 rounded-sm bg-black/50 backdrop-blur-md text-white border border-white/10" title={t('property.labels.features.floorplan', 'Plano')}>
                <Map className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Favorite & Compare - Always visible on mobile, hover on desktop */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 opacity-100 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-500">
            {onToggleCompare && (
              <button
                onClick={(e) => { e.preventDefault(); onToggleCompare(e); }}
                className={cn(
                  "p-2 rounded-full bg-black/40 backdrop-blur-md border transition-all duration-300",
                  isInCompare ? "bg-[#C9A962] border-[#C9A962] text-[#0A0A0A]" : "border-white/10 text-white hover:bg-[#C9A962]/20"
                )}
              >
                <GitCompare className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => { e.preventDefault(); onToggleFavorite?.(e); }}
              className={cn(
                "p-2 rounded-full bg-black/40 backdrop-blur-md border transition-all duration-300",
                isFavorite ? "bg-[#C9A962] border-[#C9A962] text-[#0A0A0A]" : "border-white/10 text-white hover:bg-[#C9A962]/20"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
            </button>
          </div>
        </div>

        {/* Bottom Section: Content Area */}
        <div className="p-6 flex flex-col gap-4 bg-gradient-to-b from-white/[0.02] to-transparent">
          {/* Price & Location Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-primary text-[10px] uppercase tracking-[0.2em] text-[#C9A962]/80 font-bold">
                {location}
              </span>
              <h3 className="font-secondary text-xl text-[#FAF8F5] leading-tight group-hover:text-[#C9A962] transition-colors duration-500">
                {displayTitle}
              </h3>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-secondary text-2xl text-[#C9A962] leading-none">
                {formattedPrice}
              </span>
              {operation === 'ALQUILER' && (
                <span className="font-primary text-[8px] uppercase tracking-widest text-white/40 mt-1">
                  / {t('property.labels.features.month')}
                </span>
              )}
            </div>
          </div>

          {/* Technical Specs - Permanent Visibility */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-[#C9A962]/60" />
              <span className="font-primary text-xs text-white/80">{area} m²</span>
            </div>
            {bedrooms > 0 && (
              <div className="flex items-center gap-2">
                <BedDouble className="w-3.5 h-3.5 text-[#C9A962]/60" />
                <span className="font-primary text-xs text-white/80">{bedrooms} {t('property.labels.features.bedrooms_short')}</span>
              </div>
            )}
            {bathrooms > 0 && (
              <div className="flex items-center gap-2">
                <Bath className="w-3.5 h-3.5 text-[#C9A962]/60" />
                <span className="font-primary text-xs text-white/80">{bathrooms} {t('property.labels.features.bathrooms_short')}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );

  return card;
});

PropertyCard.displayName = 'PropertyCard';
