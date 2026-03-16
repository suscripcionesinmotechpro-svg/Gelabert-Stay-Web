import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  Key, Building2, Briefcase, ShieldCheck, Search,
  CheckCircle, Phone, ArrowRight, Star
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' as const },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  tag: string;
  image: string;
  desc: string;
  bullets: string[];
  highlight?: boolean;
}

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  tag: string;
  image: string;
  desc: string;
  bullets: string[];
  highlight?: boolean;
}

const ServiceCard = ({ icon, title, tag, image, desc, bullets, highlight = false }: ServiceCardProps) => (
  <motion.div
    {...fadeUp}
    className={`flex flex-col border transition-colors group overflow-hidden ${
      highlight ? 'border-[#C9A962] bg-[#C9A962]/5' : 'border-[#1F1F1F] bg-[#161616] hover:border-[#C9A962]'
    }`}
  >
    {/* Photo */}
    <div className="relative w-full h-48 overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover brightness-75 group-hover:brightness-90 group-hover:scale-105 transition-all duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-transparent" />
      {/* Tag overlay */}
      <span className={`absolute top-4 left-4 text-[10px] font-primary font-bold tracking-widest uppercase px-2 py-1 ${
        highlight ? 'bg-[#C9A962] text-[#0A0A0A]' : 'bg-[#0A0A0A]/80 border border-[#C9A962]/40 text-[#C9A962]'
      }`}>
        {tag}
      </span>
    </div>

    {/* Content */}
    <div className="flex flex-col gap-4 p-6 flex-1">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#0A0A0A] border border-[#1F1F1F]">{icon}</div>
        <h3 className="font-secondary text-xl text-[#FAF8F5] group-hover:text-[#C9A962] transition-colors leading-tight">
          {title}
        </h3>
      </div>
      <p className="font-primary text-[#888888] text-sm leading-relaxed">{desc}</p>
      <ul className="flex flex-col gap-2 pt-3 border-t border-[#1F1F1F] mt-auto">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 font-primary text-sm text-[#888888]">
            <CheckCircle className="w-4 h-4 text-[#C9A962] shrink-0 mt-0.5" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

export const Servicios = () => {
  const { t, i18n } = useTranslation();

  const serviciosPropietario = [
    {
      icon: <Building2 className="w-6 h-6 text-[#C9A962]" />,
      title: t('services.owner_services.compra_venta.title'),
      tag: t('services.owner_services.compra_venta.tag'),
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop',
      desc: t('services.owner_services.compra_venta.desc'),
      bullets: t('services.owner_services.compra_venta.bullets', { returnObjects: true }) as string[],
    },
    {
      icon: <Key className="w-6 h-6 text-[#C9A962]" />,
      title: t('services.owner_services.alquiler.title'),
      tag: t('services.owner_services.alquiler.tag'),
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000&auto=format&fit=crop',
      desc: t('services.owner_services.alquiler.desc'),
      bullets: t('services.owner_services.alquiler.bullets', { returnObjects: true }) as string[],
    },
    {
      icon: <Briefcase className="w-6 h-6 text-[#C9A962]" />,
      title: t('services.owner_services.traspaso.title'),
      tag: t('services.owner_services.traspaso.tag'),
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop',
      desc: t('services.owner_services.traspaso.desc'),
      bullets: t('services.owner_services.traspaso.bullets', { returnObjects: true }) as string[],
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#C9A962]" />,
      title: t('services.owner_services.administracion.title'),
      tag: t('services.owner_services.administracion.tag'),
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
      desc: t('services.owner_services.administracion.desc'),
      bullets: t('services.owner_services.administracion.bullets', { returnObjects: true }) as string[],
    },
  ];

  const servicioInquilino = {
    icon: <Search className="w-6 h-6 text-[#C9A962]" />,
    title: t('services.tenant_search.title'),
    tag: t('services.tenant_search.tag'),
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop',
    desc: t('services.tenant_search.desc'),
    bullets: t('services.tenant_search.bullets', { returnObjects: true }) as string[],
  };

  const whyChooseUsItems = [
    { icon: <Star className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.specialists.label'), desc: t('services.why_choose_us.items.specialists.desc') },
    { icon: <ShieldCheck className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.agile.label'), desc: t('services.why_choose_us.items.agile.desc') },
    { icon: <CheckCircle className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.personalized.label'), desc: t('services.why_choose_us.items.personalized.desc') },
    { icon: <Building2 className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.off_market.label'), desc: t('services.why_choose_us.items.off_market.desc') },
    { icon: <Key className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.profitability.label'), desc: t('services.why_choose_us.items.profitability.desc') },
    { icon: <Phone className="w-6 h-6 text-[#C9A962]" />, label: t('services.why_choose_us.items.availability.label'), desc: t('services.why_choose_us.items.availability.desc') },
  ];

  return (
    <div className="w-full pb-20 bg-[#0A0A0A]">
      <Helmet>
        <title>{t('services.seo.title')}</title>
        <meta name="description" content={t('services.seo.description')} />
        <meta property="og:title" content={t('services.seo.og_title')} />
        <meta property="og:description" content={t('services.seo.og_description')} />
      </Helmet>
      {/* Header / Hero Section */}
      <section className="relative w-full min-h-[50vh] flex items-center overflow-hidden border-b border-[#1F1F1F]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600607687940-c52af0493738?q=80&w=2070&auto=format&fit=crop" 
            alt="Luxury Real Estate" 
            className="w-full h-full object-cover brightness-[0.25]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
        </div>

        <div className="relative z-10 w-full px-6 md:px-14 py-24">
          <motion.div {...fadeUp} className="max-w-4xl flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[#C9A962]" />
              <span className="font-primary text-xs text-[#C9A962] uppercase tracking-[0.3em] font-bold">
                {t('services.hero.badge')}
              </span>
            </div>
            
            <h1 className="font-secondary text-5xl md:text-7xl text-[#FAF8F5] leading-[1.1]">
              {t('services.hero.title_1')}<br />
              <span className="text-[#C9A962] italic relative">
                {t('services.hero.title_2')}
                <span className="absolute -bottom-2 left-0 w-full h-px bg-[#C9A962]/30" />
              </span>
            </h1>

            <div className="font-primary text-[#DFDFE6] text-xl md:text-2xl leading-relaxed max-w-2xl font-light">
              {t('services.hero.subtitle')}
              <span className="block mt-4 text-[#C9A962]/80 text-lg italic">{t('services.hero.subtitle_italic')}</span>
            </div>
          </motion.div>
        </div>

        {/* Decorative element */}
        <div className="absolute right-0 bottom-0 w-1/4 h-full bg-[#C9A962]/5 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
      </section>

      {/* — PARA PROPIETARIOS — */}
      <section className="w-full px-6 md:px-14 py-20">
        <motion.div {...fadeUp} className="flex flex-col gap-3 mb-12">
          <span className="font-primary text-xs text-[#C9A962] uppercase tracking-[0.2em]">{t('services.owners.badge')}</span>
          <h2 className="font-secondary text-4xl text-[#FAF8F5]">{t('services.owners.title')}</h2>
          <p className="font-primary text-[#888888] max-w-2xl">
            {t('services.owners.description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {serviciosPropietario.map((s, i) => (
            <ServiceCard key={i} {...s} />
          ))}
        </div>

        <motion.div {...fadeUp} className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            to={`${i18n.language.startsWith('en') ? '/en' : ''}/propietarios`}
            className="flex items-center gap-2 px-6 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors self-start"
          >
            {t('services.owners.more_info')} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C9A962]/30 to-transparent" />

      {/* — PARA INQUILINOS — */}
      <section className="w-full px-6 md:px-14 py-20 bg-[#0F0F0F]">
        <motion.div {...fadeUp} className="flex flex-col gap-3 mb-12">
          <span className="font-primary text-xs text-[#C9A962] uppercase tracking-[0.2em]">{t('services.tenants.badge')}</span>
          <h2 className="font-secondary text-4xl text-[#FAF8F5]">{t('services.tenants.title')}</h2>
          <p className="font-primary text-[#888888] max-w-2xl">
            {t('services.tenants.description')}
          </p>
        </motion.div>

        {/* Full-width premium card for the single tenant service */}
        <motion.div
          {...fadeUp}
          className="border border-[#C9A962] bg-[#C9A962]/5 overflow-hidden group"
        >
          {/* Photo banner */}
          <div className="relative w-full h-64 md:h-80 overflow-hidden">
            <img
              src={servicioInquilino.image}
              alt={servicioInquilino.title}
              className="w-full h-full object-cover brightness-60 group-hover:brightness-75 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
            <div className="absolute bottom-6 left-6 flex flex-col gap-2">
              <span className="self-start text-[10px] font-primary font-bold tracking-widest uppercase px-2 py-1 bg-[#C9A962] text-[#0A0A0A]">
                {servicioInquilino.tag}
              </span>
              <h3 className="font-secondary text-3xl md:text-4xl text-[#FAF8F5]">{servicioInquilino.title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#0A0A0A] border border-[#1F1F1F]">{servicioInquilino.icon}</div>
              </div>
              <p className="font-primary text-[#888888] text-sm leading-relaxed">{servicioInquilino.desc}</p>
              <Link
                to={`${i18n.language.startsWith('en') ? '/en' : ''}/contacto`}
                className="flex items-center gap-2 px-5 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors self-start mt-2"
              >
                {t('services.tenants.request_search')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="md:w-2/3">
              <p className="font-primary text-xs text-[#C9A962] uppercase tracking-wider mb-4">{t('services.tenants.includes')}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {servicioInquilino.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 font-primary text-sm text-[#888888]">
                    <CheckCircle className="w-4 h-4 text-[#C9A962] shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="mt-8 flex justify-center">
          <Link
            to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`}
            className="flex items-center gap-2 px-6 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#C9A962] hover:text-[#C9A962] transition-colors"
          >
            {t('services.tenants.view_properties')} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C9A962]/30 to-transparent" />

      {/* — POR QUÉ ELEGIRNOS — */}
      <section className="w-full px-6 md:px-14 py-20 bg-[#0A0A0A]">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-secondary text-4xl text-[#FAF8F5] mb-4">{t('services.why_choose_us.title')}</h2>
          <p className="font-primary text-[#888888]">{t('services.why_choose_us.subtitle')}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyChooseUsItems.map((item, i) => (
            <motion.div key={i} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.07, ease: 'easeOut' as const }} className="flex flex-col gap-3 p-6 border border-[#1F1F1F] hover:border-[#C9A962]/40 transition-colors">
              <div className="w-10 h-10 flex items-center justify-center border border-[#1F1F1F] bg-[#0F0F0F]">{item.icon}</div>
              <h3 className="font-primary text-[#FAF8F5] font-bold text-sm">{item.label}</h3>
              <p className="font-primary text-[#666666] text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="w-full px-6 md:px-14 py-20 bg-[#0F0F0F] border-t border-[#1F1F1F] flex flex-col items-center text-center gap-6">
        <motion.div {...fadeUp} className="flex flex-col gap-4 items-center">
          <h2 className="font-secondary text-4xl text-[#FAF8F5]">{t('services.final_cta.title')}</h2>
          <p className="font-primary text-[#888888] max-w-xl">
            {t('services.final_cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              to={`${i18n.language.startsWith('en') ? '/en' : ''}/contacto`}
              className="px-8 py-4 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
            >
              {t('services.final_cta.contact_now')}
            </Link>
            <Link
              to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`}
              className="px-8 py-4 border border-[#C9A962] text-[#C9A962] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-colors"
            >
              {t('services.final_cta.view_properties')}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
