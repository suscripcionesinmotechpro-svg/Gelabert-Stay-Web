import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { OPERATION_LABELS, type PropertyOperation } from '../types/property';

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
  floor?: string | number | null;
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
  floor,
  ...props
}: PropertyCardProps) => {
  const { t } = useTranslation();
  
  const { translatedText: autoTitle } = useAutoTranslate(title, title_en);
  const { translatedText: autoDescription } = useAutoTranslate(description, description_en);


  const displayTitle = autoTitle;
  const displayDescription = autoDescription;

  const getBadgeColor = () => {
    switch (operation) {
      case 'ALQUILER': return 'bg-[#4ADE80] text-[#0A0A0A]';
      case 'VENTA': return 'bg-[#C9A962] text-[#0A0A0A]';
      case 'TRASPASO': return 'bg-[#60A5FA] text-[#0A0A0A]';
      default: return 'bg-[#C9A962] text-[#0A0A0A]';
    }
  };

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);

  const card = (
    <motion.div 
      className={cn(
        "group h-full flex flex-col bg-[#0F0F0F] border border-[#1F1F1F] overflow-hidden transition-all duration-500",
        "hover:border-[#C9A962]/50 hover:shadow-2xl hover:shadow-[#C9A962]/5 hover:-translate-y-1",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Image Area */}
      <div className="relative w-full h-[200px] bg-[#2A2A2A] overflow-hidden">
        {imageUrl ? (
          <motion.img 
            whileHover={{ scale: 1.08 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            src={imageUrl} 
            alt={displayTitle} 
            loading="lazy"
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#666666]">
            {t('common.no_image')}
          </div>
        )}
        
        {/* Operation Badge */}
        <div className={cn("absolute top-4 left-4 px-3 py-1 font-primary text-[10px] font-bold tracking-[0.08em] uppercase", getBadgeColor())}>
          {t(OPERATION_LABELS[operation.toLowerCase() as PropertyOperation])}
        </div>
        
        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-[#1F1F1F]/80 backdrop-blur-md border border-[#C9A962]/30 font-primary text-[#C9A962] text-[10px] font-bold uppercase flex items-center gap-1 shadow-lg">
            <span>★</span> {t('property.labels.featured')}
          </div>
        )}

        {/* Price Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-black/40 backdrop-blur-xl border-t border-white/10 flex items-center justify-between">
          <span className="font-secondary text-2xl text-[#FAF8F5] leading-none">{formattedPrice}</span>
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#888888] pt-1">
          <div className="flex items-center gap-1.5">
            <span className="font-primary text-xs font-bold text-[#FAF8F5]">{area}</span>
            <span className="font-primary text-[10px] uppercase tracking-wider">m²</span>
          </div>
          
          {(floor !== undefined && floor !== null && floor !== '') && (
            <>
              <div className="w-[1px] h-3 bg-[#1F1F1F]" />
              <div className="flex items-center gap-1.5">
                <span className="font-primary text-xs font-bold text-[#FAF8F5]">{floor}</span>
                <span className="font-primary text-[10px] uppercase tracking-wider">{t('property.labels.features.floor')}</span>
              </div>
            </>
          )}

          <div className="w-[1px] h-3 bg-[#1F1F1F]" />
          <div className="flex items-center gap-1.5">
            <span className="font-primary text-xs font-bold text-[#FAF8F5]">{bedrooms}</span>
            <span className="font-primary text-[10px] uppercase tracking-wider">{t('property.labels.features.bedrooms')}</span>
          </div>
          <div className="w-[1px] h-3 bg-[#1F1F1F]" />
          <div className="flex items-center gap-1.5">
            <span className="font-primary text-xs font-bold text-[#FAF8F5]">{bathrooms}</span>
            <span className="font-primary text-[10px] uppercase tracking-wider">{t('property.labels.features.bathrooms')}</span>
          </div>
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
