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
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#050505] relative overflow-hidden">
      <Helmet>
        <title>{t('owners_page.seo.title')}</title>
        <meta name="description" content={t('owners_page.seo.description')} />
        <meta property="og:title" content={t('owners_page.seo.og_title')} />
        <link rel="alternate" hrefLang="es" href="https://gelaberthomes.es/propietarios" />
        <link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/propietarios" />
        <link rel="alternate" hrefLang="x-default" href="https://gelaberthomes.es/propietarios" />
      </Helmet>

      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600607687940-c52af0493738?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20 brightness-[0.5]"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#050505] via-[#050505]/70 to-[#050505]/95" />
      </div>

      {/* Background Mesh */}
      <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none z-[1]" />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#C9A962]/5 blur-[120px] rounded-full mix-blend-screen z-[1]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#C9A962]/3 blur-[100px] rounded-full mix-blend-screen z-[1]" />

      {/* Left Content */}
      <div className="flex-1 relative z-10 p-8 md:p-16 lg:p-24 flex flex-col justify-center">
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
      <div className="flex-1 relative z-10 p-8 lg:p-14 flex items-center">
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
          </div>
        </motion.div>
      </div>
    </div>
  );
};
