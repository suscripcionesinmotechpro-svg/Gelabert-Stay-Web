import { motion } from 'framer-motion';
import { GeneralContactForm } from '../components/GeneralContactForm';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { getWhatsAppLink } from '../utils/whatsapp';
import { Mail, Phone, Sparkles } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as any },
};

export const Contacto = () => {
  const { t, i18n } = useTranslation();

  const contactLink = getWhatsAppLink({
    context: 'contact',
    url: `${window.location.origin}${i18n.language.startsWith('en') ? '/en' : ''}/contacto`
  });

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#050505] relative overflow-hidden">
      <Helmet>
        <title>{t('contact_page.seo.title')}</title>
        <meta name="description" content={t('contact_page.seo.description')} />
        <meta name="keywords" content="contacto inmobiliaria málaga, gelabert homes contacto, agencia inmobiliaria málaga teléfono, inmobiliaria costa del sol contacto" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={i18n.language.startsWith('en') ? 'https://gelaberthomes.es/en/contacto' : 'https://gelaberthomes.es/contacto'} />
        <link rel="alternate" hrefLang="es" href="https://gelaberthomes.es/contacto" />
        <link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/contacto" />
        <link rel="alternate" hrefLang="x-default" href="https://gelaberthomes.es/contacto" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Gelabert Homes Real Estate" />
        <meta property="og:url" content={i18n.language.startsWith('en') ? 'https://gelaberthomes.es/en/contacto' : 'https://gelaberthomes.es/contacto'} />
        <meta property="og:title" content={t('contact_page.seo.title')} />
        <meta property="og:description" content={t('contact_page.seo.description')} />
        <meta property="og:image" content="https://gelaberthomes.es/sharing-logo.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('contact_page.seo.title')} />
        <meta name="twitter:image" content="https://gelaberthomes.es/sharing-logo.jpg" />
        {/* JSON-LD: LocalBusiness + ContactPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": i18n.language.startsWith('en') ? "Contact Gelabert Homes Real Estate" : "Contacto - Gelabert Homes Real Estate",
            "url": i18n.language.startsWith('en') ? "https://gelaberthomes.es/en/contacto/" : "https://gelaberthomes.es/contacto/",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://gelaberthomes.es/" },
                { "@type": "ListItem", "position": 2, "name": "Contacto", "item": "https://gelaberthomes.es/contacto/" }
              ]
            },
            "mainEntity": {
              "@type": "RealEstateAgent",
              "name": "Gelabert Homes Real Estate",
              "telephone": "+34611898827",
              "email": "info@gelaberthomes.es",
              "url": "https://gelaberthomes.es/",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Málaga",
                "addressRegion": "Andalucía",
                "addressCountry": "ES"
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
                "opens": "09:00",
                "closes": "19:00"
              }
            }
          })}
        </script>
      </Helmet>

      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1582408921715-18e7806365c1?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-40 brightness-[0.8] scale-105"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/70 to-[#050505]/90" />
      </div>

      {/* Background Mesh */}
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none z-[1]" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C9A962]/5 blur-[120px] rounded-full mix-blend-screen z-[1]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#C9A962]/3 blur-[100px] rounded-full mix-blend-screen z-[1]" />

      {/* Left Content */}
      <div className="flex-1 relative z-10 p-8 md:p-16 lg:p-24 flex flex-col justify-center">
        <motion.div {...(fadeUp as any)} className="max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-4 h-4 text-[#C9A962]" />
            <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.4em] font-bold">
              {t('contact_page.hero.badge')}
            </span>
          </div>
          
          <h1 className="font-secondary text-5xl md:text-8xl text-white mb-8 leading-[1.1]">
            {t('contact_page.hero.title_1')}<br />
            <span className="italic text-[#C9A962] font-light">
              {t('contact_page.hero.title_2')}
            </span>
          </h1>

          <p className="font-primary text-lg text-white/50 font-light mb-16 leading-relaxed">
            {t('contact_page.hero.description')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-sm group transition-all duration-500 hover:border-[#C9A962]/40"
            >
              <div className="w-10 h-10 bg-black border border-white/5 group-hover:border-[#C9A962]/30 flex items-center justify-center mb-6 transition-colors font-primary">
                <Mail className="w-5 h-5 text-[#C9A962]" />
              </div>
              <span className="block text-[#666666] text-xs uppercase tracking-widest mb-2 font-bold font-primary">
                {t('contact_page.hero.email')}
              </span>
              <a href="mailto:info@gelaberthomes.es" className="text-white hover:text-[#C9A962] transition-colors font-secondary text-lg break-all">
                info@gelaberthomes.es
              </a>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-sm group transition-all duration-500 hover:border-[#C9A962]/40"
            >
              <div className="w-10 h-10 bg-black border border-white/5 group-hover:border-[#C9A962]/30 flex items-center justify-center mb-6 transition-colors font-primary">
                <Phone className="w-5 h-5 text-[#C9A962]" />
              </div>
              <span className="block text-[#666666] text-xs uppercase tracking-widest mb-2 font-bold font-primary">
                {t('contact_page.hero.phone')}
              </span>
              <a href="tel:+34611898827" className="text-white hover:text-[#C9A962] transition-colors font-secondary text-lg">
                +34 611 89 88 27
              </a>
            </motion.div>
          </div>

          <div className="mt-12">
            <WhatsAppButton 
              phoneNumber="34611898827" 
              href={contactLink}
              label={t('contact_page.hero.whatsapp_label')}
            />
          </div>
        </motion.div>
      </div>

      {/* Right Form Area */}
      <div className="flex-1 relative z-10 p-8 lg:p-14 flex items-center">
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-2xl mx-auto glass shadow-2xl overflow-hidden"
        >
          <div className="h-2 w-full bg-gradient-to-r from-transparent via-[#C9A962] to-transparent opacity-30" />
          <div className="p-8 md:p-12">
            <GeneralContactForm />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
