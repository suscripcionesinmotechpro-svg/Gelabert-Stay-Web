import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Lock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from './Footer';
import { CookieBanner } from './CookieBanner';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Layout = () => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const langPrefix = i18n.language.startsWith('en') ? '/en' : '';
  const navLinks = [
    { name: t('nav.home'), path: langPrefix || '/' },
    { name: t('nav.properties'), path: `${langPrefix}/propiedades` },
    { name: t('nav.services'), path: `${langPrefix}/servicios` },
    { name: t('nav.owners'), path: `${langPrefix}/propietarios` },
    { name: t('nav.contact'), path: `${langPrefix}/contacto` },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#0F0F0F] text-[#FAF8F5] overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 w-full h-24 bg-[#0F0F0F]/90 backdrop-blur-md border-b border-[#1F1F1F] z-50 flex items-center justify-between px-6 md:px-14">
        {/* Logo */}
        <Link to={langPrefix || '/'} className="flex items-center">
          <img
            src="/logo.png"
            alt="Gelabert Stay Real Estate"
            className="h-20 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 font-primary text-[13px] tracking-wide uppercase">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`hover:text-[#C9A962] transition-colors ${location.pathname === link.path ? 'text-[#C9A962]' : 'text-[#FAF8F5]'}`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/admin/login"
            className="px-5 py-2 border border-[#C9A962] text-[#C9A962] hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-colors"
          >
            {t('nav.clientArea')}
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-0 w-full bg-[#0F0F0F] border-b border-[#1F1F1F] z-40 flex flex-col md:hidden py-6 px-6 gap-6 font-primary text-[14px] uppercase tracking-wider"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${location.pathname === link.path ? 'text-[#C9A962]' : 'text-[#FAF8F5]'}`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/admin/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[#C9A962] mt-4 flex items-center gap-2"
            >
              {t('nav.clientArea')} <Lock size={14} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 mt-24 w-full">
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
    </div>
  );
};
