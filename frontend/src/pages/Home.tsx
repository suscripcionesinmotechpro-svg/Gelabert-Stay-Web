import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyCardSkeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { Building, Key, Briefcase, ShieldCheck, Home as HomeIcon, CheckCircle, Star } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useRef, useState, useEffect } from 'react';

import { Helmet } from 'react-helmet-async';

// Animated counter component — uses RAF-based easing, fully type-safe
const AnimatedCounter = ({ target, suffix = '', decimals = 0 }: { target: number; suffix?: string; decimals?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000; // ms
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, target]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toString();

  return <span ref={ref}>{display}{suffix}</span>;
};

export const Home = () => {
  const { t, i18n } = useTranslation();
  const { properties: featuredProperties, loading } = useProperties({ is_featured: true, limit: 3 });

  return (
    <div className="w-full pb-20">
      <Helmet>
        <title>{t('seo.home_title')}</title>
        <meta name="description" content={t('seo.home_description')} />
        <meta name="keywords" content="inmobiliaria málaga, comprar casa málaga, alquiler piso málaga, venta casas málaga, costa del sol inmobiliaria, gelabert homes real estate, pisos en venta málaga, apartamentos alquiler málaga" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={i18n.language.startsWith('en') ? 'https://gelaberthomes.es/en/' : 'https://gelaberthomes.es/'} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Gelabert Homes Real Estate" />
        <meta property="og:url" content={i18n.language.startsWith('en') ? 'https://gelaberthomes.es/en/' : 'https://gelaberthomes.es/'} />
        <meta property="og:title" content="Gelabert Homes Real Estate | Inmobiliaria en Málaga" />
        <meta property="og:description" content="Especialistas en compra, venta y alquiler de propiedades en Málaga y Costa del Sol. Tu inmobiliaria de confianza." />
        <meta property="og:image" content="https://gelaberthomes.es/sharing-logo.jpg" />
        <meta property="og:image:secure_url" content="https://gelaberthomes.es/sharing-logo.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Gelabert Homes Real Estate - Inmobiliaria en Málaga" />
        <meta property="og:locale" content={i18n.language.startsWith('en') ? 'en_US' : 'es_ES'} />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Gelabert Homes Real Estate | Inmobiliaria en Málaga" />
        <meta name="twitter:description" content="Especialistas en compra, venta y alquiler de propiedades en Málaga y Costa del Sol." />
        <meta name="twitter:image" content="https://gelaberthomes.es/sharing-logo.jpg" />
        <meta name="twitter:image:alt" content="Gelabert Homes Real Estate" />

        {/* Hreflang */}
        <link rel="alternate" hrefLang="es" href="https://gelaberthomes.es/" />
        <link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/" />
        <link rel="alternate" hrefLang="x-default" href="https://gelaberthomes.es/" />

        {/* JSON-LD: FAQPage — boosts rich snippets / featured snippets in Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "¿Dónde opera Gelabert Homes Real Estate?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Gelabert Homes Real Estate opera en Málaga y toda la Costa del Sol, ofreciendo servicios de compra, venta, alquiler y gestión de propiedades."
                }
              },
              {
                "@type": "Question",
                "name": "¿Qué servicios ofrece Gelabert Homes?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Ofrecemos alquiler, venta y traspaso de propiedades residenciales y comerciales, así como gestión integral de alquileres para propietarios en Málaga y la Costa del Sol."
                }
              },
              {
                "@type": "Question",
                "name": "¿Cómo puedo contactar con Gelabert Homes?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Puedes contactarnos por teléfono al +34 611 898 827, por email a info@gelaberthomes.es o a través del formulario de contacto en nuestra web."
                }
              },
              {
                "@type": "Question",
                "name": "¿Tienen propiedades en alquiler en Málaga?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sí, disponemos de un amplio catálogo de pisos, casas y estudios en alquiler en Málaga y la Costa del Sol. Puedes ver todas las propiedades disponibles en nuestro catálogo online."
                }
              }
            ]
          })}
        </script>
      </Helmet>
      {/* Hero Section */}
      <div className="relative w-full h-[90vh] md:h-[95vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
      {/* Cinematic Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          // @ts-ignore - fetchPriority is a valid attribute for performance optimization
          fetchPriority="high"
          className="w-full h-full object-cover opacity-60 scale-105"
          poster="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
        >
          <source 
            src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-luxury-holiday-resort-and-swimming-pool-42502-large.mp4" 
            type="video/mp4" 
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0A0A0A]" />
      </div>

      <div className="max-w-[1440px] w-full px-6 md:px-14 flex flex-col items-center text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-secondary text-[2.8rem] md:text-[4.2rem] lg:text-[4.9rem] text-[#FAF8F5] leading-[0.9] tracking-tighter relative group"
          >
            <span className="relative inline-block">
              {t('hero.hero_title')}
              {/* Golden Shimmer Effect */}
              <motion.span 
                animate={{ x: ['100%', '-100%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 5 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A962]/30 to-transparent skew-x-[-20deg] pointer-events-none"
              />
            </span>
            <br/> 
            <span className="text-[#C9A962] italic font-light block mt-4 text-[2.3rem] md:text-[3.3rem] tracking-normal">
              Real Estate
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-primary text-base md:text-lg text-[#DFDFE6] max-w-2xl font-light tracking-wide opacity-90"
          >
            {t('hero.hero_subtitle')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`} className="px-5 py-2.5 sm:px-7 sm:py-3.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[13px] uppercase tracking-[0.2em] hover:bg-[#D4B673] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#C9A962]/10">
              {t('hero.view_properties')}
            </Link>
            <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/contacto`} className="px-5 py-2.5 sm:px-7 sm:py-3.5 border border-[#C9A962]/50 text-[#C9A962] font-primary font-bold text-[13px] uppercase tracking-[0.2em] hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-all">
              {t('hero.contact_us')}
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        >
          <span className="font-primary text-[10px] text-[#C9A962] uppercase tracking-[0.3em] font-bold opacity-60">{t('common.scroll')}</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#C9A962] to-transparent relative overflow-hidden">
            <motion.div 
              animate={{ 
                y: [0, 48],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 left-0 w-full h-1/3 bg-white shadow-[0_0_8px_white]"
            />
          </div>
        </motion.div>
      </div>

      {/* Services Block */}
      <section className="w-full px-6 md:px-14 py-24 bg-[#0A0A0A] flex flex-col gap-12">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-secondary text-4xl md:text-5xl text-[#FAF8F5] text-center"
        >
          {t('home.services.title')}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: t('home.services.rent.title'), icon: <Key className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.rent.desc') },
            { title: t('home.services.sale.title'), icon: <Building className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.sale.desc') },
            { title: t('home.services.transfers.title'), icon: <Briefcase className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.transfers.desc') },
            { title: t('home.services.management.title'), icon: <ShieldCheck className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.management.desc') }
          ].map((srv, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="flex flex-col gap-4 p-8 border border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#C9A962] transition-colors group cursor-pointer"
            >
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                {srv.icon}
              </div>
              <h3 className="font-primary text-xl text-[#FAF8F5] font-bold group-hover:text-[#C9A962] transition-colors">{srv.title}</h3>
              <p className="font-primary text-[#888888] text-sm">{srv.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Owners Block */}
      <section className="w-full px-6 md:px-14 py-24 bg-[#0F0F0F] flex flex-col lg:flex-row gap-12 lg:gap-20 items-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex-1 flex flex-col gap-6 justify-center"
        >
          <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5] leading-tight">
            {t('home.owners.title')}
          </h2>
          <p className="font-primary text-[#888888] text-base leading-relaxed">
            {t('home.owners.desc')}
          </p>
          <Link 
            to={`${i18n.language.startsWith('en') ? '/en' : ''}/servicios`}
            className="self-start mt-4 px-7 py-3.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[13px] uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
          >
            {t('home.owners.button')}
          </Link>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="flex-1 w-full h-[400px] lg:h-[500px]"
        >
          <img 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
            alt="Property Management"
            loading="lazy" 
            className="w-full h-full object-cover border border-[#1F1F1F]"
          />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative w-full px-6 md:px-14 py-28 overflow-hidden">
        {/* Cinematic background: Vue aérienne de Málaga et la Costa del Sol */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-25 brightness-[0.5] scale-105"
            alt=""
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#050505]/80 to-[#0A0A0A]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-[#050505]/60" />
        </div>
        {/* Línea dorada decorativa */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {[
            { value: 2, suffix: '+', label: t('home.stats.years') || 'Años de experiencia', decimals: 0 },
            { value: 200, suffix: '+', label: t('home.stats.properties') || 'Propiedades', decimals: 0 },
            { value: 500, suffix: '+', label: t('home.stats.clients') || 'Clientes contentos', decimals: 0 },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`flex flex-col items-center gap-2 text-center ${
                i < 3 ? 'lg:border-r lg:border-[#C9A962]/10' : ''
              }`}
            >
              <span className="font-secondary text-5xl md:text-6xl text-[#C9A962] leading-none drop-shadow-[0_0_20px_rgba(201,169,98,0.3)]">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
              </span>
              <span className="font-primary text-white/50 text-xs uppercase tracking-widest">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Customers Block */}
      <section className="w-full px-6 md:px-14 py-24 bg-[#0A0A0A] flex flex-col gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl flex flex-col gap-4"
        >
          <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5]">{t('home.customers.title')}</h2>
          <p className="font-primary text-[#888888] text-base">
            {t('home.customers.subtitle')}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {[
            { title: t('home.customers.feature1.title'), desc: t('home.customers.feature1.desc') },
            { title: t('home.customers.feature2.title'), desc: t('home.customers.feature2.desc') },
            { title: t('home.customers.feature3.title'), desc: t('home.customers.feature3.desc') }
          ].map((feat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex flex-col gap-4 p-8 border border-[#1F1F1F] text-center items-center bg-[#0F0F0F] hover:border-[#C9A962] hover:bg-[#141414] transition-colors group"
            >
              <div className="transform group-hover:-translate-y-2 transition-transform duration-300">
                <HomeIcon className="w-8 h-8 text-[#C9A962]" />
              </div>
              <h3 className="font-primary text-lg text-[#FAF8F5] font-bold">{feat.title}</h3>
              <p className="font-primary text-[#888888] text-sm">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`} className="mt-8 px-7 py-3.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[13px] uppercase tracking-wider hover:bg-[#D4B673] transition-colors">
          {t('home.customers.button')}
        </Link>
      </section>

      {/* Featured Properties Staggered List */}
      <section className="w-full px-6 md:px-14 py-24 bg-[#0F0F0F] flex flex-col gap-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#1F1F1F] pb-6"
        >
          <div className="flex flex-col gap-2">
            <span className="font-primary text-[#C9A962] text-sm uppercase tracking-[0.2em] font-bold">{t('home.featured.badge')}</span>
            <h2 className="font-secondary text-4xl text-[#FAF8F5]">{t('home.featured.title')}</h2>
          </div>
          <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`} className="font-primary text-[13px] text-[#C9A962] hover:text-[#FAF8F5] transition-colors font-bold uppercase tracking-wider">
            {t('home.featured.view_all')} →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))
          ) : featuredProperties.length > 0 ? (
            featuredProperties.map((p, index: number) => (
              <PropertyCard
                index={index}
                key={p.id}
                title={p.title}
                title_en={p.title_en || undefined}
                price={p.price ?? 0}
                location={[p.zone, p.city].filter(Boolean).join(', ')}
                area={p.area_m2 ?? 0}
                bedrooms={p.bedrooms}
                bathrooms={p.bathrooms}
                operation={p.operation.toUpperCase() as 'ALQUILER' | 'VENTA' | 'TRASPASO'}
                commercialStatus={p.commercial_status}
                isFeatured={p.is_featured}
                imageUrl={p.main_image ?? ''}
                linkTo={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades/${p.reference || p.slug || p.id}`}
                gallery={p.gallery}
                id={p.id}
                reference={p.reference ?? undefined}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="font-primary text-[#888888]">{t('home.featured.empty')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="relative w-full px-6 md:px-14 py-32 overflow-hidden">
        {/* Cinematic background: Villa de lujo interior de diseño */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-30 brightness-[0.55] scale-105"
            alt=""
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F0F] via-[#0A0A0A]/75 to-[#0F0F0F]" />
        </div>
        <div className="relative z-10 flex flex-col gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center flex flex-col items-center gap-3"
          >
            <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5]">
              {t('home.why.title')}
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#C9A962] to-transparent" />
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto w-full">
            {[
              t('home.why.item1'),
              t('home.why.item2'),
              t('home.why.item3'),
              t('home.why.item4'),
              t('home.why.item5'),
              t('home.why.item6')
            ].map((why, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-4 p-6 border border-white/5 bg-black/40 backdrop-blur-md hover:border-[#C9A962]/40 hover:bg-black/60 transition-all duration-300 group"
              >
                <CheckCircle className="w-5 h-5 text-[#C9A962] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-primary text-white/80 text-sm font-bold group-hover:text-white transition-colors">{why}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative w-full px-6 md:px-14 py-24 overflow-hidden">
        {/* Cinematic background: Skyline urbano de noche */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-20 brightness-[0.4] scale-110"
            alt=""
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0F0F0F]/85 to-[#0A0A0A]" />
        </div>
        <div className="relative z-10 flex flex-col gap-12">
        <div className="text-center flex flex-col gap-3">
          <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.3em] font-bold">{t('home.testimonials.badge') || 'Lo que dicen nuestros clientes'}</span>
          <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5]">{t('home.testimonials.title')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {[
            { name: t('home.testimonials.item1.name'), role: t('home.testimonials.item1.role'), text: t('home.testimonials.item1.text') },
            { name: t('home.testimonials.item2.name'), role: t('home.testimonials.item2.role'), text: t('home.testimonials.item2.text') },
            { name: t('home.testimonials.item3.name'), role: t('home.testimonials.item3.role'), text: t('home.testimonials.item3.text') }
          ].map((test, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="flex flex-col gap-5 p-8 border border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#C9A962]/30 transition-colors group"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(star => <Star key={star} className="w-3.5 h-3.5 fill-[#C9A962] text-[#C9A962]" />)}
              </div>
              {/* Quote */}
              <p className="font-primary text-[#888888] text-sm italic leading-relaxed flex-1">&ldquo;{test.text}&rdquo;</p>
              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#1F1F1F]">
                {/* Avatar with initials */}
                <div className="w-10 h-10 rounded-full bg-[#C9A962]/15 border border-[#C9A962]/30 flex items-center justify-center shrink-0 group-hover:bg-[#C9A962]/20 transition-colors">
                  <span className="font-secondary text-[#C9A962] text-sm font-bold">
                    {test.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="font-primary text-[#FAF8F5] font-bold text-sm">{test.name}</p>
                  <p className="font-primary text-[#C9A962] text-[11px] uppercase tracking-wider">{test.role}</p>
                </div>
                {/* Verified badge */}
                <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-green-400/10 border border-green-400/20 rounded-sm">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="font-primary text-[9px] text-green-400 uppercase tracking-wider font-bold">{t('home.testimonials.verified') || 'Verificado'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* Final CTA Section — Cinematic */}
      <section className="relative w-full py-40 flex flex-col items-center justify-center overflow-hidden">
        {/* Imagen: Atardecer sobre el mar en la Costa del Sol */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-45 brightness-[0.6] scale-105"
            alt=""
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A]" />
          <div className="absolute inset-0 bg-[#C9A962]/[0.04] mix-blend-overlay" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/30 to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
          className="relative z-10 text-center px-6 max-w-3xl flex flex-col items-center gap-8"
        >
          <div className="w-12 h-12 border border-[#C9A962]/30 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md">
            <Star className="w-5 h-5 text-[#C9A962]" />
          </div>
          <h2 className="font-secondary text-4xl md:text-7xl text-white leading-[1.05]">
            {t('home.why.title') || 'Tu próximo hogar'}{' '}
            <span className="italic text-[#C9A962] font-light">te espera</span>
          </h2>
          <p className="font-primary text-white/50 text-lg max-w-xl leading-relaxed">
            {t('hero.hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-5 mt-4">
            <Link
              to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`}
              className="px-12 py-5 bg-[#C9A962] text-black font-primary font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_10px_30px_rgba(201,169,98,0.25)]"
            >
              {t('hero.view_properties')}
            </Link>
            <Link
              to={`${i18n.language.startsWith('en') ? '/en' : ''}/contacto`}
              className="px-12 py-5 border border-white/20 text-white font-primary font-bold text-xs uppercase tracking-widest hover:bg-white/5 hover:border-[#C9A962]/50 transition-all"
            >
              {t('hero.contact_us')}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
