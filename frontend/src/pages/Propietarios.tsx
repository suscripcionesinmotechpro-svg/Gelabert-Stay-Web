import { motion } from 'framer-motion';
import { PropertyContactForm } from '../components/PropertyContactForm';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { getWhatsAppLink } from '../utils/whatsapp';
import { 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Camera, 
  Megaphone, 
  UsersRound, 
  BarChart3, 
  Shield, 
  Phone, 
  ClipboardList, 
  Handshake, 
  FileText, 
  Key, 
  Check, 
  Gem 
} from 'lucide-react';

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
          {/* Imagen original: Villa mediterránea premium con jardín y detalles arquitectónicos elegantes */}
          <img 
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-80 brightness-[0.95] saturate-[1.3] contrast-[1.05] scale-105"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#050505]/90 via-[#050505]/40 to-[#050505]/65" />
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

        {/* Scroll Indicator - Shows a floating scroll-down cue on desktop to guide owners down */}
        <div 
          className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-2 cursor-pointer group pointer-events-auto select-none"
          onClick={() => document.getElementById('why-choose')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="font-primary text-[10px] uppercase tracking-[0.25em] text-[#C9A962] font-semibold opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            {t('owners_page.hero.discover_tech_label', 'Nuestra Estrategia')}
          </span>
          <motion.div 
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border border-[#C9A962]/40 flex justify-center p-1 group-hover:border-[#C9A962] transition-colors duration-300"
          >
            <div className="w-1.5 h-1.5 bg-[#C9A962] rounded-full" />
          </motion.div>
        </div>
      </div>

      {/* SECTION 1: Why Choose Gelabert Homes & Objective Section */}
      <section id="why-choose" className="w-full bg-[#050505] py-12 md:py-16 relative z-10 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 md:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            
            <div className="lg:col-span-7 flex flex-col justify-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold block mb-4">
                  {t('owners_page.why.badge')}
                </span>
                <h2 className="font-secondary text-4xl md:text-5xl text-white mb-6 leading-tight">
                  {t('owners_page.why.title_1')} <span className="italic text-[#C9A962]">{t('owners_page.why.title_2')}</span>
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  'f1', 'f2', 'f3', 'f4', 'f5', 'f6'
                ].map((featureKey, idx) => (
                  <motion.div
                    key={featureKey}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className="flex items-start gap-4 p-4 border border-white/5 hover:border-[#C9A962]/20 hover:bg-[#C9A962]/5 transition-all duration-300 group rounded-sm"
                  >
                    <div className="mt-1 w-5 h-5 rounded-full border border-[#C9A962]/30 flex items-center justify-center flex-shrink-0 group-hover:border-[#C9A962] group-hover:bg-[#C9A962]/10 transition-colors">
                      <Check className="w-3 h-3 text-[#C9A962]" />
                    </div>
                    <p className="font-primary text-sm text-white/60 leading-relaxed font-light group-hover:text-white/80 transition-colors">
                      {t(`owners_page.why.${featureKey}`)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex items-stretch">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-full bg-[#0C0C0C] border border-[#C9A962]/20 p-8 md:p-12 rounded-sm flex flex-col justify-between relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A962]/10 blur-3xl pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C9A962]/5 blur-3xl pointer-events-none rounded-full" />

                <div>
                  <div className="w-14 h-14 rounded-full border border-[#C9A962]/30 flex items-center justify-center mb-10 bg-black shadow-[0_0_15px_rgba(201,169,98,0.1)] group-hover:border-[#C9A962] transition-colors duration-500">
                    <Gem className="w-6 h-6 text-[#C9A962]" />
                  </div>
                  
                  <span className="font-primary text-[10px] text-[#C9A962] uppercase tracking-[0.4em] font-bold block mb-4">
                    {t('owners_page.why.objective_badge')}
                  </span>
                  
                  <h3 className="font-secondary text-3xl md:text-4xl text-white leading-snug italic font-light">
                    &ldquo;{t('owners_page.why.objective_title')}&rdquo;
                  </h3>
                </div>

                <div className="mt-14 pt-8 border-t border-white/5 flex items-center justify-between">
                  <span className="font-secondary text-xs uppercase tracking-[0.2em] text-white/30 font-semibold">
                    Gelabert Homes Real Estate
                  </span>
                  <div className="w-8 h-[1px] bg-[#C9A962]/40" />
                </div>
              </motion.div>
            </div>
            
          </div>
        </div>
      </section>

      {/* SECTION 2: 6 Strategic Pillars Section */}
      <section id="strategic-pillars" className="w-full bg-[#050505] py-12 md:py-16 relative z-10 border-t border-white/5">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C9A962]/3 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-6 md:px-14">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold block mb-4">
              {t('owners_page.pillars.badge')}
            </span>
            <h2 className="font-secondary text-4xl md:text-5xl text-white mb-6 leading-tight">
              {t('owners_page.pillars.title_1')} <span className="italic text-[#C9A962]">{t('owners_page.pillars.title_2')}</span>
            </h2>
            <p className="font-primary text-white/50 text-lg font-light leading-relaxed">
              {t('owners_page.pillars.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { key: 'p1', icon: TrendingUp },
              { key: 'p2', icon: Camera },
              { key: 'p3', icon: Megaphone },
              { key: 'p4', icon: UsersRound },
              { key: 'p5', icon: BarChart3 },
              { key: 'p6', icon: Shield }
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.key}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="group relative bg-[#0C0C0C] border border-white/5 p-8 hover:border-[#C9A962]/30 transition-all duration-500 rounded-sm hover:-translate-y-1 overflow-hidden"
                >
                  {/* Top accent line on hover */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A962] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Large background number */}
                  <span className="absolute top-4 right-5 font-secondary text-6xl text-white/[0.04] select-none group-hover:text-[#C9A962]/[0.07] transition-colors duration-500 leading-none">
                    0{idx + 1}
                  </span>

                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-11 h-11 rounded-sm border border-[#C9A962]/20 flex items-center justify-center bg-black/40 group-hover:border-[#C9A962]/60 group-hover:bg-[#C9A962]/5 transition-all duration-500 flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#C9A962] transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <h3 className="font-secondary text-xl text-white group-hover:text-[#C9A962] transition-colors duration-300">
                      {t(`owners_page.pillars.${pillar.key}_title`)}
                    </h3>
                  </div>

                  <p className="font-primary text-sm text-white/50 leading-relaxed font-light group-hover:text-white/70 transition-colors duration-300">
                    {t(`owners_page.pillars.${pillar.key}_desc`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: Marketing & Technology Section */}
      <section id="marketing-tech" className="w-full bg-[#050505] py-12 md:py-16 relative z-10 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 md:px-14">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-12"
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

          {/* Technology Cards — tall portrait cards with real matching images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">

            {/* ── FOTOGRAFÍA PROFESIONAL ── real estate interior shoot */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative h-[460px] overflow-hidden bg-black border border-white/10 hover:border-[#C9A962]/30 transition-colors duration-500"
            >
              {/* Professional real-estate interior photography */}
              <img 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop" 
                alt="Fotografía Profesional de Inmuebles"
                className="w-full h-full object-cover object-center opacity-65 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
              {/* Top label chip */}
              <div className="absolute top-5 left-5">
                <span className="font-primary text-[9px] uppercase tracking-[0.3em] text-[#C9A962] bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-[#C9A962]/30">01</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="w-10 h-10 rounded-sm border border-[#C9A962]/40 flex items-center justify-center mb-4 bg-black/40 backdrop-blur-md">
                  <Camera className="w-4 h-4 text-[#C9A962]" />
                </div>
                <h3 className="font-secondary text-2xl text-white mb-3 leading-tight">{t('owners_page.marketing.tech_photo')}</h3>
                <p className="font-primary text-sm text-white/60 leading-relaxed">{t('owners_page.marketing.tech_photo_desc')}</p>
              </div>
            </motion.div>

            {/* ── VÍDEO AÉREO CON DRON ── real aerial coastline shot */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative h-[460px] overflow-hidden bg-black border border-white/10 hover:border-[#C9A962]/30 transition-colors duration-500"
            >
              {/* Aerial drone coastline — genuinely represents drone footage over Mediterranean */}
              <img 
                src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1000&auto=format&fit=crop" 
                alt="Vídeo Aéreo con Dron"
                className="w-full h-full object-contain object-center opacity-65 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
              <div className="absolute top-5 left-5">
                <span className="font-primary text-[9px] uppercase tracking-[0.3em] text-[#C9A962] bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-[#C9A962]/30">02</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="w-10 h-10 rounded-sm border border-[#C9A962]/40 flex items-center justify-center mb-4 bg-black/40 backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-[#C9A962]" />
                </div>
                <h3 className="font-secondary text-2xl text-white mb-3 leading-tight">{t('owners_page.marketing.tech_drone')}</h3>
                <p className="font-primary text-sm text-white/60 leading-relaxed">{t('owners_page.marketing.tech_drone_desc')}</p>
              </div>
            </motion.div>

            {/* ── TOUR VIRTUAL 360º ── VR / immersive tour */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative h-[460px] overflow-hidden bg-black border border-white/10 hover:border-[#C9A962]/30 transition-colors duration-500"
            >
              {/* VR headset / immersive virtual-tour technology */}
              <img 
                src="https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=1000&auto=format&fit=crop" 
                alt="Tour Virtual 360º"
                className="w-full h-full object-contain object-center opacity-65 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
              <div className="absolute top-5 left-5">
                <span className="font-primary text-[9px] uppercase tracking-[0.3em] text-[#C9A962] bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-[#C9A962]/30">03</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="w-10 h-10 rounded-sm border border-[#C9A962]/40 flex items-center justify-center mb-4 bg-black/40 backdrop-blur-md">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A962]" />
                </div>
                <h3 className="font-secondary text-2xl text-white mb-3 leading-tight">{t('owners_page.marketing.tech_360')}</h3>
                <p className="font-primary text-sm text-white/60 leading-relaxed">{t('owners_page.marketing.tech_360_desc')}</p>
              </div>
            </motion.div>

          </div>

          {/* Portals Section */}
          <div className="border border-white/5 bg-[#0F0F0F] p-10 md:p-16 flex flex-col items-center">
            <h3 className="font-primary text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold mb-8 text-center">
              {t('owners_page.marketing.portals_title')}
            </h3>
            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-wrap justify-center items-center gap-10 md:gap-14">

                {/* Idealista */}
                <a href="https://www.idealista.com" target="_blank" rel="noopener noreferrer"
                  className="group opacity-85 hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <svg viewBox="0 0 555 160" className="h-6 md:h-8 w-auto fill-[#c5e600] transition-colors duration-300" aria-label="Idealista">
                    <path d="M90,115 L90,70 L60,70 L60,55 L90,55 L90,25 L105,25 L105,130 L90,130 L60,130 L60,115 L90,115 Z M465,55 L480,55 L480,70 L465,70 L465,115 L450,115 L450,70 L435,70 L435,55 L450,55 L450,25 L465,25 L465,55 Z M345,70 L345,130 L330,130 L330,70 L315,70 L315,55 L345,55 L345,70 Z M30,70 L30,130 L15,130 L15,70 L0,70 L0,55 L30,55 L30,70 Z M240,115 L240,100 L210,100 L210,85 L240,85 L240,70 L255,70 L255,130 L240,130 L210,130 L210,115 L240,115 Z M540,115 L540,100 L510,100 L510,85 L540,85 L540,70 L555,70 L555,130 L540,130 L510,130 L510,115 L540,115 Z M165,100 L135,100 L135,115 L120,115 L120,70 L135,70 L135,85 L165,85 L165,70 L180,70 L180,100 L165,100 Z M300,40 L300,130 L285,130 L285,40 L270,40 L270,25 L300,25 L300,40 Z M375,55 L420,55 L420,70 L375,70 L375,55 Z M360,70 L375,70 L375,85 L360,85 L360,70 Z M375,85 L405,85 L405,100 L375,100 L375,85 Z M405,100 L420,100 L420,115 L405,115 L405,100 Z M360,115 L405,115 L405,130 L360,130 L360,115 Z M135,115 L165,115 L165,130 L135,130 L135,115 Z M135,55 L165,55 L165,70 L135,70 L135,55 Z M510,55 L540,55 L540,70 L510,70 L510,55 Z M495,100 L510,100 L510,115 L495,115 L495,100 Z M210,55 L240,55 L240,70 L210,70 L210,55 Z M195,100 L210,100 L210,115 L195,115 L195,100 Z M15,25 L30,25 L30,40 L15,40 L15,25 Z M330,25 L345,25 L345,40 L330,40 L330,25 Z M465,115 L480,115 L480,130 L465,130 L465,115 Z M45,70 L60,70 L60,115 L45,115 L45,70 Z" />
                  </svg>
                </a>

                {/* Fotocasa */}
                <a href="https://www.fotocasa.es" target="_blank" rel="noopener noreferrer"
                  className="group opacity-85 hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <svg viewBox="0 0 98 14" className="h-6 md:h-8 w-auto transition-colors duration-300" aria-label="Fotocasa">
                    <path d="M7,0 C10.87,0 14,3.13 14,7 C14,10.87 10.87,14 7,14 C5.28,14 3.71,13.38 2.5,12.35 L0,14 L0.65,11.5 C0.25,10.15 0,8.71 0,7 C0,3.13 3.13,0 7,0 Z" fill="#30c3b0" />
                    <path d="M7,3.5 L3.5,7 L4.5,7 L4.5,10.5 L6,10.5 L6,8.5 L8,8.5 L8,10.5 L9.5,10.5 L9.5,7 L10.5,7 Z" fill="#ffffff" />
                    <g transform="translate(18, 0)" fill="#ffffff">
                      <path d="M1.7 14V6.2H0V4.1h1.7v-.5c0-1.5.3-2.3 1.1-3A5 5 0 0 1 5.3 0h1.1v2.1h-1c-.9 0-1.3.3-1.3 1.3v.7h2v2.1H4V14H1.7m4.7-5.3A5 5 0 0 1 8 4.9c1-1 2.3-1.6 3.9-1.6a5.4 5.4 0 0 1 3.8 9.2c-1 1-2.3 1.5-3.8 1.5a5.4 5.4 0 0 1-5.5-5.3m7.7 2.2a3 3 0 0 0 .9-2.2 3 3 0 0 0-1-2.3 3 3 0 0 0-2.1-.9 3 3 0 0 0-2.3 1c-.5.5-.8 1.3-.8 2.2 0 .9.3 1.6.8 2.2a3 3 0 0 0 2.3 1 3 3 0 0 0 2.2-1Zm5.2-5H18V3.8h1.3V0h2.3v3.8h2.1v2.1h-2.1v4.5c0 1 .3 1.5 1.2 1.5l.8-.1v2c-.3.2-.7.2-1.2.2-2.1 0-3.1-1.1-3.1-3.4V6Zm5.4 2.8a5 5 0 0 1 1.6-3.8c1-1 2.3-1.6 3.8-1.6a5.4 5.4 0 0 1 3.9 9.2c-1 1-2.3 1.5-3.9 1.5a5.4 5.4 0 0 1-5.4-5.3m7.6 2.2a3 3 0 0 0 1-2.2 3 3 0 0 0-1-2.3 3 3 0 0 0-2.2-.9 3 3 0 0 0-2.2 1c-.6.5-.9 1.3-.9 2.2 0 .9.3 1.6 1 2.2a3 3 0 0 0 2.1 1 3 3 0 0 0 2.2-1ZM46 5.1l-1.4 1.5A3.4 3.4 0 0 0 42 5.5a3 3 0 0 0-2.2.9c-.6.6-.9 1.4-.9 2.3 0 .9.3 1.6.9 2.2a3 3 0 0 0 2.2 1c1 0 1.9-.4 2.6-1.2l1.4 1.6a5.3 5.3 0 0 1-4 1.7c-1.5 0-2.8-.5-3.9-1.5a5 5 0 0 1-1.6-3.8 5 5 0 0 1 1.6-3.8c1-1 2.4-1.6 3.9-1.6a5 5 0 0 1 4 1.8Zm8.7-.1V3.5h2.4v7c0 .9.2 1.2.8 1.2h.5v1.9l-1.2.1c-.6 0-1 0-1.4-.3a2 2 0 0 1-.8-1.2c-.7 1-1.9 1.6-3.5 1.6-1.4 0-2.6-.5-3.6-1.5s-1.4-2.3-1.4-3.8.5-2.7 1.4-3.7a5 5 0 0 1 3.6-1.5c1.6 0 2.9.7 3.2 1.7Zm-.7 5.7a3 3 0 0 0 1-2.2c0-.8-.4-1.6-1-2.1a3 3 0 0 0-2.2-1c-.8 0-1.5.4-2 1a3 3 0 0 0-1 2.1 3 3 0 0 0 1 2.2c.5.6 1.2.9 2 .9a3 3 0 0 0 2.2-.9Zm6.6 0a3 3 0 0 0 2.6 1.2c1.2 0 1.7-.5 1.7-1 0-.4-.2-.7-.6-.9l-.9-.4-1.2-.4c-1.5-.6-2.4-1.4-2.4-2.8 0-1 .3-1.7 1-2.3.7-.5 1.5-.8 2.5-.8 1.4 0 2.4.5 3.1 1.5l-1.3 1.4c-.4-.5-1-.8-1.9-.8-.7 0-1.1.4-1.1.9 0 .3.1.5.4.7l.8.4 1.2.4c1.8.6 2.6 1.5 2.6 3 0 1.9-1.3 3.2-4 3.2-2 0-3.4-.8-4-2l1.5-1.4ZM76.3 5V3.5h2.4v7c0 .9.2 1.2.8 1.2h.5v1.9l-1.2.1c-.6 0-1 0-1.4-.3-.5-.3-.7-.7-.8-1.2-.7 1-1.9 1.6-3.5 1.6-1.4 0-2.6-.5-3.6-1.5s-1.4-2.3-1.4-3.8.5-2.7 1.4-3.7a5 5 0 0 1 3.6-1.5c1.6 0 2.9.7 3.2 1.7Zm-.7 5.7a3 3 0 0 0 1-2.2c0-.8-.4-1.6-1-2.1a3 3 0 0 0-2.2-1c-.8 0-1.5.4-2 1a3 3 0 0 0-1 2.1c0 .9.3 1.6 1 2.2.5.6 1.2.9 2 .9a3 3 0 0 0 2.2-.9Z" />
                    </g>
                  </svg>
                </a>

                {/* Habitaclia */}
                <a href="https://www.habitaclia.com" target="_blank" rel="noopener noreferrer"
                  className="group opacity-85 hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <svg viewBox="0 0 425.1 110.6" className="h-6 md:h-8 w-auto fill-[#f60] transition-colors duration-300" aria-label="Habitaclia">
                    <g>
                      <path d="m87.9 21.8c-8.1 0-16.1 2.1-20.7 4l3.5 9.5c3.9-1.7 10.4-3.3 15.6-3.3 6.4 0 10.5 2.2 10.5 8v2.9c-16.9.9-32.7 3.9-32.7 19.2 0 11.4 8.4 18 25.2 18 8.4 0 16.8-1.9 20.9-4v-34.4c-.1-14.3-8-19.9-22.3-19.9zm8.9 47.1c-1.4.6-5 1.1-8 1.1-7.4 0-11.5-3-11.5-8.3 0-8.4 9.1-9.3 19.5-9.8z"/>
                      <path d="m142.9 22.3c-3.3 0-7.4.7-9.8 1.9v-24.2h-14.1v76.1c4.6 2.2 12 4 19.8 4 17.8 0 28.5-9.7 28.5-30.7 0-17-9.9-27.1-24.4-27.1zm-3.3 46.7c-2.6 0-5.2-.5-6.5-1.1v-33.4c1.8-.8 4.6-1.5 7.1-1.5 8 0 12.8 6.5 12.8 17.5.1 12.4-5.3 18.5-13.4 18.5z"/>
                      <path d="m57.5 78.9h-14.2v-28.3c0-11-5.5-17.5-13.4-17.5-2.6 0-5.4.6-7.2 1.5v44.3h-14.1v-78.9h14.1v24.2c2.5-1.1 6.5-1.9 9.8-1.9 14.5 0 24.9 10 24.9 27.1v29.5z"/>
                      <path d="m182.7 15.3c-4.4 0-8.1-3.4-8.1-7.7 0-4.2 3.6-7.6 8.1-7.6s8.1 3.3 8.1 7.6-3.7 7.7-8.1 7.7"/>
                      <path d="m175.7 23h14.1v55.8h-14.1z"/>
                      <path d="m201 23v-16.4h14.1v16.4h10.2v10.6h-10.2v27.6c0 4.6 2.6 6.1 6.2 6.1 1.5 0 3.1-.4 4-.8v11.7c-1.7.8-5.1 1.5-8.5 1.5-10.8 0-15.8-5.9-15.8-17.6z"/>
                      <path d="m255.6 21.8c-8.1 0-16 2.1-20.7 4l3.5 9.5c3.9-1.7 10.4-3.3 15.6-3.3 6.4 0 10.5 2.2 10.5 8v2.9c-16.9.9-32.7 3.9-32.7 19.2 0 11.4 8.4 18 25.2 18 8.4 0 16.8-1.9 20.9-4v-34.4c0-14.3-8-19.9-22.3-19.9zm8.9 47.1c-1.4.6-5 1.1-8 1.1-7.4 0-11.5-3-11.5-8.3 0-8.4 9.1-9.3 19.5-9.8z"/>
                      <path d="m310.3 80.1c-13.1 0-25-9.3-25-29.2s11.9-29.1 25-29.1c6.6 0 11.3 1.4 14.8 3.8l-4.5 10.2c-2.1-1.6-5.1-2.4-8.3-2.4-7 0-12.4 5.8-12.4 17.4s5.7 17.4 12.4 17.4c3.2 0 6.2-.9 8.3-2.5l4.5 10.6c-3.6 2.4-8.2 3.8-14.8 3.8"/>
                      <path d="m331.7 0h14.1v78.9h-14.1z"/>
                      <path d="m363.8 15.3c-4.4 0-8.1-3.4-8.1-7.7 0-4.2 3.6-7.6 8.1-7.6s8.1 3.3 8.1 7.6-3.6 7.7-8.1 7.7"/>
                      <path d="m356.8 23h14.1v55.8h-14.1z"/>
                      <path d="m402.2 21.8c-8.1 0-16.1 2.1-20.7 4l3.5 9.5c3.9-1.7 10.4-3.3 15.6-3.3 6.4 0 10.5 2.2 10.5 8v2.9c-16.9.9-32.7 3.9-32.7 19.2 0 11.4 8.4 18 25.2 18 8.4 0 17.4-1.9 21.5-4v-34.4c0-14.3-8.6-19.9-22.9-19.9zm8.9 47.1c-1.5.6-5 1.1-8 1.1-7.3 0-11.5-3-11.5-8.3 0-8.4 9.1-9.3 19.5-9.8z"/>
                      <path d="m31.7 99.7c5.4 0 10.4-.8 15.1-2.4s9-3.9 12.9-6.7l3.7 8.6c-4.2 3.5-9.1 6.3-14.4 8.4-5.4 2-11.1 3.1-17.3 3.1-6.1 0-11.9-1-17.3-3.1s-10.2-4.8-14.4-8.4l3.7-8.6c3.9 2.9 8.2 5.1 12.9 6.7s9.7 2.4 15.1 2.4"/>
                    </g>
                  </svg>
                </a>

                {/* Pisos.com */}
                <a href="https://www.pisos.com" target="_blank" rel="noopener noreferrer"
                  className="group opacity-85 hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <svg viewBox="0 0 90.63 43.09" className="h-8 md:h-10 w-auto transition-colors duration-300" aria-label="Pisos.com">
                    <g>
                      <path fill="#001689" d="M0,32.36V7.46H4.52l.32,2.21a6.58,6.58,0,0,1,5.74-2.52c5.08,0,8.55,3.57,8.55,9,0,5.6-3.54,9-8.62,9a6.88,6.88,0,0,1-5.43-2.45v9.7ZM14,16.11a4.12,4.12,0,0,0-4.24-4.45c-2.28,0-4.66,1.16-4.66,4.45a4.43,4.43,0,0,0,4.66,4.45A4.12,4.12,0,0,0,14,16.11Z"/>
                      <path fill="#001689" d="M27.81,2.84c0,3.78-5.74,3.78-5.74,0S27.81-.95,27.81,2.84ZM22.41,7.39V24.73h5V7.39Z"/>
                      <path fill="#001689" d="M42.62,12.33a6.61,6.61,0,0,0-4.1-1.26c-1.65,0-2.49.6-2.49,1.44S36.91,14,38.59,14c3.4.1,7.5.81,7.53,5.57,0,2.8-2.07,5.81-7.57,5.81a11.74,11.74,0,0,1-8.13-2.94l2.17-3.57a9.25,9.25,0,0,0,6,2.17c1.47,0,2.63-.56,2.59-1.47s-.6-1.47-2.94-1.54C35.06,17.9,31,16.57,31,12.5s3.71-5.57,7.46-5.57a9.56,9.56,0,0,1,6.62,2.24Z"/>
                      <path fill="#001689" d="M48.12,16.11c0-5.22,3.71-9.07,9.46-9.07s9.49,3.85,9.49,9.07-3.61,9-9.49,9S48.12,21.33,48.12,16.11Zm13.83,0a4.36,4.36,0,1,0-8.72,0,4.22,4.22,0,0,0,4.34,4.52C60.66,20.63,62,18.39,62,16.11Z"/>
                      <path fill="#001689" d="M81.21,12.33a6.61,6.61,0,0,0-4.1-1.26c-1.65,0-2.49.6-2.49,1.44S75.51,14,77.19,14c3.4.1,7.5.81,7.53,5.57,0,2.8-2.07,5.81-7.57,5.81A11.74,11.74,0,0,1,69,22.45l2.17-3.57a9.25,9.25,0,0,0,6,2.17c1.47,0,2.63-.56,2.59-1.47s-.6-1.47-2.94-1.54c-3.22-.14-7.25-1.47-7.25-5.53s3.71-5.57,7.46-5.57A9.56,9.56,0,0,1,83.7,9.18Z"/>
                      <path fill="#3ab5e9" d="M50.75,40.86a1.81,1.81,0,0,1-.09.6,2.38,2.38,0,0,1-.6,1,2.14,2.14,0,0,1-.85.54,1.37,1.37,0,0,1-1,0,1.4,1.4,0,0,1-.73-1.27A2.29,2.29,0,0,1,48,40.24a1.69,1.69,0,0,1,.59-.5,1.59,1.59,0,0,1,2,.61A1.55,1.55,0,0,1,50.75,40.86Z"/>
                      <path fill="#3ab5e9" d="M62.19,36.79a1.11,1.11,0,0,0-.2.4c-.06.16-.15.27-.27.27s-.13,0-.13-.06,0,0,0,0,0,.1,0,.13,0,0,.1,0h.26a1.12,1.12,0,0,0-.18.3.33.33,0,0,0,0,.29c-.18.17,0,.72-.24.89s-.28.29-.5.47a.84.84,0,0,1-.33.14c-.17,0-.24.2-.33.33a4.5,4.5,0,0,1-.89.75c-.55.45-1,1-1.64,1.37a6.17,6.17,0,0,1-1.68.72,3.48,3.48,0,0,1-3.14-.48,3.86,3.86,0,0,1-1.41-2.91,12.56,12.56,0,0,1,.19-2.59,15.32,15.32,0,0,1,3.21-6.46,2.89,2.89,0,0,1,1.6-1.11,2.34,2.34,0,0,1,2.1,1,3.15,3.15,0,0,1,.76,1.94c0,.66,0,1.77-.59,2.2s-1,0-1.28-.42a2.72,2.72,0,0,1-.31-.72c0-.12-.06-.33-.19-.38-.42-.17-1,.65-1.22.93A8,8,0,0,0,54.75,36a12.9,12.9,0,0,0-.79,3,1.54,1.54,0,0,0,.3,1.32,1.94,1.94,0,0,0,1.82.26,6.9,6.9,0,0,0,2.58-1.45,9.53,9.53,0,0,1,1.12-.83c.44-.26.92-.45,1.35-.73a11.85,11.85,0,0,1,1.22-.71Z"/>
                      <path fill="#3ab5e9" d="M90.56,38.42c.12.14,0,.46.06.7.12.62-.65,1-1.12,1.19a4.84,4.84,0,0,1-1.72.27,3.37,3.37,0,0,1-2.1-.37A4.41,4.41,0,0,1,84,37c-.07-.37,0-.42-.31-.73a.32.32,0,0,0-.42-.09,8.56,8.56,0,0,0-1.75,2.45,9.87,9.87,0,0,1-2.16,2.57,1.7,1.7,0,0,1-1.77.19,4.11,4.11,0,0,1-1.08-.71,2.15,2.15,0,0,1-.51-2c.09-.79.24-1.58.38-2.36.07-.35.5-1.63,0-1.85s-.88.83-1,1.06c-.45.81-1,1.54-1.49,2.31-.41.62-.72,1.32-1.09,2q-.38.66-.8,1.31a2.62,2.62,0,0,1-.92,1.06,1.35,1.35,0,0,1-1.81-.85,5.92,5.92,0,0,1,.06-3.11q.34-1.52.69-3c.5-2.16,1-5.24,1.5-7.39a1.17,1.17,0,0,1,1-.91c2.67-.35,1.19,4.83.88,6.07a3.76,3.76,0,0,0-.23,1,.34.34,0,0,0,.15.28.4.4,0,0,0,.48-.16,26,26,0,0,0,1.5-2.47c.34-.57.68-1.43,1.29-1.76,1-.55,2.41.44,2.92,1.29.81,1.35-.13,3.93-.46,5.34,0,.18-.22.74,0,.74s.86-.75,1-.92c.62-.81,1.5-2.33,2.09-3.16a8.16,8.16,0,0,1,1.6-2.13c.54-.34,1,0,1.52.2.17.07.35.11.51.18a2.2,2.2,0,0,1,1,2.21A22.47,22.47,0,0,0,86.7,38a1.11,1.11,0,0,0,1.27,1,5.62,5.62,0,0,0,1.2-.17,9.64,9.64,0,0,1,1.1-.42C90.42,38.34,90.51,38.36,90.56,38.42Z"/>
                      <path fill="#3ab5e9" d="M69.31,35.2a5.36,5.36,0,0,1-.08.73,9,9,0,0,1-2.54,4.49l-1.1,1.09L65,42.1a3.18,3.18,0,0,1-.61.57,2.82,2.82,0,0,1-4-1.13,1.68,1.68,0,0,0-.26-.44,1.9,1.9,0,0,1-.45-1,3.89,3.89,0,0,1,.08-1.53,12.38,12.38,0,0,1,2.45-5.31c.14-.17,1.58-1.93,1.05-2-.15,0-.45.08-.48-.16a1.2,1.2,0,0,1,.25-.62,2.33,2.33,0,0,1,.93-.79,4.78,4.78,0,0,1,1.16-.48,1.67,1.67,0,0,1,1.5.61c.19.19.36.41.53.62s.44.36.62.57A6,6,0,0,1,69.31,35.2Zm-2.52-1.05a2.77,2.77,0,0,0-.35-1,.55.55,0,0,0-1,0,9.45,9.45,0,0,1-.74,1.16,13.4,13.4,0,0,0-1,2c-.42,1-.84,1.92-1.21,2.89-.08.22-.3.62-.16.85.34.56,1-.23,1.31-.39a3,3,0,0,0,1.45-1.2l.67-1.14c.14-.23.27-.47.39-.71a6.89,6.89,0,0,0,.3-.8c.11-.34.21-.68.3-1A1.83,1.83,0,0,0,66.79,34.15Z"/>
                    </g>
                  </svg>
                </a>

                {/* Yaencontre */}
                <a href="https://www.yaencontre.com" target="_blank" rel="noopener noreferrer"
                  className="group opacity-85 hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <svg viewBox="0 0 320 60" className="h-8 md:h-10 w-auto" aria-label="Yaencontre">
                    {/* The "ya" icon */}
                    <g transform="translate(0, 5) scale(0.26)">
                      <rect fill="#e5005a" width="192" height="192" rx="32" />
                      <path fill="#fff" d="M151.959 61.0489H168.441V130.489H152.238L151.391 120.347C147.46 128.523 136.601 132.47 128.876 132.607C108.291 132.746 93.0596 120.073 93.0596 95.6972C93.0596 71.7477 109.003 59.2214 129.284 59.3605C138.563 59.3605 147.458 63.7254 151.389 70.6373L151.959 61.0489ZM110.272 95.6972C110.272 108.957 119.405 116.833 130.833 116.833C157.869 116.833 157.869 74.7072 130.833 74.7072C119.405 74.7072 110.272 82.4633 110.272 95.6972Z"/>
                      <path fill="#fff" d="M25.8384 142.456C27.5124 142.736 29.2848 142.876 31.1458 142.876C34.8656 142.876 37.7292 141.875 39.7318 139.88C41.7295 137.875 43.0342 136.052 44.43 132.529L18.2598 61.2422H37.6236L54.9322 110.954L72.2359 61.2422H91.6622L76.7615 100.826C72.1904 113.201 68.154 125.39 62.7482 137.012C60.7864 141.204 58.8318 144.753 56.8748 147.694C54.9178 150.62 52.7713 153.04 50.4498 154.941C48.121 156.848 45.4853 158.241 42.5498 159.126C39.6166 160.019 36.1919 160.453 32.2826 160.453C29.0185 160.453 26.0111 160.158 23.2626 159.549L25.8384 142.456Z"/>
                    </g>
                    {/* The "encontre" text */}
                    <text x="62" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontSize="26" fontWeight="bold" fill="#ffffff" letterSpacing="-0.5">encontre</text>
                  </svg>
                </a>

              </div>

              {/* Entre otros */}
              <div className="flex items-center gap-4 w-full max-w-md">
                <div className="flex-1 h-px bg-white/10" />
                <span className="font-primary text-[10px] text-white/25 uppercase tracking-[0.3em] whitespace-nowrap">
                  {t('owners_page.marketing.portals_among_others') ?? 'entre otros'}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: 8-Step Selling Process Timeline Section */}
      <section id="selling-process" className="w-full bg-[#0A0A0A] py-12 md:py-16 relative z-10 border-t border-white/5">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C9A962]/2 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-6 md:px-14">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold block mb-4">
              {t('owners_page.process.badge')}
            </span>
            <h2 className="font-secondary text-4xl md:text-5xl text-white mb-6 leading-tight">
              {t('owners_page.process.title_1')} <span className="italic text-[#C9A962]">{t('owners_page.process.title_2')}</span>
            </h2>
            <p className="font-primary text-white/50 text-lg font-light leading-relaxed">
              {t('owners_page.process.subtitle')}
            </p>
          </motion.div>

          <div className="relative mt-16">
            {/* Vertical timeline line */}
            <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-[#C9A962]/0 via-[#C9A962]/30 to-[#C9A962]/0 -translate-x-1/2 z-10" />

            <div className="space-y-8 lg:space-y-10">
              {[
                {
                  key: 's1', icon: Phone,
                  img: 'photo-1560472354-b33ff0c44a43',
                  alt: 'Consulta inicial con asesor inmobiliario'
                },
                {
                  key: 's2', icon: ClipboardList,
                  img: 'photo-1553877522-43269d4ea984',
                  alt: 'Plan estratégico de venta personalizado'
                },
                {
                  key: 's3', icon: Camera,
                  img: 'photo-1513694203232-719a280e022f',
                  alt: 'Preparación premium y Home Staging'
                },
                {
                  key: 's4', icon: Megaphone,
                  img: 'photo-1460925895917-afdab827c52f',
                  alt: 'Marketing digital avanzado en portales'
                },
                {
                  key: 's5', icon: UsersRound,
                  img: 'photo-1560518883-ce09059eeffa',
                  alt: 'Visita de compradores cualificados'
                },
                {
                  key: 's6', icon: Handshake,
                  img: 'photo-1507679799987-c73779587ccf',
                  alt: 'Negociación profesional de ofertas'
                },
                {
                  key: 's7', icon: FileText,
                  img: 'photo-1450101499163-c8848c66ca85',
                  alt: 'Firma de arras y documentación legal'
                },
                {
                  key: 's8', icon: Key,
                  img: 'photo-1582407947304-fd86f28f7d8b',
                  alt: 'Entrega de llaves y cierre exitoso'
                }
              ].map((step, idx) => {
                const Icon = step.icon;
                const isEven = idx % 2 === 0;
                
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                    className={`group flex flex-col lg:flex-row items-stretch relative w-full gap-0 ${
                      isEven ? 'lg:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Center number bubble */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0A0A0A] border border-[#C9A962] items-center justify-center z-20 shadow-[0_0_20px_rgba(201,169,98,0.25)]">
                      <span className="font-secondary text-xs text-[#C9A962] font-semibold">
                        0{idx + 1}
                      </span>
                    </div>

                    {/* ── Text Card ── */}
                    <div className="w-full lg:w-[calc(50%-28px)] flex flex-col justify-center">
                      <div className="group bg-[#0E0E0E] border border-white/5 hover:border-[#C9A962]/30 p-8 h-full relative transition-all duration-300">
                        {/* Mobile step badge */}
                        <div className="lg:hidden absolute top-4 right-4 text-xs font-semibold text-[#C9A962] bg-[#C9A962]/10 px-2.5 py-1 uppercase tracking-widest font-primary">
                          Paso 0{idx + 1}
                        </div>
                        
                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-10 h-10 rounded-full bg-black border border-[#C9A962]/20 flex items-center justify-center group-hover:border-[#C9A962] group-hover:bg-[#C9A962]/5 transition-all duration-300 flex-shrink-0">
                            <Icon className="w-4 h-4 text-[#C9A962]" />
                          </div>
                          <h3 className="font-secondary text-xl text-white group-hover:text-[#C9A962] transition-colors duration-300">
                            {t(`owners_page.process.${step.key}_title`)}
                          </h3>
                        </div>

                        <p className="font-primary text-sm text-white/55 leading-relaxed font-light group-hover:text-white/75 transition-colors duration-300">
                          {t(`owners_page.process.${step.key}_desc`)}
                        </p>
                      </div>
                    </div>

                    {/* ── Image Panel (desktop only) ── */}
                    <div className="hidden lg:block w-[calc(50%-28px)] relative overflow-hidden min-h-[180px]">
                      <img
                        src={`https://images.unsplash.com/${step.img}?q=80&w=800&auto=format&fit=crop`}
                        alt={step.alt}
                        className="absolute inset-0 w-full h-full object-cover object-center opacity-75 group-hover:opacity-100 transition-opacity duration-700"
                      />
                    </div>

                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Call to Action Banner (Valuation) */}
      <section className="w-full py-12 md:py-16 bg-[#050505] relative z-10 border-t border-white/5 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#C9A962]/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        
        <div className="max-w-[1440px] mx-auto px-6 md:px-14">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full bg-[#0C0C0C] border border-[#C9A962]/30 p-8 md:p-12 relative rounded-sm text-center shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
          >
            <div className="absolute top-0 inset-x-0 h-1 w-full bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-1 w-full bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />

            <div className="max-w-4xl mx-auto flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border border-[#C9A962]/30 flex items-center justify-center mb-8 bg-black">
                <TrendingUp className="w-5 h-5 text-[#C9A962]" />
              </div>

              <h2 className="font-secondary text-3xl md:text-5xl text-white mb-6 uppercase tracking-wider leading-[1.2]">
                {t('owners_page.cta_banner.title')}
              </h2>

              <p className="font-primary text-white/50 text-base md:text-lg font-light leading-relaxed mb-8 max-w-2xl">
                {t('owners_page.cta_banner.subtitle')}
              </p>

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="https://statefox.com/mites/v/6093dc70f21ebc61f637b472"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#C9A962] text-[#050505] font-primary uppercase tracking-widest font-semibold hover:bg-white transition-all duration-300 rounded-sm w-full sm:w-auto justify-center shadow-[0_5px_15px_rgba(201,169,98,0.2)] hover:shadow-[0_5px_20px_rgba(255,255,255,0.2)]"
              >
                {t('owners_page.cta_banner.btn_text')}
                <TrendingUp size={20} className="stroke-[2.5]" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
