import { motion, type HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { OPERATION_LABELS, type PropertyOperation, type CommercialStatus, COMMERCIAL_STATUS_LABELS, type PropertyType } from '../types/property';
import { ChevronLeft, ChevronRight, Heart, GitCompare } from 'lucide-react';
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
  ...props
}: PropertyCardProps) => {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { translatedText: autoTitle } = useAutoTranslate(title, title_en);
  const displayTitle = autoTitle;

  // Combine main image with gallery
  const images = useMemo(() => 
    [imageUrl, ...(gallery || [])].filter((img): img is string => !!img),
    [imageUrl, gallery]
  );

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
        "group relative overflow-hidden bg-[#0A0A0A] border border-white/5 transition-all duration-700 rounded-2xl h-full",
        className
      )}
      {...props}
    >
      <Link to={linkTo || `/propiedades/${reference || id}`} className="block relative aspect-[16/10] md:aspect-[16/10] overflow-hidden h-full">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent opacity-80 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Floating Price - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <motion.div className="flex flex-col items-end">
            <span className="font-secondary text-2xl text-[#C9A962] drop-shadow-2xl">
              {formattedPrice}
            </span>
            {operation === 'ALQUILER' && (
              <span className="font-primary text-[10px] uppercase tracking-[0.3em] text-[#FAF8F5]/60 mt-1">
                / {t('property.labels.month')}
              </span>
            )}
          </motion.div>
        </div>

        {/* Top Left Badges */}
        <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <div className="bg-[#C9A962] text-[#0A0A0A] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-2xl w-fit">
              {operation.toLowerCase() === 'alquiler' && is_room_rental
                ? t('property.labels.features.room_rental') 
                : t(OPERATION_LABELS[operation.toLowerCase() as PropertyOperation] || operation)}
            </div>
            {isFeatured && (
              <div className="bg-white/10 backdrop-blur-md text-[#C9A962] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] border border-[#C9A962]/20 rounded-sm w-fit">
                ★ {t('property.labels.featured')}
              </div>
            )}
          </div>
        </div>

        {/* Slider Controls - Hidden by default, visible on hover */}
        {images.length > 1 && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between px-4 z-30 pointer-events-none">
            <button 
              onClick={prevImage}
              className="p-2 rounded-full glass-deep text-white hover:bg-[#C9A962] transition-colors pointer-events-auto border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextImage}
              className="p-2 rounded-full glass-deep text-white hover:bg-[#C9A962] transition-colors pointer-events-auto border border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Info - Bottom Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col gap-3">
          {/* Commercial Status Badge */}
          {commercialStatus && commercialStatus !== 'disponible' && (
            <div className="w-fit">
              <span className={cn(
                "px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] border shadow-2xl backdrop-blur-md",
                commercialStatus === 'reservado' && "bg-orange-500/20 text-orange-400 border-orange-500/30",
                commercialStatus === 'alquilado' && "bg-purple-500/20 text-purple-400 border-purple-400/30",
                commercialStatus === 'vendido' && "bg-red-500/20 text-red-400 border-red-500/30",
                commercialStatus === 'traspasado' && "bg-blue-500/20 text-blue-400 border-blue-500/30",
              )}>
                {t(COMMERCIAL_STATUS_LABELS[commercialStatus])}
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <span className="font-primary text-[10px] uppercase tracking-[0.3em] text-[#FAF8F5]">
                {location}
              </span>
            </div>
            <h3 className="font-secondary text-xl md:text-2xl text-[#FAF8F5] leading-tight group-hover:text-[#C9A962] transition-colors duration-500 line-clamp-1">
              {displayTitle}
            </h3>
          </div>

          {/* Technical Specs - Reveal on Hover */}
          <div className="flex items-center gap-6 h-0 opacity-0 translate-y-2 group-hover:h-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-primary text-xs font-bold text-[#FAF8F5]">{area}</span>
              <span className="font-primary text-[10px] uppercase tracking-wider text-[#FAF8F5]/60">m²</span>
            </div>
            {bedrooms > 0 && (
              <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                <span className="font-primary text-xs font-bold text-[#FAF8F5]">{bedrooms}</span>
                <span className="font-primary text-[10px] uppercase tracking-wider text-[#FAF8F5]/60">{t('property.details.bedrooms_short')}</span>
              </div>
            )}
            {bathrooms > 0 && (
              <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                <span className="font-primary text-xs font-bold text-[#FAF8F5]">{bathrooms}</span>
                <span className="font-primary text-[10px] uppercase tracking-wider text-[#FAF8F5]/60">{t('property.details.bathrooms_short')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Favorite & Compare Quick Actions */}
        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
          {onToggleCompare && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleCompare(e); }}
              className={cn(
                "p-2 rounded-full glass-deep border transition-all duration-300",
                isInCompare ? "bg-[#C9A962] border-[#C9A962] text-[#0A0A0A]" : "border-white/10 text-white hover:bg-[#C9A962]/20"
              )}
            >
              <GitCompare className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite?.(e); }}
            className={cn(
              "p-2 rounded-full glass-deep border transition-all duration-300",
              isFavorite ? "bg-[#C9A962] border-[#C9A962] text-[#0A0A0A]" : "border-white/10 text-white hover:bg-[#C9A962]/20"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          </button>
        </div>
      </Link>
    </motion.div>
  );

  return card;
});

PropertyCard.displayName = 'PropertyCard';
