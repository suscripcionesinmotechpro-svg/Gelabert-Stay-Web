import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
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
              src="/logo-og.png"
              alt="Gelabert Homes Real Estate"
              className="h-20 sm:h-24 w-auto object-contain self-start"
              style={{ mixBlendMode: 'screen' }}
            />
          </Link>
          <p className="font-primary text-sm text-[#888888] leading-relaxed max-w-xs font-light">
            {t('footer.description')}
          </p>

          <GoogleFooterBadge />

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
                <p className="font-primary text-[10px] text-[#666666] uppercase tracking-widest">{t('footer.email') || 'Email'}</p>
                <a href="mailto:info@gelaberthomes.es" className="font-primary text-sm text-[#888888] hover:text-white mt-1 block transition-colors">
                  info@gelaberthomes.es
                </a>
              </div>
              <div>
                <p className="font-primary text-[10px] text-[#666666] uppercase tracking-widest">{t('footer.whatsapp_call') || 'WhatsApp / Llama'}</p>
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
            
            <h4 className="font-primary text-[11px] font-bold text-white/90 uppercase tracking-[0.2em] mt-6">{t('footer.social_networks') || 'Redes Sociales'}</h4>
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
              <a href="https://www.linkedin.com/in/jose-carlos-delgado-gelabert-185487403" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center text-[#888888] hover:text-[#0077B5] hover:border-[#0077B5]/40 hover:bg-[#0077B5]/5 transition-all group" title="LinkedIn">
                <span className="group-hover:scale-110 transition-transform"><LinkedInIcon /></span>
              </a>
            </div>
          </div>
        </div>

      </div>
      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/5 py-6 px-6 md:px-14 flex items-center justify-center bg-black/20">
        <span className="font-primary text-xs text-white/50 tracking-wide text-center">
          © {new Date().getFullYear()} Gelabert Homes Real Estate · {t('footer.all_rights') || 'Todos los derechos reservados'}
        </span>
      </div>
    </footer>
  );
};

// ─── Google Footer Badge ─────────────────────────────────────────────────────

const GoogleLogoSmall = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GoogleFooterBadge = () => {
  const [rating, setRating] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const cached = sessionStorage.getItem('gelabert_google_reviews_v2');
    if (cached) {
      try {
        const { rating: r, total: tot } = JSON.parse(cached);
        if (r) { setRating(r); setTotal(tot); return; }
      } catch { /* ignore */ }
    }
    supabase.functions.invoke('google-reviews').then(({ data }) => {
      if (data?.rating) {
        setRating(data.rating);
        setTotal(data.total || 0);
        sessionStorage.setItem('gelabert_google_reviews_v2', JSON.stringify(data));
      }
    });
  }, []);

  if (!rating) return null;

  return (
    <a
      href="https://www.google.es/maps/place/Gelabert+Homes+Real+Estate/@36.7183312,-4.5316685,12z/data=!3m1!4b1!4m6!3m5!1s0x4faf4ce7697fd7c1:0xd7eb17fc18c8dc7a!8m2!3d36.718222!4d-4.4492669!16s%2Fg%2F11z755b0v3"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-4 px-6 py-4 bg-white/[0.03] border border-white/10 hover:border-[#C9A962]/40 hover:bg-white/[0.06] transition-all group rounded-sm shadow-lg w-fit self-start"
      title="Ver reseñas en Google"
    >
      <GoogleLogoSmall />
      <div className="flex flex-col gap-1 text-left">
        <span className="font-primary text-[12px] text-white/70 uppercase tracking-[0.2em] group-hover:text-white transition-colors font-semibold">
          Google Reviews
        </span>
        <div className="flex items-center gap-2">
          <span className="font-primary text-base text-[#C9A962] font-bold">{rating.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={12} className={s <= Math.round(rating) ? 'fill-[#FBBC05] text-[#FBBC05]' : 'fill-transparent text-white/15'} />
            ))}
          </div>
          {total > 0 && (
            <span className="font-primary text-xs text-white/45 font-light">({total} reseñas)</span>
          )}
        </div>
      </div>
    </a>
  );
};
