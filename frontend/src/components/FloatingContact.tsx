import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageSquare, X, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getWhatsAppLink, getContextFromPath } from '../utils/whatsapp';

export const FloatingContact = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Detect context from current route
  const { context, labelEs } = getContextFromPath(location.pathname);

  // For property detail pages, extract the reference/ID from the URL
  const propertyDetailMatch = location.pathname.match(/\/propiedades\/([^\/]+)$/);
  const propertyRef = propertyDetailMatch ? propertyDetailMatch[1] : undefined;

  const whatsappLink = getWhatsAppLink({ 
    context,
    propertyRef,
    // propertyName is unknown without fetching, but reference is enough
  });

  const phoneNumber = '+34611898827';

  return (
    // Visible on ALL devices
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="contact-options"
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.85 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="flex flex-col gap-3"
          >
            {/* Context label */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="self-end px-3 py-1.5 bg-[#1A1A1A]/90 backdrop-blur-md border border-white/10 rounded-full"
            >
              <p className="font-primary text-[9px] text-white/50 uppercase tracking-[0.2em] whitespace-nowrap">
                {labelEs}
              </p>
            </motion.div>

            {/* WhatsApp */}
            <motion.a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              className="flex items-center gap-3 pr-5 pl-3 py-2.5 bg-[#25D366] text-black rounded-full shadow-2xl hover:scale-105 transition-transform self-end"
            >
              <div className="p-1.5 bg-black/10 rounded-full shrink-0">
                <MessageSquare className="w-5 h-5 fill-current" />
              </div>
              <span className="font-primary text-xs font-bold uppercase tracking-widest whitespace-nowrap">WhatsApp</span>
            </motion.a>

            {/* Call */}
            <motion.a
              href={`tel:${phoneNumber}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 }}
              className="flex items-center gap-3 pr-5 pl-3 py-2.5 bg-[#FAF8F5] text-[#0A0A0A] rounded-full shadow-2xl hover:scale-105 transition-transform self-end"
            >
              <div className="p-1.5 bg-[#C9A962] rounded-full text-white shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <span className="font-primary text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                +34 611 89 88 27
              </span>
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.88 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border ${
          isOpen
            ? 'bg-[#0A0A0A] border-white/20 text-white'
            : 'bg-[#C9A962] border-[#C9A962] text-[#0A0A0A] hover:scale-110 hover:shadow-[0_0_30px_rgba(201,169,98,0.5)]'
        }`}
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }}>
          {isOpen ? <X className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
};
