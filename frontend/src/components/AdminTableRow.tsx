import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export interface AdminTableRowProps {
  id: string;
  refCode: string;
  title: string;
  operation: 'ALQUILER' | 'VENTA' | 'TRASPASO';
  type: string;
  price: number;
  imageUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const AdminTableRow = ({
  refCode,
  title,
  operation,
  type,
  price,
  imageUrl,
  onEdit,
  onDelete
}: AdminTableRowProps) => {
  const { t, i18n } = useTranslation();

  const formattedPrice = new Intl.NumberFormat(i18n.language === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="w-full flex items-center gap-4 h-20 bg-[#0A0A0A] border-b border-[#1F1F1F] px-4 md:px-0 hover:bg-[#111111] transition-colors"
    >
      <div className="w-[60px] h-10 bg-[#1A1A1A] border border-[#1F1F1F] flex items-center justify-center overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="font-primary text-[10px] text-[#333333]">IMG</span>
        )}
      </div>

      <div className="flex flex-col gap-1 w-[200px] flex-shrink-0">
        <span className="font-primary text-[13px] font-bold text-[#FAF8F5] truncate">{title}</span>
        <span className="font-primary text-[11px] text-[#666666]">{refCode}</span>
      </div>

      <div className="w-[100px] flex items-center flex-shrink-0 hidden md:flex">
        <div className={`px-2 py-1 rounded flex items-center justify-center
          ${operation === 'ALQUILER' ? 'bg-[#4ADE80] text-[#0A0A0A]' : 
            operation === 'VENTA' ? 'bg-[#C9A962] text-[#0A0A0A]' : 
            'bg-[#60A5FA] text-[#0A0A0A]'}`}>
          <span className="font-primary text-[10px] font-bold">{t(`property.labels.operation.${operation.toLowerCase()}`)}</span>
        </div>
      </div>

      <div className="w-[120px] flex-shrink-0 hidden lg:flex">
        <span className="font-primary text-[13px] text-[#888888]">{t(`property_types.${type.toLowerCase()}`, { defaultValue: type })}</span>
      </div>

      <div className="w-[120px] flex-shrink-0 hidden sm:flex">
        <span className="font-secondary text-[14px] text-[#FAF8F5]">{formattedPrice}</span>
      </div>

      <div className="flex-1 flex justify-end items-center gap-2">
        <button 
          onClick={onEdit}
          className="h-8 px-3 bg-[#161616] border border-[#1F1F1F] text-[#C9A962] font-primary text-[11px] hover:bg-[#1A1A1A] transition-colors"
        >
          {t('common.edit')}
        </button>
        <button 
          onClick={onDelete}
          className="h-8 px-3 bg-[#161616] border border-[#1F1F1F] text-[#F87171] font-primary text-[11px] hover:bg-[#2A1010] transition-colors"
        >
          {t('common.delete')}
        </button>
      </div>
    </motion.div>
  );
};
