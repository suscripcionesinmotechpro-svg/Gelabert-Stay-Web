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
    <footer className="relative w-full bg-[#050505] border-t border-white/5 mt-auto overflow-hidden">
      {/* Background Glow */}
      <div className="absolute pointer-events-none inset-0 z-0">
        <div className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#C9A962]/5 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 pt-20 pb-12 px-6 md:px-14 flex flex-col lg:flex-row justify-between gap-16">
        
        {/* Brand & Hours Card */}
        <div className="flex flex-col gap-8 max-w-sm">
          <Link to={langPrefix || '/'}>
            <img
              src="/watermark.png"
              alt="Gelabert Homes Real Estate"
              className="h-20 sm:h-24 w-auto object-contain self-start drop-shadow-[0_0_15px_rgba(201,169,98,0.15)]"
            />
          </Link>
          <p className="font-primary text-sm text-[#888888] leading-relaxed max-w-xs font-light">
            {t('footer.description')}
          </p>

          {/* Horario Premium Card */}
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-sm backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#C9A962]/40 group-hover:bg-[#C9A962] transition-colors" />
            <span className="block font-primary text-[10px] text-[#C9A962] uppercase tracking-[0.2em] font-bold mb-4">
              {t('footer.hours_label') || 'Horario de Atención'}
            </span>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="font-primary text-[12px] text-[#666666] tracking-wide">{t('footer.hours_weekdays')?.split('·')[0].trim() || 'Lun – Vie'}</span>
                <span className="font-primary text-[13px] text-white/80 font-medium">9:00 <span className="text-[#C9A962]">/</span> 19:00</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-primary text-[12px] text-[#666666] tracking-wide">{t('footer.hours_weekend')?.split('·')[0].trim() || 'Sábados'}</span>
                <span className="font-primary text-[13px] text-[#D4B673] font-medium tracking-wide">10:00 <span className="text-white/20">/</span> 14:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-12 lg:gap-8 pt-4">
          
          {/* Services */}
          <div className="flex flex-col gap-5">
            <h4 className="font-primary text-[11px] font-bold text-white/90 uppercase tracking-[0.2em]">{t('footer.services')}</h4>
            <div className="flex flex-col gap-3">
              <Link to={`${langPrefix}/propiedades?operation=alquiler`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] hover:translate-x-1 transition-all">{t('footer.rent')}</Link>
              <Link to={`${langPrefix}/propiedades?operation=venta`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] hover:translate-x-1 transition-all">{t('footer.sale')}</Link>
              <Link to={`${langPrefix}/propiedades?operation=traspaso`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] hover:translate-x-1 transition-all">{t('footer.transfers')}</Link>
              <Link to={`${langPrefix}/servicios`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] hover:translate-x-1 transition-all">{t('footer.all_services')}</Link>
              <Link to={`${langPrefix}/propietarios`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] hover:translate-x-1 transition-all">{t('footer.for_owners') || 'Para propietarios'}</Link>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-5">
            <h4 className="font-primary text-[11px] font-bold text-white/90 uppercase tracking-[0.2em]">{t('footer.contact')}</h4>
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-primary text-[10px] text-[#666666] uppercase tracking-widest">{t('footer.location')}</p>
                <p className="font-primary text-sm text-[#C9A962] mt-1">{t('footer.online_estate')}</p>
              </div>
              <div>
                <p className="font-primary text-[10px] text-[#666666] uppercase tracking-widest">Email</p>
                <a href="mailto:info@gelaberthomes.es" className="font-primary text-sm text-[#888888] hover:text-white mt-1 block transition-colors">
                  info@gelaberthomes.es
                </a>
              </div>
              <div>
                <p className="font-primary text-[10px] text-[#666666] uppercase tracking-widest">WhatsApp / Llama</p>
                <a href="tel:+34611898827" className="font-primary text-sm text-white hover:text-[#C9A962] mt-1 block transition-colors tracking-wide">
                  +34 611 89 88 27
                </a>
              </div>
            </div>
          </div>

          {/* Legal & Socials */}
          <div className="flex flex-col gap-5">
            <h4 className="font-primary text-[11px] font-bold text-white/90 uppercase tracking-[0.2em]">{t('footer.legal')}</h4>
            <div className="flex flex-col gap-3">
              <Link to={`${langPrefix}/aviso-legal`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] hover:translate-x-1 transition-all">{t('footer.legal_notice')}</Link>
              <Link to={`${langPrefix}/privacidad`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] hover:translate-x-1 transition-all">{t('footer.privacy_policy')}</Link>
              <Link to={`${langPrefix}/cookies`} className="font-primary text-sm text-[#888888] hover:text-[#C9A962] hover:translate-x-1 transition-all">{t('footer.cookies_policy')}</Link>
            </div>
            
            <h4 className="font-primary text-[11px] font-bold text-white/90 uppercase tracking-[0.2em] mt-6">Redes Sociales</h4>
            <div className="flex items-center gap-3">
              <a href="https://instagram.com/gelaberthomes" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center text-[#888888] hover:text-[#C9A962] hover:border-[#C9A962]/40 hover:bg-[#C9A962]/5 transition-all group">
                <span className="group-hover:scale-110 transition-transform"><InstagramIcon /></span>
              </a>
              <a href="https://facebook.com/gelaberthomes" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center text-[#888888] hover:text-[#C9A962] hover:border-[#C9A962]/40 hover:bg-[#C9A962]/5 transition-all group">
                <span className="group-hover:scale-110 transition-transform"><FacebookIcon /></span>
              </a>
              <a href="https://wa.me/34611898827" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center text-[#888888] hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/5 transition-all group">
                <span className="group-hover:scale-110 transition-transform"><WhatsAppIcon /></span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/5 py-6 px-6 md:px-14 flex flex-col md:flex-row items-center justify-between gap-4 bg-black/20">
        <span className="font-primary text-xs text-[#555555] tracking-wide">
          © {new Date().getFullYear()} Gelabert Homes Real Estate · {t('footer.all_rights') || 'Todos los derechos reservados'}
        </span>
        <span className="font-primary text-[10px] text-[#444444] uppercase tracking-widest font-bold">
          {t('footer.made_in') || 'Málaga, España 🇪🇸'}
        </span>
      </div>
    </footer>
  );
};
