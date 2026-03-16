import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

export const CookieBanner = () => {
  const { t, i18n } = useTranslation();
  const langPrefix = i18n.language.startsWith('en') ? '/en' : '';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie-consent');
      if (!consent) {
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('LocalStorage not accessible:', e);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie-consent', 'accepted');
    } catch (e) {
      console.warn('LocalStorage not accessible:', e);
    }
    setIsVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('cookie-consent', 'declined');
    } catch (e) {
      console.warn('LocalStorage not accessible:', e);
    }
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 pointer-events-none"
        >
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <div className="bg-[#121212] border border-[#C9A962]/20 backdrop-blur-xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative">
              <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 text-[#444444] hover:text-[#C9A962] transition-colors"
                aria-label={t('common.close') || 'Cerrar'}
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4 flex-1">
                <div className="hidden md:flex w-12 h-12 items-center justify-center bg-[#C9A962]/10 rounded-full shrink-0">
                  <Cookie className="text-[#C9A962]" size={24} />
                </div>
                <div>
                  <h4 className="text-[#FAF8F5] font-secondary text-lg mb-1">{t('cookie_banner.title')}</h4>
                  <p className="text-[#888888] font-primary text-sm leading-relaxed max-w-3xl">
                    <Trans i18nKey="cookie_banner.description">
                      Utilizamos cookies propias y de terceros para mejorar tu experiencia de navegación, ofrecerte contenidos adaptados a tus intereses y realizar labores analíticas. 
                      Puedes aceptar todas las cookies o configurar tus preferencias. Consulta nuestra <Link to={`${langPrefix}/cookies`} className="text-[#C9A962] hover:underline">Política de Cookies</Link>.
                    </Trans>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                <button
                  onClick={handleDecline}
                  className="w-full sm:w-auto px-6 py-2.5 text-[#888888] hover:text-[#FAF8F5] font-primary text-[11px] uppercase tracking-widest transition-colors"
                >
                  {t('cookie_banner.only_necessary')}
                </button>
                <button
                  onClick={handleAccept}
                  className="w-full sm:w-auto px-10 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[11px] uppercase tracking-widest hover:bg-[#D4B673] transition-all shadow-lg"
                >
                  {t('cookie_banner.accept_all')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
