import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageSquare, X, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getWhatsAppLink } from '../utils/whatsapp';

export const FloatingContact = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const whatsappLink = getWhatsAppLink({ context: 'general' });
  const phoneNumber = '+34600000000'; // Replace with real number if available

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 md:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-3"
          >
            {/* WhatsApp */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 pr-4 pl-3 py-2 bg-[#25D366] text-black rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              <div className="p-1.5 bg-black/10 rounded-full">
                <MessageSquare className="w-5 h-5 fill-current" />
              </div>
              <span className="font-primary text-xs font-bold uppercase tracking-widest">WhatsApp</span>
            </a>

            {/* Call */}
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center gap-3 pr-4 pl-3 py-2 bg-[#FAF8F5] text-[#0A0A0A] rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              <div className="p-1.5 bg-[#C9A962] rounded-full text-white">
                <Phone className="w-5 h-5" />
              </div>
              <span className="font-primary text-xs font-bold uppercase tracking-widest">{t('contact.call')}</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 border",
          isOpen 
            ? "bg-[#0A0A0A] border-white/10 text-white rotate-90" 
            : "bg-[#C9A962] border-[#C9A962] text-[#0A0A0A] hover:scale-110"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
      </button>
    </div>
  );
};

// Internal cn helper if not imported
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
