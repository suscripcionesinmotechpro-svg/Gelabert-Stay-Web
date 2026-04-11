import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Social icons as inline SVG (no external deps — no network requests)
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

export const Footer = () => {
  const { t, i18n } = useTranslation();
  const langPrefix = i18n.language.startsWith('en') ? '/en' : '';

  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-[#1F1F1F] mt-auto">

      {/* Golden top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />

      <div className="py-16 px-6 md:px-14 flex flex-col md:flex-row justify-between gap-12">

        {/* Brand */}
        <div className="flex flex-col gap-5 max-w-xs">
          <img
            src="/logo.png"
            alt="Gelabert Homes Real Estate"
            className="h-24 w-auto object-contain self-start"
          />
          <p className="font-primary text-sm text-[#888888] leading-relaxed">
            {t('footer.description')}
          </p>
          {/* Horario */}
          <div className="flex flex-col gap-1">
            <span className="font-primary text-[10px] text-[#666666] uppercase tracking-[0.2em] font-bold">
              {t('footer.hours_label') || 'Horario de atención'}
            </span>
            <span className="font-primary text-xs text-[#888888]">
              {t('footer.hours_weekdays') || 'Lun – Vie · 9:00 – 19:00'}
            </span>
            <span className="font-primary text-xs text-[#888888]">
              {t('footer.hours_weekend') || 'Sáb · 10:00 – 14:00'}
            </span>
          </div>
          {/* Social links */}
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://instagram.com/gelaberthomes"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 glass border border-[#1F1F1F] flex items-center justify-center text-[#888888] hover:text-[#C9A962] hover:border-[#C9A962]/40 transition-all"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://facebook.com/gelaberthomes"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 glass border border-[#1F1F1F] flex items-center justify-center text-[#888888] hover:text-[#C9A962] hover:border-[#C9A962]/40 transition-all"
              aria-label="Facebook"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://wa.me/34611898827"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 glass border border-[#1F1F1F] flex items-center justify-center text-[#888888] hover:text-[#25D366] hover:border-[#25D366]/40 transition-all"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-col gap-4">
          <h4 className="font-primary text-[13px] font-bold text-[#FAF8F5] uppercase tracking-wider">{t('footer.services')}</h4>
          <Link to={`${langPrefix}/propiedades?operation=alquiler`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.rent')}</Link>
          <Link to={`${langPrefix}/propiedades?operation=venta`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.sale')}</Link>
          <Link to={`${langPrefix}/propiedades?operation=traspaso`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.transfers')}</Link>
          <Link to={`${langPrefix}/servicios`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.all_services')}</Link>
          <Link to={`${langPrefix}/propietarios`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.for_owners') || 'Para propietarios'}</Link>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-4">
          <h4 className="font-primary text-[13px] font-bold text-[#FAF8F5] uppercase tracking-wider">{t('footer.contact')}</h4>
          <p className="font-primary text-sm text-[#888888]">{t('footer.location')}</p>
          <p className="font-primary text-sm text-[#C9A962] font-semibold">{t('footer.online_estate')}</p>
          <a href="tel:+34611898827" className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">
            +34 611 89 88 27
          </a>
          <a href="mailto:info@gelaberthomes.es" className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">
            info@gelaberthomes.es
          </a>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-4">
          <h4 className="font-primary text-[13px] font-bold text-[#FAF8F5] uppercase tracking-wider">{t('footer.legal')}</h4>
          <Link to={`${langPrefix}/aviso-legal`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.legal_notice')}</Link>
          <Link to={`${langPrefix}/privacidad`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.privacy_policy')}</Link>
          <Link to={`${langPrefix}/cookies`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] transition-colors">{t('footer.cookies_policy')}</Link>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1F1F1F] py-5 px-6 md:px-14 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="font-primary text-[11px] text-[#555555] text-center">
          © {new Date().getFullYear()} Gelabert Homes Real Estate · {t('footer.all_rights') || 'Todos los derechos reservados'}
        </span>
        <span className="font-primary text-[11px] text-[#444444]">
          {t('footer.made_in') || 'Málaga, España 🇪🇸'}
        </span>
      </div>
    </footer>
  );
};
