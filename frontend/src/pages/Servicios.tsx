import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import {
  Key, Building2, Briefcase, ShieldCheck,
  CheckCircle, Phone, ArrowRight, Star, Sparkles, Plus, Check, ShoppingBag
} from 'lucide-react';
import { useServiceCart, type CartService } from '../hooks/useServiceCart';
import { ServiceCartDrawer } from '../components/ServiceCartDrawer';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' as const },
  transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as any },
};

interface ServiceCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  tag: string;
  image: string;
  desc: string;
  bullets: string[];
  className?: string;
  highlight?: boolean;
  cartIcon: string;
}

const ServiceCard = ({ 
  title, tag, icon, desc, image, bullets, highlight, className = "",
  isInCart, onToggle 
}: ServiceCardProps & { isInCart?: boolean; onToggle?: () => void }) => {
  const { t } = useTranslation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <motion.div
      {...(fadeUp as any)}
      onMouseMove={handleMouseMove}
      className={`relative group overflow-hidden border transition-all duration-500 ${
        isInCart 
          ? 'border-[#C9A962]/60 bg-[#C9A962]/5 shadow-[0_0_40px_rgba(201,169,98,0.1)]' 
          : 'border-white/5 bg-white/[0.02] backdrop-blur-xl hover:border-[#C9A962]/40 hover:bg-white/[0.04]'
      } ${className}`}
      style={{
        ["--mouse-x" as any]: `${mousePos.x}px`,
        ["--mouse-y" as any]: `${mousePos.y}px`,
      }}
    >
    {/* Image Background */}
    <div className="absolute inset-0 z-0">
      <img
        src={image}
        alt={title}
        className={`w-full h-full object-cover transition-all duration-1000 ${
          isInCart ? 'brightness-[0.5] scale-105' : 'brightness-[0.3] group-hover:brightness-[0.4] group-hover:scale-110'
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-transparent to-transparent opacity-80" />
    </div>

    {/* Shine effect */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(400px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(201,169,98,0.1),transparent)]" />

    {/* Selected overlay */}
    {isInCart && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-[1] bg-[#C9A962]/5 border-[#C9A962]/20"
      />
    )}

    {/* Content */}
    <div className="relative z-10 p-8 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 backdrop-blur-md rounded-sm border transition-all duration-300 ${
          isInCart ? 'bg-[#C9A962]/20 border-[#C9A962]/40' : 'bg-black/40 border-[#C9A962]/30'
        }`}>
          {icon}
        </div>
        <span className={`text-[10px] font-primary font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border ${
          highlight 
            ? 'bg-[#C9A962] text-[#0A0A0A] border-[#C9A962]' 
            : 'bg-black/40 text-[#C9A962] border-[#C9A962]/40'
        }`}>
          {tag}
        </span>
      </div>

      <h3 className={`font-secondary text-2xl md:text-3xl mb-4 transition-colors duration-300 ${
        isInCart ? 'text-[#C9A962]' : 'text-white group-hover:text-[#C9A962]'
      }`}>
        {title}
      </h3>
      
      <p className="font-primary text-white/60 text-sm leading-relaxed mb-6 max-w-sm">
        {desc}
      </p>

      <div className="mt-auto pt-6 border-t border-white/10">
        <ul className={`grid gap-3 mb-6 ${bullets.length > 3 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {bullets.slice(0, 6).map((b, i) => (
            <li key={i} className="flex items-center gap-3 font-primary text-xs text-white/50 group-hover:text-white/70 transition-colors">
              <CheckCircle className="w-3.5 h-3.5 text-[#C9A962]/60 shrink-0" />
              <span className="line-clamp-2">{b}</span>
            </li>
          ))}
        </ul>

        {/* Add to cart button with animated golden border */}
        <div className={`relative p-[1px] rounded-sm overflow-hidden group/btn mt-auto transition-all ${isInCart ? '' : 'shadow-[0_0_20px_rgba(201,169,98,0.15)]'}`}>
          {!isInCart && (
            <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(201,169,98,0)_0%,rgba(201,169,98,0.8)_50%,rgba(201,169,98,0)_100%)]" />
          )}
          <motion.button
            onClick={onToggle}
            whileTap={{ scale: 0.98 }}
            className={`relative w-full flex items-center justify-center gap-2 py-3.5 font-primary font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 rounded-sm ${
              isInCart
                ? 'bg-[#C9A962] text-[#0A0A0A] shadow-[0_0_20px_rgba(201,169,98,0.3)]'
                : 'bg-[#0A0A0A]/90 backdrop-blur-xl text-[#C9A962] hover:bg-[#C9A962]/10 hover:text-white'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isInCart ? (
                <motion.span
                  key="selected"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" /> {t('services.cart.button_selected')}
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('services.cart.button_add')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
    </motion.div>
  );
};

export const Servicios = () => {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const cart = useServiceCart();

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const serviciosPropietario: (Omit<CartService, 'id'> & { icon: React.ReactNode; cartIcon: string; image: string; bullets: string[]; className: string; highlight?: boolean; id: string })[] = [
    {
      id: 'compraventa',
      icon: <Building2 className="w-6 h-6 text-[#C9A962]" />,
      cartIcon: '🏠',
      titleKey: 'services.owner_services.compra_venta.title',
      tagKey: 'services.owner_services.compra_venta.tag',
      descKey: 'services.owner_services.compra_venta.desc',
      title: t('services.owner_services.compra_venta.title'),
      tag: t('services.owner_services.compra_venta.tag'),
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop',
      desc: t('services.owner_services.compra_venta.desc'),
      bullets: t('services.owner_services.compra_venta.bullets', { returnObjects: true }) as string[],
      className: "md:col-span-1 md:row-span-1 min-h-[480px]",
      highlight: true
    },
    {
      id: 'alquiler',
      icon: <Key className="w-6 h-6 text-[#C9A962]" />,
      cartIcon: '🔑',
      titleKey: 'services.owner_services.alquiler.title',
      tagKey: 'services.owner_services.alquiler.tag',
      descKey: 'services.owner_services.alquiler.desc',
      title: t('services.owner_services.alquiler.title'),
      tag: t('services.owner_services.alquiler.tag'),
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop',
      desc: t('services.owner_services.alquiler.desc'),
      bullets: t('services.owner_services.alquiler.bullets', { returnObjects: true }) as string[],
      className: "md:col-span-1 md:row-span-1 min-h-[480px]"
    },
    {
      id: 'traspaso',
      icon: <Briefcase className="w-6 h-6 text-[#C9A962]" />,
      cartIcon: '💼',
      titleKey: 'services.owner_services.traspaso.title',
      tagKey: 'services.owner_services.traspaso.tag',
      descKey: 'services.owner_services.traspaso.desc',
      title: t('services.owner_services.traspaso.title'),
      tag: t('services.owner_services.traspaso.tag'),
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop',
      desc: t('services.owner_services.traspaso.desc'),
      bullets: t('services.owner_services.traspaso.bullets', { returnObjects: true }) as string[],
      className: "md:col-span-1 md:row-span-1 min-h-[480px]"
    },
    {
      id: 'administracion',
      icon: <ShieldCheck className="w-6 h-6 text-[#C9A962]" />,
      cartIcon: '🛡️',
      titleKey: 'services.owner_services.administracion.title',
      tagKey: 'services.owner_services.administracion.tag',
      descKey: 'services.owner_services.administracion.desc',
      title: t('services.owner_services.administracion.title'),
      tag: t('services.owner_services.administracion.tag'),
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
      desc: t('services.owner_services.administracion.desc'),
      bullets: t('services.owner_services.administracion.bullets', { returnObjects: true }) as string[],
      className: "md:col-span-1 md:row-span-1 min-h-[480px]"
    },
    {
      id: 'seguro_impago',
      icon: <ShieldCheck className="w-6 h-6 text-[#C9A962]" />,
      cartIcon: '🛡️',
      titleKey: 'services.owner_services.seguro_impago.title',
      tagKey: 'services.owner_services.seguro_impago.tag',
      descKey: 'services.owner_services.seguro_impago.desc',
      title: t('services.owner_services.seguro_impago.title'),
      tag: t('services.owner_services.seguro_impago.tag'),
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1000&auto=format&fit=crop',
      desc: t('services.owner_services.seguro_impago.desc'),
      bullets: t('services.owner_services.seguro_impago.bullets', { returnObjects: true }) as string[],
      className: "md:col-span-2 md:row-span-1 min-h-[400px]",
      highlight: true
    },
  ];

  const whyChooseUsItems = [
    { icon: <Star className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.specialists.label'), desc: t('services.why_choose_us.items.specialists.desc') },
    { icon: <ShieldCheck className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.agile.label'), desc: t('services.why_choose_us.items.agile.desc') },
    { icon: <CheckCircle className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.personalized.label'), desc: t('services.why_choose_us.items.personalized.desc') },
    { icon: <Building2 className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.off_market.label'), desc: t('services.why_choose_us.items.off_market.desc') },
    { icon: <Key className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.profitability.label'), desc: t('services.why_choose_us.items.profitability.desc') },
    { icon: <Phone className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.availability.label'), desc: t('services.why_choose_us.items.availability.desc') },
  ];

  return (
    <div className="w-full bg-[#050505] overflow-hidden" ref={containerRef}>
      <Helmet>
        <title>{t('services.seo.title')}</title>
        <meta name="description" content={t('services.seo.description')} />
        <link rel="alternate" hrefLang="es" href="https://gelaberthomes.es/servicios/" />
        <link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/servicios/" />
      </Helmet>

      {/* Premium Mesh Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C9A962]/5 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#C9A962]/3 blur-[150px] rounded-full mix-blend-screen animation-delay-2000" />
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center border-b border-white/5 overflow-hidden">
        <motion.div 
          style={{ opacity, scale }}
          className="absolute inset-0 z-0"
        >
          <div 
            className="w-full h-full bg-cover bg-center brightness-[0.2]"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600607687940-c52af0493738?q=80&w=2070&auto=format&fit=crop')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
        </motion.div>

        <div className="relative z-10 px-6 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col items-center gap-8"
          >
            <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A962]" />
              <span className="font-primary text-[10px] text-[#C9A962] uppercase tracking-[0.4em] font-bold">
                {t('services.hero.badge')}
              </span>
            </div>

            <h1 className="font-secondary text-5xl md:text-8xl text-[#FAF8F5] leading-[1] tracking-tight">
              {t('services.hero.title_1')}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A962] via-[#F3E2B9] to-[#C9A962] italic">
                {t('services.hero.title_2')}
              </span>
            </h1>

            <p className="font-primary text-[#DFDFE6]/60 text-lg md:text-xl leading-relaxed max-w-2xl font-light">
              {t('services.hero.subtitle')}
            </p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 flex flex-col items-center gap-4"
            >
              <div className="w-[1px] h-24 bg-gradient-to-b from-[#C9A962] to-transparent animate-bounce-slow" />
              <span className="text-[10px] uppercase tracking-widest text-[#C9A962]/50 font-bold">Explore</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Services Bento Grid */}
      <section className="relative z-10 w-full px-6 py-32 max-w-7xl mx-auto">
        <motion.div {...(fadeUp as any)} className="flex flex-col items-center text-center gap-4 mb-20">
          <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold">
            {t('services.owners.badge')}
          </span>
          <h2 className="font-secondary text-4xl md:text-6xl text-white">
            {t('services.owners.title')}
          </h2>
          <div className="w-20 h-1 bg-[#C9A962] mt-2 rounded-full" />
        </motion.div>

        {/* Info Note about selection */}
        <motion.div 
          {...(fadeUp as any)}
          className="max-w-4xl mx-auto mb-16 p-8 md:p-10 bg-white/[0.02] border border-[#C9A962]/20 backdrop-blur-xl rounded-sm flex flex-col md:flex-row items-center gap-8 text-center md:text-left shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A962]/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[#C9A962]/10 transition-colors duration-700" />
          
          <div className="w-16 h-16 shrink-0 bg-[#C9A962] flex items-center justify-center rounded-sm shadow-[0_10px_30px_rgba(201,169,98,0.2)]">
            <ShoppingBag className="w-7 h-7 text-[#0A0A0A]" />
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-secondary text-[#C9A962] text-xl uppercase tracking-wider">
              {t('services.cart.floating_view')}
            </h4>
            <p className="font-primary text-[#FAF8F5]/70 text-base leading-relaxed italic">
              "{t('services.cart.note')}"
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
          {serviciosPropietario.map((s) => (
            <ServiceCard
              key={s.id}
              {...s}
              isInCart={cart.isInCart(s.id)}
              onToggle={() => cart.toggleService({
                id: s.id,
                titleKey: s.titleKey,
                tagKey: s.tagKey,
                descKey: s.descKey,
                title: s.title,
                tag: s.tag,
                icon: s.cartIcon,
                desc: s.desc,
              })}
            />
          ))}
        </div>
      </section>

      {/* Tenant Premium Banner */}
      <section className="relative w-full py-40 bg-[#080808] border-y border-white/5 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div {...(fadeUp as any)}>
            <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold mb-4 block">
              {t('services.tenants.badge')}
            </span>
            <h2 className="font-secondary text-4xl md:text-6xl text-[#FAF8F5] mb-8 leading-tight">
              {t('services.tenants.title')}
            </h2>
            <div className="flex flex-col gap-6 text-[#888888] font-primary text-lg leading-relaxed mb-10">
              <p>{t('services.tenants.description')}</p>
              <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {(t('services.tenant_search.bullets', { returnObjects: true }) as string[]).map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/50">
                    <CheckCircle className="w-4 h-4 text-[#C9A962]" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className={`relative p-[1px] rounded-sm overflow-hidden group/btn transition-all ${cart.isInCart('tenant_search') ? '' : 'shadow-[0_0_20px_rgba(201,169,98,0.15)]'}`}>
                {!cart.isInCart('tenant_search') && (
                  <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(201,169,98,0)_0%,rgba(201,169,98,0.8)_50%,rgba(201,169,98,0)_100%)]" />
                )}
                <button
                  onClick={() => cart.toggleService({
                    id: 'tenant_search',
                    titleKey: 'services.tenant_search.title',
                    tagKey: 'services.tenant_search.tag',
                    descKey: 'services.tenant_search.desc',
                    title: t('services.tenant_search.title'),
                    tag: t('services.tenant_search.tag'),
                    icon: "🔑",
                    desc: t('services.tenant_search.desc')
                  })}
                  className={`relative w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 font-primary font-bold text-xs uppercase tracking-widest transition-all rounded-sm ${
                    cart.isInCart('tenant_search')
                      ? "bg-[#C9A962] text-[#0A0A0A] shadow-[0_0_20px_rgba(201,169,98,0.3)]"
                      : "bg-[#0A0A0A]/90 backdrop-blur-xl text-[#C9A962] hover:bg-[#C9A962]/10 hover:text-white"
                  }`}
                >
                  {cart.isInCart('tenant_search') ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> {t('services.cart.button_selected')}
                    </>
                  ) : (
                    <>
                      {t('services.tenants.request_search')} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              <Link
                to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`}
                className="flex items-center justify-center gap-3 px-8 py-4 border border-white/10 text-white font-primary font-bold text-xs uppercase tracking-widest hover:bg-white/5 rounded-sm transition-all"
              >
                {t('services.tenants.view_properties')}
              </Link>
            </div>
          </motion.div>

          <motion.div 
            {...fadeUp}
            className="relative h-[400px] lg:h-[500px] rounded-sm overflow-hidden border border-white/5 group shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1600607687644-c7171b42498f?q=80&w=2070&auto=format&fit=crop" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              alt="Hogar de calidad"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us: Premium Reveal */}
      <section className="w-full px-6 py-32 max-w-7xl mx-auto overflow-hidden">
        <motion.div {...(fadeUp as any)} className="text-center mb-24">
          <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5] mb-4">
            {t('services.why_choose_us.title')}
          </h2>
          <div className="w-16 h-0.5 bg-[#C9A962] mx-auto opacity-40" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {whyChooseUsItems.map((item, i) => (
            <motion.div 
              key={i} 
              {...fadeUp} 
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-[#050505] p-10 flex flex-col gap-6 hover:bg-[#0A0A0A] transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-black border border-white/5 group-hover:border-[#C9A962]/40 transition-all duration-300">
                {item.icon}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-primary text-white font-bold text-sm uppercase tracking-wide group-hover:text-[#C9A962] transition-colors">
                  {item.label}
                </h3>
                <p className="font-primary text-white/40 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final Premium CTA */}
      <section className="relative w-full py-40 flex flex-col items-center justify-center overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-40 brightness-[0.7] scale-105"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        </div>
        
        <div className="absolute inset-0 bg-[#C9A962]/[0.05] mix-blend-overlay z-[1]" />
        
        <motion.div 
          {...fadeUp}
          className="relative z-10 text-center px-6 max-w-3xl flex flex-col items-center gap-8"
        >
          <div className="w-12 h-12 bg-black border border-[#C9A962]/30 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#C9A962]" />
          </div>
          <h2 className="font-secondary text-4xl md:text-7xl text-white">
            {t('services.final_cta.title_part1')}
            <span className="italic text-[#C9A962]">
              {t('services.final_cta.title_highlight')}
            </span>
          </h2>
          <p className="font-primary text-[#888888] text-lg max-w-xl">
            {t('services.final_cta.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 mt-6">
            <Link
              to={`${i18n.language.startsWith('en') ? '/en' : ''}/contacto`}
              className="px-12 py-5 bg-[#C9A962] text-black font-primary font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_10px_30px_rgba(201,169,98,0.2)]"
            >
              {t('services.final_cta.contact_btn')}
            </Link>
            <Link
              to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`}
              className="px-12 py-5 border border-white/10 text-white font-primary font-bold text-xs uppercase tracking-widest hover:bg-white/5 hover:border-[#C9A962]/40 transition-all"
            >
              {t('services.final_cta.view_listings_btn')}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.count > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.92 }}
            onClick={cart.openCart}
            className="fixed bottom-28 right-6 z-50 flex items-center gap-3 pr-5 pl-4 py-3.5 bg-[#C9A962] text-[#0A0A0A] rounded-full shadow-[0_10px_40px_rgba(201,169,98,0.4)] hover:brightness-110 transition-all"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <motion.span
                key={cart.count}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-4 h-4 bg-[#0A0A0A] text-[#C9A962] text-[9px] font-bold rounded-full flex items-center justify-center font-primary"
              >
                {cart.count}
              </motion.span>
            </div>
            <span className="font-primary text-[10px] uppercase tracking-[0.2em] font-bold">
              {t('services.cart.floating_view')}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Service Cart Drawer */}
      <ServiceCartDrawer
        isOpen={cart.isOpen}
        onClose={cart.closeCart}
        cartItems={cart.cartItems}
        onRemove={cart.removeService}
        onClear={cart.clearCart}
      />

      {/* Hidden Netlify form for static detection */}
      <form name="service-inquiry" data-netlify="true" data-netlify-honeypot="bot-field" hidden>
        <input name="name" />
        <input name="email" />
        <input name="phone" />
        <input name="services" />
        <input name="message" />
        <input name="bot-field" />
      </form>
    </div>
  );
};
