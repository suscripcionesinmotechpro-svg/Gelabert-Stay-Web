import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { 
  Users, Target, History, Heart, Shield, Award, User, Zap,
  Camera, Video, Scale, Palette
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' as const },
  transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as any },
};

const partnerServices = [
  { icon: Camera, label: 'Fotografía de Arquitectura' },
  { icon: Video, label: 'Vídeo Aéreo (Drones)' },
  { icon: Scale, label: 'Asesoramiento Jurídico-Fiscal' },
  { icon: Palette, label: 'Home Staging' }
];

const Nosotros = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-[#050505] overflow-hidden">
      <Helmet>
        <title>{t('nosotros.seo.title')}</title>
        <meta name="description" content={t('nosotros.seo.description')} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center border-b border-white/5 py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center brightness-[0.4] saturate-[1.2]"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=2000&auto=format&fit=crop')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/20 to-[#050505]" />
        </div>

        <div className="relative z-10 px-6 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Users className="w-3.5 h-3.5 text-[#C9A962]" />
              <span className="font-primary text-[10px] text-[#C9A962] uppercase tracking-[0.4em] font-bold">
                {t('nosotros.hero.badge')}
              </span>
            </div>
            <h1 className="font-secondary text-5xl md:text-7xl text-white max-w-4xl leading-[1.1]">
              {t('nosotros.hero.title')}
            </h1>
            <p className="font-primary text-white/60 text-lg md:text-xl max-w-2xl font-light">
              {t('nosotros.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="relative z-10 py-24 md:py-32 px-6 max-w-7xl mx-auto scroll-mt-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div {...fadeUp}>
            <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold mb-4 block">
              {t('nosotros.vision.badge')}
            </span>
            <h2 className="font-secondary text-4xl md:text-5xl text-white mb-8 leading-[1.2]">
              {t('nosotros.vision.title')}
            </h2>
            <div className="space-y-6 text-white/60 font-primary text-lg leading-relaxed font-light">
              <p>{t('nosotros.vision.p1')}</p>
              <p>{t('nosotros.vision.p2')}</p>
              <p>{t('nosotros.vision.p3')}</p>
            </div>
          </motion.div>

          <motion.div 
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square rounded-sm overflow-hidden border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop" 
                alt="Vision"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#C9A962]/10 blur-[100px] -z-10" />
            <div className="absolute top-1/2 -translate-y-1/2 -left-10 hidden lg:block">
              <div className="bg-[#C9A962] text-[#050505] px-8 py-12 flex flex-col items-center gap-2">
                <Target className="w-8 h-8 mb-4" />
                <span className="font-secondary text-4xl">100%</span>
                <span className="font-primary text-[10px] uppercase tracking-widest font-bold text-center">
                  {t('nosotros.vision.context')}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* History Section */}
      <section id="history" className="bg-white/5 border-y border-white/5 py-24 md:py-32 px-6 scroll-mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <motion.div 
              {...fadeUp}
              className="md:w-1/3"
            >
              <div className="flex items-center gap-4 mb-6">
                <History className="w-6 h-6 text-[#C9A962]" />
                <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold">
                  {t('nosotros.history.badge')}
                </span>
              </div>
              <h2 className="font-secondary text-4xl md:text-5xl text-white leading-[1.2]">
                {t('nosotros.history.title')}
              </h2>
            </motion.div>
            <motion.div 
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-12"
            >
              <p className="font-primary text-white/50 text-lg leading-relaxed">
                {t('nosotros.history.p1')} {t('nosotros.history.p2')}
              </p>
              <p className="font-primary text-white/50 text-lg leading-relaxed">
                {t('nosotros.history.p3')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 md:py-32 px-6 max-w-7xl mx-auto scroll-mt-40">
        <motion.div {...fadeUp} className="flex flex-col items-center gap-4 text-center mb-20">
          <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold">
            {t('nosotros.team.badge')}
          </span>
          <h2 className="font-secondary text-4xl md:text-5xl text-white">
            {t('nosotros.team.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-5xl mx-auto">
          {/* Portrait */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="group relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-white/10 transition-colors duration-500 group-hover:border-[#C9A962]/40">
              <img
                src="/images/team/jose-carlos.jpg"
                alt="José Carlos Delgado Gelabert"
                className="w-full h-full object-cover transition-all duration-700 grayscale scale-100 group-hover:grayscale-0 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent opacity-60 transition-opacity group-hover:opacity-30" />
            </div>
            {/* Golden corner accents */}
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b border-l border-[#C9A962]/40" />
            <div className="absolute -top-4 -right-4 w-24 h-24 border-t border-r border-[#C9A962]/40" />
            {/* Ambient glow */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#C9A962]/8 blur-[100px] -z-10" />
          </motion.div>

          {/* Bio & Details */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.25 }}
            className="space-y-8"
          >
            {/* Name & role */}
            <div>
              <p className="font-primary text-[10px] text-[#C9A962] uppercase tracking-[0.3em] font-bold mb-3">
                {t('nosotros.team.badge')}
              </p>
              <h3 className="font-secondary text-3xl md:text-4xl text-white leading-tight mb-2">
                José Carlos Delgado Gelabert
              </h3>
              <p className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.2em] font-bold">
                CEO & Founder
              </p>
              <div className="w-12 h-px bg-[#C9A962]/50 mt-4" />
            </div>

            {/* Bio text */}
            <p className="font-primary text-white/60 text-lg leading-relaxed font-light">
              {t('nosotros.team.jose.bio')}
            </p>

            {/* Quick-stats row */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { value: '3+', label: t('nosotros.team.stat1', 'Años en el sector') },
                { value: '100%', label: t('nosotros.team.stat2', 'Trato directo') },
                { value: '360°', label: t('nosotros.team.stat3', 'Servicio integral') },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: 0.35 + i * 0.1 }}
                  className="border border-white/10 rounded-sm p-4 text-center hover:border-[#C9A962]/30 transition-colors duration-300"
                >
                  <span className="font-secondary text-2xl text-[#C9A962] block">{stat.value}</span>
                  <span className="font-primary text-[9px] text-white/40 uppercase tracking-widest">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>


      {/* Boutique Network Section */}
      <section id="innovation" className="bg-white/5 border-y border-white/5 py-24 md:py-32 px-6 overflow-hidden scroll-mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeUp} className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#C9A962]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#C9A962]" />
                </div>
                <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold">
                  {t('nosotros.innovation.badge')}
                </span>
              </div>
              <h2 className="font-secondary text-4xl md:text-5xl text-white mb-8 leading-[1.2]">
                {t('nosotros.innovation.title')}
              </h2>
              <div className="space-y-6 text-white/60 font-primary text-lg leading-relaxed font-light">
                <p>{t('nosotros.innovation.p1')}</p>
                <p>{t('nosotros.innovation.p2')}</p>
              </div>
            </motion.div>

            <motion.div 
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.3 }}
              className="relative"
            >
              {/* Partner Services Grid */}
              <div className="grid grid-cols-2 gap-4">
                {partnerServices.map((partner, i) => (
                  <motion.div
                    key={i}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: 0.35 + i * 0.1 }}
                    className="group border border-white/10 rounded-sm p-6 flex flex-col items-center text-center gap-4 hover:border-[#C9A962]/40 hover:bg-[#C9A962]/5 transition-all duration-500 cursor-default"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#C9A962]/10 flex items-center justify-center group-hover:bg-[#C9A962]/20 transition-colors duration-500">
                      <partner.icon className="w-5 h-5 text-[#C9A962]" />
                    </div>
                    <span className="font-primary text-[10px] text-white/50 uppercase tracking-[0.15em] group-hover:text-white/80 transition-colors duration-300">
                      {partner.label}
                    </span>
                  </motion.div>
                ))}
              </div>
              {/* Decorative corner lines */}
              <div className="absolute -top-6 -right-6 w-32 h-32 border-t border-r border-[#C9A962]/30" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border-b border-l border-[#C9A962]/30" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values / Pillars Section */}
      <section id="values" className="relative py-32 md:py-40 bg-[#0A0A0A] overflow-hidden scroll-mt-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,169,98,0.15),transparent)]" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div {...fadeUp}>
            <User className="w-10 h-10 text-[#C9A962] mx-auto mb-8" />
            <h2 className="font-secondary text-4xl md:text-6xl text-white mb-8">
              {t('nosotros.values.title')}
            </h2>
            <div className="space-y-6 text-white/60 font-primary text-xl font-light">
              <p>{t('nosotros.values.p1')}</p>
              <p>{t('nosotros.values.p2')}</p>
            </div>
            <div className="pt-12">
              <div className="w-px h-16 bg-[#C9A962]/30 mx-auto mb-8" />
              <p className="font-secondary text-2xl text-white/90 italic">
                &ldquo;{t('nosotros.values.closing')}&rdquo;
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24">
            {[
              { icon: Heart, label: t('nosotros.values.items.commitment') },
              { icon: Shield, label: t('nosotros.values.items.transparency') },
              { icon: Award, label: t('nosotros.values.items.excellence') },
              { icon: Zap, label: t('nosotros.values.items.innovation') }
            ].map((value, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="flex flex-col items-center gap-4 group"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#C9A962]/40 group-hover:bg-[#C9A962]/5 transition-all duration-500">
                  <value.icon className="w-6 h-6 text-[#C9A962]" />
                </div>
                <span className="font-primary text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                  {value.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Nosotros;
