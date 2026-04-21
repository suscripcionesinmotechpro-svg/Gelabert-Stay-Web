import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export type StatusType = 'PUBLICADA' | 'BORRADOR' | 'RESERVADA' | 'VENDIDA' | 'ALQUILADA' | 'TRASPASADA' | 'OCULTA';

export const StatusBadge = ({ status, className }: { status: StatusType; className?: string }) => {
  const { t } = useTranslation();

  const getStatusStyles = () => {
    switch (status) {
      case 'PUBLICADA': return 'bg-[#4ADE80] text-[#0A0A0A]';
      case 'BORRADOR': return 'bg-[#888888] text-[#FAF8F5] shadow-sm';
      case 'RESERVADA': return 'bg-[#FB923C] text-[#0A0A0A] shadow-md';
      case 'ALQUILADA': return 'bg-[#A78BFA] text-[#0A0A0A] shadow-md';
      case 'VENDIDA': return 'bg-[#F87171] text-[#0A0A0A] shadow-md';
      case 'TRASPASADA': return 'bg-[#60A5FA] text-[#0A0A0A] shadow-md';
      case 'OCULTA': return 'bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30';
      default: return 'bg-[#1F1F1F] text-[#FAF8F5]';
    }
  };

  return (
    <div className={cn("px-2 py-1 flex items-center justify-center rounded", getStatusStyles(), className)}>
      <span className="font-primary text-[11px] font-bold uppercase">
        {t(`property_status.${status}`)}
      </span>
    </div>
  );
};
