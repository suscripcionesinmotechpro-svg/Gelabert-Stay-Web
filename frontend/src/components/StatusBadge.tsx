import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export type StatusType = 'PUBLICADA' | 'BORRADOR' | 'RESERVADA' | 'VENDIDA' | 'ALQUILADA' | 'TRASPASADA' | 'OCULTA';

export const StatusBadge = ({ status, className }: { status: StatusType; className?: string }) => {
  const { t } = useTranslation();

  const getStatusStyles = () => {
    switch (status) {
      case 'PUBLICADA': return 'bg-[#4ADE8020] text-[#4ADE80]';
      case 'BORRADOR': return 'bg-[#88888820] text-[#888888]';
      case 'RESERVADA': return 'bg-[#60A5FA20] text-[#60A5FA]';
      case 'VENDIDA': case 'ALQUILADA': case 'TRASPASADA': return 'bg-[#C9A96220] text-[#C9A962]';
      case 'OCULTA': return 'bg-[#F8717120] text-[#F87171]';
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
