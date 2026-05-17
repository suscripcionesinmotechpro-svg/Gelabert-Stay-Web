import { motion } from 'framer-motion';
import { PropertyContactForm } from '../components/PropertyContactForm';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { getWhatsAppLink } from '../utils/whatsapp';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as any },
};

export const Propietarios = () => {
  const { t, i18n } = useTranslation();

  const ownersLink = getWhatsAppLink({
    context: 'owner',
    url: `${window.location.origin}${i18n.language.startsWith('en') ? '/en' : ''}/propietarios`
  });

  return (
    <div className="w-full bg-[#050505] flex flex-col relative overflow-x-hidden">
      <Helmet>
        <title>{t('owners_page.seo.title')}</title>
        <meta name="description" content={t('owners_page.seo.description')} />
        <meta property="og:title" content={t('owners_page.seo.og_title')} />
        <meta property="og:image" content="https://gelaberthomes.es/logo-og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://gelaberthomes.es/logo-og.png" />
        <link rel="alternate" hrefLang="es" href="https://gelaberthomes.es/propietarios" />
        <link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/propietarios" />
        <link rel="alternate" hrefLang="x-default" href="https://gelaberthomes.es/propietarios" />
      </Helmet>

      {/* Hero & Form Section */}
      <div className="w-full min-h-screen flex flex-col lg:flex-row relative">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Imagen: Villa de lujo con fachada blanca, piscina y palmeras — estilo mediterráneo premium */}
          <img 
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-75 brightness-[1.0] saturate-[1.4] contrast-[1.1] scale-105"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#050505]/90 via-[#050505]/40 to-[#050505]/70" />
        </div>

        {/* Background Mesh */}
        <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none z-[1]" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#C9A962]/5 blur-[120px] rounded-full mix-blend-screen z-[1]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#C9A962]/3 blur-[100px] rounded-full mix-blend-screen z-[1]" />

        {/* Left Content */}
        <div className="flex-1 relative z-10 pt-20 pb-12 px-6 md:p-16 lg:p-24 flex flex-col justify-center">
          <motion.div {...(fadeUp as any)} className="max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-4 h-4 text-[#C9A962]" />
              <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.4em] font-bold">
                {t('owners_page.hero.badge')}
              </span>
            </div>
            
            <h1 className="font-secondary text-5xl md:text-7xl text-white mb-8 leading-[1.1]">
              {t('owners_page.hero.title_1')}<br />
              <span className="italic text-[#C9A962] font-light">
                {t('owners_page.hero.title_2')}
              </span>
            </h1>

            <p className="font-primary text-lg text-white/50 font-light mb-12 leading-relaxed">
              {t('owners_page.hero.description')}
            </p>

            <div className="space-y-6 mb-12">
              {[
                'valuation',
                'promotion',
                'legal'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-4 group">
                  <div className="w-6 h-6 rounded-full border border-[#C9A962]/30 flex items-center justify-center group-hover:bg-[#C9A962]/10 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A962]" />
                  </div>
                  <span className="font-primary text-sm text-white/80 uppercase tracking-widest group-hover:text-white transition-colors">
                    {t(`owners_page.hero.features.${feature}`)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <WhatsAppButton 
                phoneNumber="34611898827" 
                href={ownersLink}
                label={t('owners_page.hero.whatsapp_label')}
              />
            </div>
          </motion.div>
        </div>

        {/* Right Form Area */}
        <div className="flex-1 relative z-10 pb-20 px-6 lg:p-14 flex items-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full max-w-2xl mx-auto glass shadow-2xl overflow-hidden"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#C9A962] to-transparent opacity-40" />
            <div className="p-8 md:p-12 bg-black/40 backdrop-blur-xl">
              <PropertyContactForm />
              {/* RGPD / Protección de datos */}
              <div className="mt-6 pt-5 border-t border-white/5">
                <p className="font-primary text-[10px] text-white/25 leading-relaxed">
                  <span className="text-[#C9A962]/50 font-bold uppercase tracking-wider">{t('owners_page.legal.title')} · </span>
                  <strong className="text-white/30">{t('owners_page.legal.responsible')}:</strong> Gelabert Homes Real Estate.{' '}
                  <strong className="text-white/30">{t('owners_page.legal.purpose')}:</strong> {t('owners_page.legal.purpose_text')}{' '}
                  <strong className="text-white/30">{t('owners_page.legal.legitimation')}:</strong> {t('owners_page.legal.legitimation_text')}{' '}
                  <strong className="text-white/30">{t('owners_page.legal.recipients')}:</strong> {t('owners_page.legal.recipients_text')}{' '}
                  <strong className="text-white/30">{t('owners_page.legal.rights')}:</strong>{' '}
                  <a href="mailto:info@gelaberthomes.es" className="text-[#C9A962]/40 hover:text-[#C9A962]/70 transition-colors underline underline-offset-2">
                    info@gelaberthomes.es
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Marketing & Technology Section */}
      <section className="w-full bg-[#0A0A0A] py-24 md:py-32 relative z-10 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 md:px-14">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold block mb-4">
              {t('owners_page.marketing.badge')}
            </span>
            <h2 className="font-secondary text-4xl md:text-5xl text-white mb-6">
              {t('owners_page.marketing.title_1')} <span className="italic text-[#C9A962]">{t('owners_page.marketing.title_2')}</span>
            </h2>
            <p className="font-primary text-white/50 text-lg font-light leading-relaxed">
              {t('owners_page.marketing.subtitle')}
            </p>
          </motion.div>

          {/* Technology Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {/* Drone */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative h-[400px] overflow-hidden bg-black border border-white/10"
            >
              <img 
                src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1000&auto=format&fit=crop" 
                alt="Drone Photography"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="w-10 h-10 rounded-full border border-[#C9A962]/40 flex items-center justify-center mb-4 bg-black/40 backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-[#C9A962]" />
                </div>
                <h3 className="font-secondary text-2xl text-white mb-2">{t('owners_page.marketing.tech_drone')}</h3>
                <p className="font-primary text-sm text-white/60">{t('owners_page.marketing.tech_drone_desc')}</p>
              </div>
            </motion.div>

            {/* 360 Tour */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative h-[400px] overflow-hidden bg-black border border-white/10"
            >
              <img 
                src="https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=1000&auto=format&fit=crop" 
                alt="360 Virtual Tour"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="w-10 h-10 rounded-full border border-[#C9A962]/40 flex items-center justify-center mb-4 bg-black/40 backdrop-blur-md">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A962]" />
                </div>
                <h3 className="font-secondary text-2xl text-white mb-2">{t('owners_page.marketing.tech_360')}</h3>
                <p className="font-primary text-sm text-white/60">{t('owners_page.marketing.tech_360_desc')}</p>
              </div>
            </motion.div>

            {/* Photography */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative h-[400px] overflow-hidden bg-black border border-white/10"
            >
              <img 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop" 
                alt="Professional Photography"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="w-10 h-10 rounded-full border border-[#C9A962]/40 flex items-center justify-center mb-4 bg-black/40 backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-[#C9A962]" />
                </div>
                <h3 className="font-secondary text-2xl text-white mb-2">{t('owners_page.marketing.tech_photo')}</h3>
                <p className="font-primary text-sm text-white/60">{t('owners_page.marketing.tech_photo_desc')}</p>
              </div>
            </motion.div>
          </div>

          {/* Portals Section */}
          <div className="border border-white/5 bg-[#0F0F0F] p-10 md:p-16 flex flex-col items-center">
            <h3 className="font-primary text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold mb-14 text-center">
              {t('owners_page.marketing.portals_title')}
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">

              {/* Idealista — orange wordmark */}
              <div className="group cursor-default opacity-50 hover:opacity-100 transition-opacity duration-300">
                <svg viewBox="0 0 160 40" className="h-8 md:h-10 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" fill="#FF6544" letterSpacing="-0.5">idealista</text>
                </svg>
              </div>

              {/* Fotocasa — red wordmark */}
              <div className="group cursor-default opacity-50 hover:opacity-100 transition-opacity duration-300">
                <svg viewBox="0 0 170 40" className="h-8 md:h-10 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" fill="#EF3E36" letterSpacing="-0.5">fotocasa</text>
                </svg>
              </div>

              {/* Habitaclia — orange wordmark */}
              <div className="group cursor-default opacity-50 hover:opacity-100 transition-opacity duration-300">
                <svg viewBox="0 0 210 40" className="h-8 md:h-10 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" fill="#FF6B00" letterSpacing="-0.5">habitaclia</text>
                </svg>
              </div>

              {/* Pisos.com — blue wordmark */}
              <div className="group cursor-default opacity-50 hover:opacity-100 transition-opacity duration-300">
                <svg viewBox="0 0 160 40" className="h-8 md:h-10 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="900" fill="#1A56DB" letterSpacing="-0.5">pisos.com</text>
                </svg>
              </div>

              {/* Yaencontre — orange wordmark */}
              <div className="group cursor-default opacity-50 hover:opacity-100 transition-opacity duration-300">
                <svg viewBox="0 0 240 40" className="h-8 md:h-10 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" fill="#FF5A00" letterSpacing="-0.5">yaencontre</text>
                </svg>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

