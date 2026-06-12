import { useTranslation } from 'react-i18next';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const nextRouter = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'es', name: 'ES', flagUrl: 'https://flagcdn.com/w40/es.png', label: 'Castellano' },
    { code: 'en', name: 'EN', flagUrl: 'https://flagcdn.com/w40/gb.png', label: 'English' }
  ];

  const currentLanguage = languages.find(lang => i18n.language.startsWith(lang.code)) || languages[0];

  const toggleLanguage = (code: string) => {
    // Sincronizar con la URL
    const currentPath = location.pathname;
    let newPath = currentPath;

    if (code === 'en') {
      if (!currentPath.startsWith('/en')) {
        newPath = `/en${currentPath === '/' ? '' : currentPath}`;
      }
    } else {
      if (currentPath.startsWith('/en')) {
        newPath = currentPath.replace(/^\/en/, '') || '/';
      }
    }

    // Si la ruta cambia, delegamos el cambio de idioma a LanguageInitializer al montar el componente destino,
    // eliminando el doble ciclo de renderizado (re-traducir página actual y luego navegar)
    if (newPath !== currentPath) {
      const searchString = searchParams.toString();
      const finalPath = searchString ? `${newPath}?${searchString}` : newPath;
      navigate(finalPath, { replace: true });
    } else {
      i18n.changeLanguage(code);
    }
    
    setIsOpen(false);
  };

  // Prefetch de la ruta alternativa para que la navegación sea instantánea al hacer click
  useEffect(() => {
    const otherCode = currentLanguage.code === 'es' ? 'en' : 'es';
    const currentPath = location.pathname;
    let otherPath = currentPath;

    if (otherCode === 'en') {
      if (!currentPath.startsWith('/en')) {
        otherPath = `/en${currentPath === '/' ? '' : currentPath}`;
      }
    } else {
      if (currentPath.startsWith('/en')) {
        otherPath = currentPath.replace(/^\/en/, '') || '/';
      }
    }

    const searchString = searchParams.toString();
    const finalPrefetchPath = searchString ? `${otherPath}?${searchString}` : otherPath;
    
    try {
      nextRouter.prefetch(finalPrefetchPath);
    } catch (e) {
      // Ignorar en entornos que no sean Next.js
    }
  }, [location.pathname, searchParams, currentLanguage.code, nextRouter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2 border border-[#C9A962]/30 bg-[#0A0A0A]/80 backdrop-blur-md rounded-full text-[#FAF8F5] hover:border-[#C9A962] transition-all duration-500 group shadow-[0_0_15px_rgba(201,169,98,0.1)]"
      >
        <img src={currentLanguage.flagUrl} alt={currentLanguage.name} className="w-5 h-3.5 object-cover rounded-xs border border-white/10" />
        <span className="text-[11px] font-bold tracking-[0.2em] font-primary uppercase">{currentLanguage.name}</span>
        <ChevronDown 
          size={12} 
          className={`text-[#C9A962] transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 mt-3 py-1 w-40 bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#C9A962]/20 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-[100] overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-[#1F1F1F]">
              <span className="text-[9px] font-bold text-[#666666] uppercase tracking-[0.15em]">Seleccionar Idioma</span>
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`w-full text-left px-4 py-3 text-[11px] font-bold tracking-[0.1em] transition-all duration-300 flex items-center justify-between group/item
                  ${i18n.language.startsWith(lang.code) 
                    ? 'text-[#C9A962] bg-[#C9A962]/5' 
                    : 'text-[#888888] hover:text-[#FAF8F5] hover:bg-white/5'}
                `}
              >
                <div className="flex items-center gap-3">
                  <img src={lang.flagUrl} alt={lang.name} className="w-5 h-3.5 object-cover rounded-xs border border-white/10" />
                  <span className="uppercase">{lang.label}</span>
                </div>
                {i18n.language.startsWith(lang.code) && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="w-1 h-1 rounded-full bg-[#C9A962] shadow-[0_0_8px_#C9A962]"
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
