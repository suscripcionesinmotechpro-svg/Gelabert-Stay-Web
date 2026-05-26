import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { LanguageSwitcher } from './LanguageSwitcher';
import { FloatingContact } from './FloatingContact';


export const Layout = () => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const langPrefix = i18n.language.startsWith('en') ? '/en' : '';
  const navLinks = [
    { name: t('nav.home'), path: langPrefix || '/' },
    { name: t('nav.properties'), path: `${langPrefix}/propiedades` },
    { name: t('nav.services'), path: `${langPrefix}/servicios` },
    { name: t('nav.owners'), path: `${langPrefix}/propietarios` },
    { name: t('nav.valuation'), path: `${langPrefix}/valoracion` },
    { name: t('nav.blog'), path: `${langPrefix}/blog` },
    { name: t('nav.about'), path: `${langPrefix}/nosotros` },
    { name: t('nav.contact'), path: `${langPrefix}/contacto` },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#0F0F0F] text-[#FAF8F5] overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 h-20 md:h-24 glass-deep z-50 flex items-center justify-between px-6 md:px-14">
        {/* Scroll progress bar */}
        <div 
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#C9A962]/80 via-[#C9A962] to-[#D4B673] transition-all duration-75 ease-linear"
          style={{ width: `${scrollProgress}%` }}
        />
        {/* Logo */}
        <Link to={langPrefix || '/'} className="flex items-center">
          <img
            src="/logo-og.png"
            alt="Gelabert Homes Real Estate"
            className="h-16 md:h-18 w-auto object-contain"
            style={{ mixBlendMode: 'screen' }}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 font-primary text-[12px] tracking-widest uppercase">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="relative group py-1"
              >
                <span
                  className={`transition-colors duration-300 ${
                    isActive ? 'text-[#C9A962]' : 'text-[#B0A99A] group-hover:text-[#FAF8F5]'
                  }`}
                >
                  {link.name}
                </span>
                {/* Underline animada */}
                <span
                  className="absolute bottom-0 left-0 h-[1.5px] bg-gradient-to-r from-[#C9A962] via-[#D4B673] to-[#C9A962] rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: isActive ? '100%' : '0%',
                    opacity: isActive ? 1 : 0,
                  }}
                />
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-gradient-to-r from-transparent via-[#C9A962]/60 to-transparent rounded-full transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 group-hover:w-full w-0"
                />
              </Link>
            );
          })}

          {/* Acceso Privado — Premium */}
          <Link
            to="/admin/login"
            className="relative ml-2 flex items-center gap-2 px-5 py-2 overflow-hidden group
              border border-[#C9A962]/50 text-[#C9A962] text-[11px] tracking-[0.15em]
              hover:border-[#C9A962] transition-all duration-500
              shadow-[0_0_0px_rgba(201,169,98,0)] hover:shadow-[0_0_20px_rgba(201,169,98,0.25)]"
          >
            {/* Fondo con sweep dorado al hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-[#C9A962]/0 via-[#C9A962]/10 to-[#C9A962]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Lock size={12} className="transition-transform duration-500 group-hover:rotate-[15deg] group-hover:scale-110" />
            <span>{t('nav.clientArea')}</span>
          </Link>

          <LanguageSwitcher />
        </nav>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center gap-4">
          <LanguageSwitcher />
          <button
            className="text-[#C9A962]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, y: 0, backdropFilter: 'blur(24px)' }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-20 left-0 w-full bg-[#0A0A0A]/95 backdrop-blur-2xl border-b border-[#C9A962]/10 z-40 flex flex-col md:hidden py-8 px-8 gap-0 font-primary uppercase tracking-widest"
          >
            {navLinks.map((link, i) => {
              const isActive = location.pathname === link.path;
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between py-4 text-[13px] border-b border-[#1A1A1A] transition-colors duration-300 ${
                      isActive ? 'text-[#C9A962]' : 'text-[#888888] hover:text-[#FAF8F5]'
                    }`}
                  >
                    <span>{link.name}</span>
                    {isActive && (
                      <motion.span
                        layoutId="mobile-active"
                        className="w-1.5 h-1.5 rounded-full bg-[#C9A962] shadow-[0_0_8px_#C9A962]"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: navLinks.length * 0.05, duration: 0.3 }}
              className="mt-6"
            >
              <Link
                to="/admin/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-3 py-3 px-6 border border-[#C9A962]/50 text-[#C9A962] text-[12px] tracking-[0.15em] hover:border-[#C9A962] hover:shadow-[0_0_20px_rgba(201,169,98,0.2)] transition-all duration-500"
              >
                <Lock size={13} />
                <span>{t('nav.clientArea')}</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 mt-20 md:mt-24 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />
      <CookieBanner />
      <FloatingContact />
    </div>
  );
};
