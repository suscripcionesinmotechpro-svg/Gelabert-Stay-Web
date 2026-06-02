import { motion, useInView } from 'framer-motion';

import { useTranslation } from 'react-i18next';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyCardSkeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { Building, Key, Briefcase, ShieldCheck, Home as HomeIcon, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useRef, useState, useEffect, useMemo } from 'react';
import { sortPropertiesByAvailability } from '../utils/propertySorting';

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

type Slide = {
  type: 'image' | 'video';
  src: string;
};

// Hero slideshow — Todas las imágenes de WEB/images y todos los vídeos de public/videos
// Hero slideshow — Curated selection for maximum impact and performance
const HERO_SLIDES: Slide[] = [
  { type: 'image', src: '/images/carousel/hero-gen-1.webp' },
  { type: 'image', src: '/images/carousel/hero-luxury-villa-1.webp' },
  { type: 'image', src: '/images/carousel/hero-new-image-2.webp' },
  { type: 'image', src: '/images/carousel/hero-poster.webp' },
  { type: 'image', src: '/images/carousel/generated-1773179473489.webp' },
  { type: 'image', src: '/images/carousel/generated-1773179848841.webp' },
  { type: 'image', src: '/images/carousel/generated-1773179860778.webp' },
  { type: 'image', src: '/images/carousel/generated-1773179911372.webp' },
  { type: 'image', src: '/images/carousel/generated-1773179922956.webp' },
  { type: 'image', src: '/images/carousel/generated-1773179953611.webp' },
  { type: 'image', src: '/images/carousel/generated-1773179966632.webp' },
  { type: 'image', src: '/images/carousel/generated-1773179998210.webp' },
  { type: 'image', src: '/images/carousel/generated-1773180014794.webp' },
  { type: 'image', src: '/images/carousel/generated-1773180775213.webp' },
  { type: 'image', src: '/images/carousel/generated-1773181079127.webp' },
  { type: 'image', src: '/images/carousel/generated-1773181089592.webp' },
  { type: 'image', src: '/images/carousel/generated-1773181413432.webp' },
  { type: 'image', src: '/images/carousel/generated-1773181414755.webp' },
  { type: 'image', src: '/images/carousel/generated-1773181488277.webp' },
  { type: 'image', src: '/images/carousel/generated-1773181525401.webp' },
  { type: 'image', src: '/images/carousel/generated-1773181526162.webp' },
  { type: 'image', src: '/images/carousel/generated-1773182001681.webp' },
  { type: 'video', src: '/videos/hero-luxury.mp4' },
  { type: 'video', src: '/videos/hero-new-drone-1.mp4' },
];

const TOTAL_SLIDES = HERO_SLIDES.length;

export const Home = () => {
  const { t, i18n } = useTranslation();
  const { properties: featuredPropertiesData, loading } = useProperties({ is_featured: true, commercial_status: 'disponible', limit: 3 });
  
  const featuredProperties = useMemo(() => {
    return sortPropertiesByAvailability(featuredPropertiesData);
  }, [featuredPropertiesData]);
  const [heroIndex, setHeroIndex] = useState(0);
  
  // Guardar de forma dinámica qué diapositivas ya han sido cargadas en el DOM (inicialmente la 1 y la 2)
  const [loadedIndices, setLoadedIndices] = useState<number[]>([0, 1]);

  useEffect(() => {
    const nextIndex = (heroIndex + 1) % TOTAL_SLIDES;
    setLoadedIndices(prev => {
      if (prev.includes(heroIndex) && prev.includes(nextIndex)) {
        return prev;
      }
      const next = [...prev];
      if (!next.includes(heroIndex)) next.push(heroIndex);
      if (!next.includes(nextIndex)) next.push(nextIndex);
      return next;
    });
  }, [heroIndex]);
  
  // Create refs for multiple videos
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Un solo efecto controla timing y reproducción
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const currentSlide = HERO_SLIDES[heroIndex];

    if (currentSlide.type === 'video') {
      const activeVideo = videoRefs.current[heroIndex];
      // Pausar todos los demás vídeos
      videoRefs.current.forEach((v, i) => {
        if (i !== heroIndex && v) {
          v.pause();
          v.currentTime = 0;
        }
      });

      if (activeVideo) {
        activeVideo.currentTime = currentSlide.src.includes('#t=') ? parseInt(currentSlide.src.split('#t=')[1]) || 0 : 0;
        activeVideo.play().catch(() => {
          // Si el vídeo no carga, avanzar tras 8s
          timerRef.current = setTimeout(() => setHeroIndex(prev => (prev + 1) % TOTAL_SLIDES), 8000);
        });
        // Red de seguridad: máx 30s por si el vídeo fuera muy largo
        timerRef.current = setTimeout(() => setHeroIndex(prev => (prev + 1) % TOTAL_SLIDES), 30000);
      }
    } else {
      // Imagen activa: pausar todos los vídeos
      videoRefs.current.forEach((v) => {
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      });
      timerRef.current = setTimeout(() => {
        setHeroIndex(prev => (prev + 1) % TOTAL_SLIDES);
      }, 6000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [heroIndex]);

  // Pre-cargar de forma inteligente la siguiente imagen para evitar cuellos de botella
  // pero asegurando que la transición sea instantánea
  useEffect(() => {
    const preloadNextImage = () => {
      const nextIndex = (heroIndex + 1) % TOTAL_SLIDES;
      const nextSlide = HERO_SLIDES[nextIndex];
      if (nextSlide.type === 'image') {
        const img = new Image();
        img.src = nextSlide.src;
      }
    };
    preloadNextImage();
  }, [heroIndex]);

  // Vídeo termina de forma natural → avanzar al siguiente slide
  const handleVideoEnded = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHeroIndex(prev => (prev + 1) % TOTAL_SLIDES);
  };

  return (
    <div className="w-full pb-20">
      <Helmet>
        {HERO_SLIDES[0].type === 'image' && (
          <link rel="preload" as="image" href={HERO_SLIDES[0].src} fetchPriority="high" />
        )}
        <title>{t('home.seo.title')}</title>
        <meta name="description" content={t('home.seo.description')} />
        <meta name="keywords" content="inmobiliaria málaga, comprar casa málaga, alquiler piso málaga, venta casas málaga, costa del sol inmobiliaria, gelabert homes real estate, pisos en venta málaga, apartamentos alquiler málaga" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={i18n.language.startsWith('en') ? 'https://gelaberthomes.es/en/' : 'https://gelaberthomes.es/'} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Gelabert Homes Real Estate" />
        <meta property="og:url" content={i18n.language.startsWith('en') ? 'https://gelaberthomes.es/en/' : 'https://gelaberthomes.es/'} />
        <meta property="og:title" content={t('home.seo.og_title')} />
        <meta property="og:description" content={t('home.seo.og_description')} />
        <meta property="og:image" content="https://gelaberthomes.es/logo-og.png" />
        <meta property="og:image:secure_url" content="https://gelaberthomes.es/logo-og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={t('home.seo.og_image_alt')} />
        <meta property="og:locale" content={i18n.language.startsWith('en') ? 'en_US' : 'es_ES'} />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('home.seo.twitter_title')} />
        <meta name="twitter:description" content={t('home.seo.twitter_description')} />
        <meta name="twitter:image" content="https://gelaberthomes.es/logo-og.png" />
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
                "name": t('home.faq.q1.question'),
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": t('home.faq.q1.answer')
                }
              },
              {
                "@type": "Question",
                "name": t('home.faq.q2.question'),
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": t('home.faq.q2.answer')
                }
              },
              {
                "@type": "Question",
                "name": t('home.faq.q3.question'),
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": t('home.faq.q3.answer')
                }
              },
              {
                "@type": "Question",
                "name": t('home.faq.q4.question'),
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": t('home.faq.q4.answer')
                }
              }
            ]
          })}
        </script>
      </Helmet>
      {/* Hero Section */}
      <div className="relative w-full min-h-[80vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden bg-black py-24 md:py-32">
      {/* Hero Cinematic Slideshow — 3 imágenes únicas + vídeo, rotación cada 6s */}
      <div className="absolute inset-0 z-0 bg-[#080808]">
        {/* Mixed media slides */}
        {HERO_SLIDES.map((slide, i) => {
          const isLoaded = loadedIndices.includes(i);
          if (!isLoaded) return null;

          if (slide.type === 'image') {
            return (
              <img
                key={i}
                src={slide.src}
                alt=""
                // @ts-ignore
                fetchPriority={i === 0 ? 'high' : 'low'}
                className={`absolute inset-0 w-full h-full object-cover scale-[1.08] saturate-[1.1] brightness-[0.8] transition-opacity duration-[1500ms] ease-in-out ${
                  heroIndex === i ? 'opacity-100' : 'opacity-0'
                }`}
              />
            );
          } else {
            return (
              <video
                key={i}
                ref={(el) => { videoRefs.current[i] = el; }}
                muted
                playsInline
                preload="auto"
                poster="/images/hero-poster.png"
                onEnded={handleVideoEnded}
                // @ts-ignore
                fetchPriority="low"
                className={`absolute inset-0 w-full h-full object-cover scale-[1.08] saturate-[1.1] brightness-[0.8] transition-opacity duration-[1500ms] ease-in-out ${
                  heroIndex === i ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <source src={slide.src} type="video/mp4" />
              </video>
            );
          }
        })}

        {/* Gradient overlay permanente - velo sutil en toda la altura para legibilidad garantizada */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/15 to-black/75" />
      </div>

      <div className="max-w-[1440px] w-full px-6 md:px-14 flex flex-col items-center text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-secondary text-[2rem] sm:text-[2.8rem] md:text-[4.2rem] lg:text-[4.9rem] text-[#FAF8F5] leading-[0.9] tracking-tighter relative group drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
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
            <span className="text-[#C9A962] italic font-light block mt-4 text-[1.65rem] sm:text-[2.3rem] md:text-[3.3rem] tracking-normal drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
              Real Estate
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-primary text-base md:text-lg text-[#DFDFE6] max-w-2xl font-light tracking-wide opacity-90 mt-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]"
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

          {/* Slide indicator dots — intelligent handling for many slides */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex items-center justify-center gap-2 mt-10"
          >
            {TOTAL_SLIDES <= 10 ? (
              // Simple dots for few slides
              <div className="flex gap-2.5">
                {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIndex(i)}
                    className={`transition-all duration-500 ease-in-out border shrink-0 ${
                      heroIndex === i
                        ? 'w-6 h-1.5 bg-[#C9A962] border-[#C9A962] rounded-full'
                        : 'w-1.5 h-1.5 bg-white/20 border-white/10 rounded-full hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            ) : (
              // Compact indicator for many slides
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                  <button 
                    onClick={() => setHeroIndex(prev => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES)}
                    className="text-white/40 hover:text-[#C9A962] transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                  
                  <div className="flex items-center gap-2 font-primary text-[11px] font-bold tracking-widest text-[#C9A962]">
                    <span>{(heroIndex + 1).toString().padStart(2, '0')}</span>
                    <span className="text-white/20">/</span>
                    <span className="text-white/40">{TOTAL_SLIDES.toString().padStart(2, '0')}</span>
                  </div>

                  <button 
                    onClick={() => setHeroIndex(prev => (prev + 1) % TOTAL_SLIDES)}
                    className="text-white/40 hover:text-[#C9A962] transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-32 h-[1px] bg-white/10 relative overflow-hidden">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${((heroIndex + 1) / TOTAL_SLIDES) * 100}%` }}
                    className="absolute inset-y-0 left-0 bg-[#C9A962]"
                  />
                </div>
              </div>
            )}
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

      {/* Accreditations & Partnerships Band */}
      <section className="w-full bg-[#050505] py-20 md:py-24 border-y border-white/5 relative z-10 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 md:px-14 flex flex-col items-center gap-10">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
            className="font-primary text-xs md:text-sm text-[#C9A962] uppercase tracking-[0.3em] font-extrabold text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          >
            {t('home.accreditations.title')}
          </motion.p>

          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 lg:gap-12 max-w-6xl mt-4">
            {/* Devante Logo and Tag */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex-1 flex flex-col items-center gap-6 text-center p-8 md:p-10 rounded-lg bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/5 hover:border-[#C9A962]/40 hover:bg-[#C9A962]/[0.02] transition-all duration-500 backdrop-blur-md relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#C9A962]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg" />
              <div className="h-12 md:h-14 flex items-center justify-center relative z-10">
                <img 
                  src="/images/brand/devante-logo.svg" 
                  alt="Devante Business School" 
                  className="h-full w-auto max-w-[240px] object-contain opacity-95 group-hover:opacity-100 group-hover:scale-102 transition-all duration-500"
                />
              </div>
              <p className="font-primary text-sm md:text-base text-zinc-300 leading-relaxed max-w-[420px] font-light relative z-10">
                {t('home.accreditations.devante_tag')}
              </p>
            </motion.div>

            {/* Separator (visible on desktop only) */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-[#C9A962]/20 to-transparent" />
            </div>

            {/* Huspy Logo and Tag */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex-1 flex flex-col items-center gap-6 text-center p-8 md:p-10 rounded-lg bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/5 hover:border-[#C9A962]/40 hover:bg-[#C9A962]/[0.02] transition-all duration-500 backdrop-blur-md relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#C9A962]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg" />
              <div className="h-12 md:h-14 flex items-center justify-center relative z-10">
                <img 
                  src="/images/brand/huspy-logo.svg" 
                  alt="Huspy Authorized Partner" 
                  className="h-full w-auto max-w-[220px] object-contain opacity-95 group-hover:opacity-100 group-hover:scale-102 transition-all duration-500"
                />
              </div>
              <p className="font-primary text-sm md:text-base text-zinc-300 leading-relaxed max-w-[420px] font-light relative z-10">
                {t('home.accreditations.huspy_tag')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: t('home.services.rent.title'), icon: <Key className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.rent.desc') },
            { title: t('home.services.sale.title'), icon: <Building className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.sale.desc') },
            { title: t('home.services.management.title'), icon: <ShieldCheck className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.management.desc') },
            { title: t('home.services.transfers.title'), icon: <Briefcase className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.transfers.desc') }
          ].map((srv, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="flex flex-col gap-4 p-8 border border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#C9A962] transition-colors group h-full"
            >
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                {srv.icon}
              </div>
              <h3 className="font-primary text-xl text-[#FAF8F5] font-bold group-hover:text-[#C9A962] transition-colors">{srv.title}</h3>
              <p className="font-primary text-[#888888] text-sm">{srv.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA hacia servicios completos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center"
        >
          <Link
            to={`${i18n.language.startsWith('en') ? '/en' : ''}/servicios`}
            className="flex items-center gap-3 px-10 py-4 border border-[#C9A962]/30 text-[#C9A962] font-primary font-bold text-[11px] uppercase tracking-[0.25em] hover:bg-[#C9A962]/10 hover:border-[#C9A962] transition-all duration-300"
          >
            <ArrowRight className="w-4 h-4" />
            {i18n.language.startsWith('en') ? 'View all services' : 'Ver todos los servicios'}
          </Link>
        </motion.div>
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
            className="w-full h-full object-cover border border-[#1F1F1F] saturate-[1.3] brightness-[1.15] contrast-[1.1]"
          />
        </motion.div>
      </section>



      {/* Stats Section */}
      <section className="relative w-full px-6 md:px-14 py-28 overflow-hidden">
        {/* Cinematic background: Vue aérienne de Málaga et la Costa del Sol */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-80 brightness-[0.9] saturate-[1.25] scale-105"
            alt=""
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#050505]/40 to-[#0A0A0A]/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/40 via-transparent to-[#050505]/40" />
        </div>
        {/* Línea dorada decorativa */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {[
            { value: 5, suffix: '+', label: t('home.stats.years') || 'Años de experiencia', decimals: 0 },
            { value: 150, suffix: '+', label: t('home.stats.properties') || 'Propiedades', decimals: 0 },
            { value: 350, suffix: '+', label: t('home.stats.clients') || 'Clientes contentos', decimals: 0 },
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
                price_type={p.price_type}
                max_price={p.max_price}
                currency={p.currency}
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
                videoUrl={p.video_url}
                videos={p.videos}
                floorPlanUrl={p.floor_plan}
                id={p.id}
                reference={p.reference ?? undefined}
                property_type={p.property_type}
                is_room_rental={p.is_room_rental}
                rooms={p.rooms}
                common_areas={p.common_areas}
                createdAt={p.created_at}
                availability={p.availability ?? undefined}
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
        {/* Cinematic background: Arquitectura moderna interior premium */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-60 brightness-[0.8] saturate-[1.25] scale-105"
            alt=""
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F0F0F]/80 via-[#0A0A0A]/40 to-[#0F0F0F]/80" />
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

      {/* Testimonials — clean dark section for visual breathing room */}
      <section className="w-full px-6 md:px-14 py-24 bg-[#0A0A0A]">
        <div className="flex flex-col gap-12">
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
              className="flex flex-col gap-5 p-8 border border-[#1F1F1F] bg-[#0F0F0F] hover:border-[#C9A962]/30 transition-colors group"
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

      {/* Testimonials — clean dark section for visual breathing room */}

      {/* Final CTA Section — Cinematic */}
      <section className="relative w-full py-40 flex flex-col items-center justify-center overflow-hidden">
        {/* Imagen: Atardecer sobre el mar en la Costa del Sol */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-70 brightness-[0.85] saturate-[1.25] scale-105"
            alt=""
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-transparent to-[#0A0A0A]/80" />
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
          <h2 className="font-secondary text-4xl md:text-7xl text-white leading-[1.05]">
            {t('home.cta_title')}{' '}
            <span className="italic text-[#C9A962] font-light">{t('home.footer_cta.subtitle_suffix')}</span>
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
