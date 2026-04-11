import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Home, Search, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  const { t, i18n } = useTranslation();
  const langPrefix = i18n.language.startsWith('en') ? '/en' : '';

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <Helmet>
        <title>404 — Página no encontrada | Gelabert Homes</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9A962]/5 blur-[140px] rounded-full" />
      </div>

      {/* Big decorative number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 select-none"
      >
        <span
          className="font-secondary font-black leading-none text-[clamp(8rem,30vw,18rem)] text-transparent"
          style={{
            WebkitTextStroke: '2px rgba(201,169,98,0.15)',
          }}
        >
          404
        </span>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-6 text-center -mt-8 md:-mt-16"
      >
        {/* Label */}
        <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.4em] font-bold">
          {t('not_found.label') || 'Página no encontrada'}
        </span>

        <h1 className="font-secondary text-3xl md:text-5xl text-[#FAF8F5] max-w-xl leading-tight">
          {t('not_found.title') || 'Esta página no existe o ha sido movida'}
        </h1>

        <p className="font-primary text-[#888888] text-base max-w-md leading-relaxed">
          {t('not_found.description') || 'Puede que el enlace sea incorrecto o que la propiedad ya no esté disponible. Te ayudamos a encontrar lo que buscas.'}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            to={`${langPrefix}/`}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[12px] uppercase tracking-[0.2em] hover:bg-[#D4B673] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#C9A962]/10"
          >
            <Home className="w-4 h-4" />
            {t('not_found.go_home') || 'Ir al inicio'}
          </Link>

          <Link
            to={`${langPrefix}/propiedades`}
            className="flex items-center justify-center gap-2 px-6 py-3.5 border border-[#C9A962]/40 text-[#C9A962] font-primary font-bold text-[12px] uppercase tracking-[0.2em] hover:bg-[#C9A962]/10 transition-all"
          >
            <Search className="w-4 h-4" />
            {t('not_found.view_properties') || 'Ver propiedades'}
          </Link>
        </div>

        {/* Back link */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 font-primary text-[11px] text-[#666666] hover:text-[#FAF8F5] transition-colors uppercase tracking-wider mt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('not_found.go_back') || 'Volver atrás'}
        </button>
      </motion.div>

      {/* Decorative gold line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent origin-center"
      />
    </div>
  );
};
