import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
  label?: string;
  href?: string;
  className?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber,
  message,
  label,
  href,
  className = "",
}) => {
  const { t } = useTranslation();
  
  const finalMessage = message || t('forms.whatsapp_placeholder_msg');
  const finalLabel = label || t('forms.whatsapp_label');
  
  const encodedMessage = encodeURIComponent(finalMessage);
  const whatsappUrl = href || `https://wa.me/${phoneNumber.replace(/\s+/g, '')}?text=${encodedMessage}`;

  return (
    <div className="flex flex-col gap-2">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-primary font-bold text-[13px] uppercase tracking-widest transition-all rounded-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 ${className}`}
      >
        <MessageCircle size={18} fill="currentColor" />
        {finalLabel}
      </a>
      <p className="text-[11px] text-[#888888] font-primary leading-relaxed max-w-[280px]">
        <Trans 
          i18nKey="forms.whatsapp_privacy"
          components={[<a href="/privacidad" className="text-[#C9A962] hover:underline" />]}
        />
      </p>
    </div>
  );
};
