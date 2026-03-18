import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageSquare, X, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getWhatsAppLink } from '../utils/whatsapp';

export const FloatingContact = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const whatsappLink = getWhatsAppLink({ context: 'general' });
  const phoneNumber = '+34624419992';

  return (
    // Visible on ALL devices (not just mobile)
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
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
              className="flex items-center gap-3 pr-4 pl-3 py-2.5 bg-[#25D366] text-black rounded-full shadow-2xl hover:scale-105 transition-transform"
            >
              <div className="p-1.5 bg-black/10 rounded-full">
                <MessageSquare className="w-5 h-5 fill-current" />
              </div>
              <span className="font-primary text-xs font-bold uppercase tracking-widest whitespace-nowrap">WhatsApp</span>
            </a>

            {/* Call */}
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center gap-3 pr-4 pl-3 py-2.5 bg-[#FAF8F5] text-[#0A0A0A] rounded-full shadow-2xl hover:scale-105 transition-transform"
            >
              <div className="p-1.5 bg-[#C9A962] rounded-full text-white">
                <Phone className="w-5 h-5" />
              </div>
              <span className="font-primary text-xs font-bold uppercase tracking-widest whitespace-nowrap">{t('contact.call')}</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border ${
          isOpen
            ? 'bg-[#0A0A0A] border-white/20 text-white'
            : 'bg-[#C9A962] border-[#C9A962] text-[#0A0A0A] hover:scale-110 hover:shadow-[0_0_30px_rgba(201,169,98,0.4)]'
        }`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
};
