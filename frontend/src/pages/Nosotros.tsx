import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { 
  Users, Target, History, Rocket, 
  Heart, Shield, Award, Sparkles 
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' as const },
  transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as any },
};

const TeamMember = ({ name, role, bio, image, delay = 0 }: { 
  name: string; 
  role: string; 
  bio: string; 
  image: string;
  delay?: number;
}) => (
  <motion.div
    {...fadeUp}
    transition={{ ...fadeUp.transition, delay }}
    className="group relative"
  >
    <div className="relative aspect-[4/5] overflow-hidden rounded-sm mb-6 border border-white/10 group-hover:border-[#C9A962]/40 transition-colors duration-500">
      <img 
        src={image} 
        alt={name}
        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
    </div>
    <div className="space-y-2">
      <h3 className="font-secondary text-2xl text-white group-hover:text-[#C9A962] transition-colors">
        {name}
      </h3>
      <p className="font-primary text-[10px] text-[#C9A962] uppercase tracking-[0.2em] font-bold">
        {role}
      </p>
      <div className="w-8 h-px bg-[#C9A962]/40" />
      <p className="font-primary text-white/50 text-sm leading-relaxed pt-2">
        {bio}
      </p>
    </div>
  </motion.div>
);

const Nosotros = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-[#050505] overflow-hidden">
      <Helmet>
        <title>{t('nosotros.seo.title')}</title>
        <meta name="description" content={t('nosotros.seo.description')} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center border-b border-white/5 overflow-hidden">
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
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
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
      <section className="bg-white/5 border-y border-white/5 py-32 px-6">
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
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.div {...fadeUp} className="flex flex-col items-center gap-4">
            <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold">
              {t('nosotros.team.badge')}
            </span>
            <h2 className="font-secondary text-4xl md:text-5xl text-white">
              {t('nosotros.team.title')}
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl mx-auto">
          <TeamMember 
            name="José Carlos Delgado Gelabert"
            role="Founder & Commercial Director"
            bio={t('nosotros.team.jose.bio')}
            image="/images/team/jose-carlos.jpg"
            delay={0.1}
          />
          <TeamMember 
            name="Juan Carlos Sánchez Morente"
            role="Founder & Sales Director"
            bio={t('nosotros.team.juan.bio')}
            image="/images/team/juan-carlos.jpg"
            delay={0.2}
          />
        </div>
      </section>

            <h2 className="font-secondary text-4xl md:text-6xl text-white mb-8">
              {t('nosotros.values.title')}
            </h2>
            <p className="font-primary text-white/70 text-xl leading-relaxed mb-12">
              {t('nosotros.values.p1')}
            </p>
            <p className="font-primary text-white/50 leading-relaxed mb-12">
              {t('nosotros.values.p2')}
            </p>
            <div className="w-24 h-px bg-[#C9A962] mx-auto opacity-40 mb-8" />
            <p className="font-secondary text-2xl text-[#C9A962] italic">
              {t('nosotros.values.closing')}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
