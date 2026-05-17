import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Hammer, Key, BarChart3, CheckCircle, Plus, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServiceCart } from '../hooks/useServiceCart';

const InvestmentPillar = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col gap-4 p-8 bg-white/[0.02] border border-white/5 hover:border-[#C9A962]/30 hover:bg-white/[0.04] transition-all duration-500 group rounded-3xl relative overflow-hidden backdrop-blur-md"
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(400px_circle_at_center,rgba(201,169,98,0.08),transparent)] z-0" />
    
    <div className="relative z-10 w-12 h-12 rounded-2xl bg-black/40 border border-white/10 group-hover:border-[#C9A962]/30 flex items-center justify-center text-[#C9A962] group-hover:text-black group-hover:bg-[#C9A962] transition-all duration-500 shrink-0">
      <Icon size={20} />
    </div>
    
    <h3 className="relative z-10 font-secondary text-xl text-[#FAF8F5] mt-2 group-hover:text-[#C9A962] transition-colors duration-300">
      {title}
    </h3>
    
    <p className="relative z-10 font-primary text-sm text-white/60 leading-relaxed">
      {description}
    </p>
  </motion.div>
);

export const InvestorServices = () => {
  const { t } = useTranslation();
  const cart = useServiceCart();
  const INVESTOR_SERVICE_ID = 'investor_services';

  const pillars = [
    {
      icon: TrendingUp,
      title: t('investor_services.pillars.acquisition.title'),
      description: t('investor_services.pillars.acquisition.desc')
    },
    {
      icon: Hammer,
      title: t('investor_services.pillars.renovations.title'),
      description: t('investor_services.pillars.renovations.desc')
    },
    {
      icon: Key,
      title: t('investor_services.pillars.management.title'),
      description: t('investor_services.pillars.management.desc')
    },
    {
      icon: BarChart3,
      title: t('investor_services.pillars.exit.title'),
      description: t('investor_services.pillars.exit.desc')
    }
  ];

  return (
    <section id="investor-solutions" className="w-full px-6 py-20 md:py-32 max-w-7xl mx-auto relative overflow-hidden">
      <div className="relative z-10 flex flex-col gap-16">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 justify-center"
          >
            <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold">
              {t('services.owner_services.inversores.tag')}
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-secondary text-4xl md:text-6xl text-[#FAF8F5] leading-tight"
          >
            {t('services.owner_services.inversores.title')}
          </motion.h2>
          <div className="w-16 h-0.5 bg-[#C9A962] opacity-40 my-2" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="font-primary text-[#DFDFE6]/60 text-base md:text-lg leading-relaxed max-w-2xl font-light"
          >
            {t('services.owner_services.inversores.desc')}
          </motion.p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <InvestmentPillar key={i} {...pillar} delay={0.1 * i} />
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-16 border-t border-white/5">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <span className="font-primary text-[10px] text-[#C9A962] uppercase tracking-[0.3em] font-bold">
                {t('home.why.title')}
              </span>
              <h3 className="font-secondary text-3xl md:text-4xl text-[#FAF8F5]">
                {t('services.why_choose_us.title')}
              </h3>
              <p className="font-primary text-white/60 text-sm leading-relaxed max-w-md">
                {t('services.why_choose_us.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {(t('services.owner_services.inversores.bullets', { returnObjects: true }) as string[]).map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle size={14} className="text-[#C9A962] shrink-0" />
                  <span className="font-primary text-xs text-white/70">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video overflow-hidden rounded-3xl border border-white/5 group"
          >
            <img 
              src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=2070&auto=format&fit=crop"
              alt="Real Estate Investment"
              className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 bg-white/[0.02] border border-[#C9A962]/20 rounded-3xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(800px_circle_at_center,rgba(201,169,98,0.05),transparent)] z-0" />
          
          <div className="relative z-10 flex flex-col gap-2">
            <h4 className="font-secondary text-2xl text-white">
              {t('services.final_cta.title_part1')}
              <span className="italic text-[#C9A962]">
                {t('services.final_cta.title_highlight')}
              </span>
            </h4>
            <p className="font-primary text-sm text-white/60">{t('services.final_cta.subtitle')}</p>
          </div>
          
          <div className={`relative z-10 p-[1px] rounded-xl overflow-hidden shrink-0 ${!cart.isInCart(INVESTOR_SERVICE_ID) ? 'shadow-[0_0_20px_rgba(201,169,98,0.2)]' : ''}`}>
            {!cart.isInCart(INVESTOR_SERVICE_ID) && (
              <div className="absolute w-[400%] h-[400%] -top-[150%] -left-[150%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(201,169,98,0)_0%,rgba(201,169,98,0.8)_50%,rgba(201,169,98,0)_100%)]" />
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                cart.toggleService({
                  id: INVESTOR_SERVICE_ID,
                  titleKey: 'services.owner_services.inversores.title',
                  tagKey: 'services.owner_services.inversores.tag',
                  descKey: 'services.owner_services.inversores.desc',
                  title: t('services.owner_services.inversores.title'),
                  tag: t('services.owner_services.inversores.tag'),
                  icon: '📈',
                  desc: t('services.owner_services.inversores.desc'),
                });
              }}
              className={`relative flex items-center gap-2 px-8 py-4 font-primary text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-xl ${
                cart.isInCart(INVESTOR_SERVICE_ID)
                  ? 'bg-[#C9A962] text-[#0A0A0A] shadow-[0_0_20px_rgba(201,169,98,0.3)]'
                  : 'bg-[#050505]/95 backdrop-blur-xl text-[#C9A962] border border-white/10 hover:border-[#C9A962]/40 hover:text-white'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {cart.isInCart(INVESTOR_SERVICE_ID) ? (
                  <motion.span key="selected" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex items-center gap-2">
                    <Check size={14} /> {t('services.cart.added')}
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex items-center gap-2">
                    <Plus size={14} /> {t('services.cart.add')}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
