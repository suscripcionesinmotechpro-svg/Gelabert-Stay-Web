import { motion, type HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { OPERATION_LABELS, type PropertyOperation } from '../types/property';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
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
  ...props
}: PropertyCardProps) => {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { translatedText: autoTitle } = useAutoTranslate(title, title_en);
  const { translatedText: autoDescription } = useAutoTranslate(description, description_en);

  const displayTitle = autoTitle;
  const displayDescription = autoDescription;

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

  const whatsappLink = getWhatsAppLink({
    context: 'property',
    propertyName: title,
    propertyRef: props['id'] as string // Assuming ID is passed as prop or use title
  });

  const card = (
    <motion.div 
      className={cn(
        "group h-full flex flex-col bg-[#0D0D0D] border border-[#1F1F1F] hover:border-[#C9A962]/40 transition-all duration-500 overflow-hidden relative rounded-2xl",
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
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Slider Controls */}
        {images.length > 1 && (
          <div className="absolute inset-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-between px-4 pointer-events-none">
            <button 
              onClick={prevImage}
              className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-[#C9A962] transition-colors pointer-events-auto shadow-xl border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextImage}
              className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-[#C9A962] transition-colors pointer-events-auto shadow-xl border border-white/10"
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

        {/* Operation Badge */}
        <div className={cn("absolute top-4 left-4 px-3 py-1 font-primary text-[10px] font-bold tracking-[0.08em] uppercase z-10", getBadgeColor())}>
          {t(OPERATION_LABELS[operation.toLowerCase() as PropertyOperation])}
        </div>
        
        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-[#1F1F1F]/80 backdrop-blur-md border border-[#C9A962]/30 font-primary text-[#C9A962] text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg z-10">
            <span>★</span> {t('property.labels.featured')}
          </div>
        )}

        {/* Price Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-black/40 backdrop-blur-xl border-t border-white/10 flex items-center justify-between z-10">
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

        {/* Action Row */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#1F1F1F]">
          <div className="font-primary text-[10px] uppercase tracking-[0.2em] text-[#666666] group-hover:text-[#FAF8F5] transition-colors flex items-center gap-2">
            {t('property.labels.features.view_more')}
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block w-full">{card}</Link>;
  }

  return card;
};
