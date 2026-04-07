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
          transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 z-[9999] pointer-events-none flex justify-center"
        >
          <div className="w-full max-w-6xl pointer-events-auto">
            <div className="relative overflow-hidden rounded-2xl bg-[#0F0F0F]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 group">
              {/* Decorative gradient border */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />
              
              <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 text-[#444444] hover:text-[#C9A962] transition-all duration-300 transform hover:rotate-90 p-1"
                aria-label={t('common.close') || 'Cerrar'}
              >
                <X size={18} />
              </button>
 
              <div className="flex items-start gap-6 flex-1">
                <div className="hidden lg:flex w-14 h-14 items-center justify-center bg-[#C9A962]/5 rounded-xl border border-[#C9A962]/20 shrink-0 group-hover:scale-110 transition-transform duration-500">
                  <Cookie className="text-[#C9A962] drop-shadow-[0_0_8px_rgba(201,169,98,0.5)]" size={28} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-secondary text-xl font-light tracking-wide">{t('cookie_banner.title')}</h4>
                  <p className="text-[#888888] font-primary text-[13px] leading-relaxed max-w-3xl font-light">
                    <Trans 
                      i18nKey="cookie_banner.description"
                      components={[
                        <Link 
                          key="cookies-link"
                          to={`${langPrefix}/cookies`} 
                          className="text-[#C9A962] hover:text-[#D4B673] underline underline-offset-4 decoration-[#C9A962]/30 hover:decoration-[#C9A962] transition-all"
                        />
                      ]}
                    />
                  </p>
                </div>
              </div>
 
              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
                <button
                  onClick={handleDecline}
                  className="w-full sm:w-auto px-6 py-3 text-[#666666] hover:text-white font-primary text-[10px] uppercase tracking-[0.2em] transition-all duration-300 border border-white/5 hover:border-white/10 rounded-lg"
                >
                  {t('cookie_banner.only_necessary')}
                </button>
                <button
                  onClick={handleAccept}
                  className="w-full sm:w-auto px-10 py-3.5 bg-[#C9A962] text-black font-primary font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-[#D4B673] transition-all duration-300 rounded-lg shadow-[0_8px_20px_-8px_rgba(201,169,98,0.4)]"
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
