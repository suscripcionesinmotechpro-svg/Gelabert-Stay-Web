import { motion, type HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { OPERATION_LABELS, type PropertyOperation, type CommercialStatus, COMMERCIAL_STATUS_LABELS } from '../types/property';
import { ChevronLeft, ChevronRight, MessageSquare, Heart, GitCompare } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';
import { useState } from 'react';

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
}

export const PropertyCard = ({
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
  description,
  description_en,
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
  ...props
}: PropertyCardProps) => {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Logic for "New" badge (e.g., less than 7 days old)
  const isNew = createdAt ? (new Date().getTime() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

  const { translatedText: autoTitle } = useAutoTranslate(title, title_en);
  const { translatedText: autoDescription } = useAutoTranslate(description, description_en);

  const displayTitle = autoTitle;
  const displayDescription = autoDescription ? autoDescription.replace(/<[^>]*>?/gm, '') : '';

  // Combine main image with gallery
  const images = [imageUrl, ...(gallery || [])].filter((img): img is string => !!img);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getBadgeColor = () => {
    switch (operation) {
      case 'ALQUILER': return 'bg-[#4ADE80] text-[#0A0A0A]';
      case 'VENTA': return 'bg-[#C9A962] text-[#0A0A0A]';
      case 'TRASPASO': return 'bg-[#60A5FA] text-[#0A0A0A]';
      default: return 'bg-[#C9A962] text-[#0A0A0A]';
    }
  };

  const formattedPrice = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(price);

  const { i18n } = useTranslation();
  const propertyUrl = `https://gelaberthomes.es${i18n.language.startsWith('en') ? '/en' : ''}/propiedades/${reference || id}`;

  const whatsappLink = getWhatsAppLink({
    context: 'property',
    propertyName: title,
    propertyRef: reference || (id ? (id.length > 8 ? id.slice(0, 8) : id) : undefined),
    url: propertyUrl
  });

  const card = (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ 
        duration: 1.2, 
        ease: [0.16, 1, 0.3, 1], 
        delay: index !== undefined ? Math.min(index % 12, 12) * 0.2 : 0.1 
      }}
      style={{ willChange: 'transform, opacity' }}
      className={cn(
        "group h-full flex flex-col bg-[#0D0D0D] border border-[#1F1F1F] hover:border-[#C9A962]/60 hover:shadow-2xl hover:shadow-[#C9A962]/10 transition-all duration-500 overflow-hidden relative rounded-2xl",
        className
      )}
      {...props}
    >
      {/* Image Area with Slider */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1A1A1A]">
        <AnimatePresence initial={false}>
          <motion.img
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            src={images[currentImageIndex]} 
            alt={title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Slider Controls */}
        {images.length > 1 && (
          <div className="absolute inset-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-between px-4 pointer-events-none">
            <button 
              onClick={prevImage}
              className="p-2 rounded-full glass-deep text-white hover:bg-[#C9A962] transition-colors pointer-events-auto shadow-xl border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextImage}
              className="p-2 rounded-full glass-deep text-white hover:bg-[#C9A962] transition-colors pointer-events-auto shadow-xl border border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Slider dots */}
        {images.length > 1 && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
            {images.slice(0, 5).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === currentImageIndex ? "w-4 bg-[#C9A962]" : "w-1.5 bg-white/40"
                )} 
              />
            ))}
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={onToggleFavorite}
          className={cn(
            "absolute top-4 right-4 z-30 p-2 rounded-full glass-deep transition-all duration-300 border shadow-lg pointer-events-auto",
            isFavorite 
              ? "bg-[#C9A962] border-[#C9A962] text-[#0A0A0A]" 
              : "border-white/10 text-white hover:bg-white/20 hover:scale-110"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>

        {/* Badges Container (Top Left, wraps horizontally) */}
        <div className="absolute top-4 left-4 right-14 flex flex-wrap gap-2 items-start z-20 pointer-events-none">
          {/* Operation Badge */}
          <div className={cn(
            "px-3 py-1 font-primary text-[10px] font-bold tracking-[0.08em] uppercase shadow-lg border border-white/10 glass-light",
            getBadgeColor()
          )}>
            {t(OPERATION_LABELS[operation.toLowerCase() as PropertyOperation])}
          </div>
          
          {/* New Badge */}
          {isNew && (
            <div className="px-3 py-1 bg-[#C9A962] text-[#0A0A0A] font-primary text-[10px] font-bold uppercase shadow-xl border border-white/20">
              {t('common.new')}
            </div>
          )}

          {/* Featured Badge */}
          {isFeatured && (
            <div className="px-3 py-1 glass-deep border border-[#C9A962]/40 font-primary text-[#C9A962] text-[10px] font-bold uppercase flex items-center gap-1 shadow-xl">
              <span>★</span> {t('property.labels.featured')}
            </div>
          )}

          {/* Commercial Status Badge */}
          {commercialStatus && (
            <div className={cn(
              "px-3 py-1 glass-deep border font-primary text-[10px] font-bold uppercase flex items-center gap-1 shadow-xl",
              commercialStatus === 'disponible' && "text-green-400 border-green-400/40",
              commercialStatus === 'reservado' && "text-orange-400 border-orange-400/40",
              commercialStatus === 'alquilado' && "text-purple-400 border-purple-400/40",
              commercialStatus === 'vendido' && "text-red-400 border-red-400/40",
              commercialStatus === 'traspasado' && "text-blue-400 border-blue-400/40",
            )}>
              {t(COMMERCIAL_STATUS_LABELS[commercialStatus])}
            </div>
          )}
        </div>

        {/* Watermark Overlay */}
        {commercialStatus && commercialStatus !== 'disponible' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden select-none">
            <div className={cn(
              "transform -rotate-12 scale-110 opacity-40 mix-blend-overlay",
              commercialStatus === 'reservado' && "text-orange-500",
              commercialStatus === 'alquilado' && "text-purple-500",
              commercialStatus === 'vendido' && "text-red-500",
              commercialStatus === 'traspasado' && "text-blue-500",
            )}>
              <div className="border-[6px] border-current px-6 py-2 rounded-sm flex items-center justify-center">
                <span className="font-secondary text-5xl font-black uppercase tracking-tighter text-center leading-none">
                  {t(COMMERCIAL_STATUS_LABELS[commercialStatus])}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Price Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 glass-deep border-t border-white/5 flex items-center justify-between z-10">
          <span className="font-secondary text-2xl text-[#FAF8F5] leading-none">{formattedPrice}</span>
          <a 
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-[#25D366] rounded-full text-black hover:scale-110 transition-transform shadow-lg"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-secondary text-xl text-[#FAF8F5] leading-tight group-hover:text-[#C9A962] transition-colors line-clamp-1">
            {displayTitle}
          </h3>
          <p className="font-primary text-[#818181] text-xs uppercase tracking-widest">{location}</p>
        </div>

        {description && (
          <p className="font-primary text-[#888888] text-sm line-clamp-2 leading-relaxed h-[2.8rem]">
            {displayDescription}
          </p>
        )}

        {/* Features Row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[#888888] pt-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <span className="font-primary text-xs font-bold text-[#FAF8F5]">{area}</span>
            <span className="font-primary text-[10px] uppercase tracking-wider">m²</span>
          </div>
          
          <span className="text-[#444444] font-bold">·</span>

          {(floor !== undefined && floor !== null && floor !== '') && (
            <>
              <div className="flex items-center gap-1">
                <span className="font-primary text-[10px] uppercase tracking-wider">{t('property.labels.features.floor')}</span>
                <span className="font-primary text-xs font-bold text-[#FAF8F5]">
                  {floor}{(!String(floor).includes('º') && !String(floor).includes('ª') && /^\d+$/.test(String(floor))) ? 'º' : ''}
                </span>
              </div>
              <span className="text-[#444444] font-bold">·</span>
            </>
          )}

          <div className="flex items-center gap-1">
            <span className="font-primary text-[10px] uppercase tracking-wider">{t('property.labels.features.bedrooms')}</span>
            <span className="font-primary text-xs font-bold text-[#FAF8F5]">{bedrooms}</span>
          </div>

          <span className="text-[#444444] font-bold">·</span>

          <div className="flex items-center gap-1">
            <span className="font-primary text-[10px] uppercase tracking-wider">{t('property.labels.features.bathrooms')}</span>
            <span className="font-primary text-xs font-bold text-[#FAF8F5]">{bathrooms}</span>
          </div>

          {(orientation && orientation.length > 0) && (
            <>
              <span className="text-[#444444] font-bold">·</span>
              <div className="flex items-center gap-1">
                <span className="font-primary text-[10px] uppercase tracking-wider">{t('property.form.fields.orientation')}</span>
                <span className="font-primary text-xs font-bold text-[#FAF8F5]">
                  {orientation.join(' · ')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Tags Row */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.slice(0, 3).map(tag => (
              <button
                key={tag}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="px-2 py-0.5 border border-[#1F1F1F] hover:border-[#C9A962]/50 font-primary text-[9px] uppercase tracking-wider text-[#C9A962] bg-[#C9A962]/5 transition-colors rounded-sm"
              >
                {t(`tags.${tag}`, tag)}
              </button>
            ))}
            {tags.length > 3 && (
              <span className="text-[9px] text-[#444444] self-center">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#1F1F1F]">
          <div className="font-primary text-[10px] uppercase tracking-[0.2em] text-[#666666] group-hover:text-[#FAF8F5] transition-colors flex items-center gap-2">
            {t('property.labels.features.view_more')}
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </div>
          {onToggleCompare && (
            <button
              onClick={onToggleCompare}
              title={isInCompare ? t('property.labels.features.remove_compare') : t('property.labels.features.compare')}
              className={cn(
                "p-2 rounded-sm border font-primary text-[9px] uppercase tracking-widest transition-all flex items-center gap-1",
                isInCompare
                  ? "bg-[#C9A962] border-[#C9A962] text-[#0A0A0A]"
                  : "border-white/10 text-white/30 hover:border-[#C9A962] hover:text-[#C9A962]"
              )}
            >
              <GitCompare className="w-3 h-3" />
              <span className="hidden lg:inline">{isInCompare ? t('property.labels.features.remove_short') : t('property.labels.features.compare')}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block w-full">{card}</Link>;
  }

  return card;
};
