import { motion } from 'framer-motion';
import { TrendingUp, Hammer, Key, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InvestmentPillar = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col gap-4 p-8 bg-white/[0.02] border border-white/5 hover:border-[#C9A962]/30 transition-all duration-500 group rounded-sm relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#C9A962]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="w-12 h-12 rounded-full bg-[#C9A962]/10 flex items-center justify-center text-[#C9A962] group-hover:bg-[#C9A962] group-hover:text-black transition-all duration-500">
      <Icon size={24} />
    </div>
    <h3 className="font-secondary text-xl text-[#FAF8F5] mt-2">{title}</h3>
    <p className="font-primary text-sm text-[#888] leading-relaxed">
      {description}
    </p>
  </motion.div>
);

export const InvestorServices = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const pillars = [
    {
      icon: TrendingUp,
      title: isEn ? 'Strategic Acquisition' : 'Adquisición Estratégica',
      description: isEn
        ? 'We locate assets with high appreciation potential, including exclusive Off-Market opportunities.'
        : 'Localizamos activos con alto potencial de revalorización, incluyendo oportunidades exclusivas Off-Market.'
    },
    {
      icon: Hammer,
      title: isEn ? 'Renovations & Value-Add' : 'Reformas y Valor Añadido',
      description: isEn
        ? 'We transform properties to maximize market value through our in-house architecture and design team.'
        : 'Transformamos propiedades para maximizar su valor a través de nuestro equipo interno de arquitectura y diseño.'
    },
    {
      icon: Key,
      title: isEn ? '360º Rental Management' : 'Gestión 360º de Alquiler',
      description: isEn
        ? 'We handle everything: from tenant sourcing and contracts to maintenance and yield optimization.'
        : 'Nos encargamos de todo: búsqueda de inquilinos, contratos, mantenimiento y optimización de rentas.'
    },
    {
      icon: BarChart3,
      title: isEn ? 'Exit Strategy' : 'Estrategia de Salida (Exit)',
      description: isEn
        ? 'Specialists in Buy-to-Sell. We advise on the optimal moment to divest and maximize ROI.'
        : 'Especialistas en Buy-to-Sell. Asesoramos en el momento óptimo de desinversión para maximizar el ROI.'
    }
  ];

  return (
    <section id="investor-solutions" className="w-full px-6 md:px-14 py-24 bg-[#0A0A0A] relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden p-8 md:p-16 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C9A962]/[0.03] rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-16">
            {/* Header */}
            <div className="flex flex-col gap-6 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-[1px] bg-[#C9A962]" />
                <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold">
                  {t('services.owner_services.inversores.tag')}
                </span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="font-secondary text-4xl md:text-5xl lg:text-6xl text-[#FAF8F5] leading-tight"
              >
                {t('services.owner_services.inversores.title')}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="font-primary text-[#888] text-lg leading-relaxed"
              >
                {t('services.owner_services.inversores.desc')}
              </motion.p>
            </div>

            {/* Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pillars.map((pillar, i) => (
                <InvestmentPillar key={i} {...pillar} delay={0.1 * i} />
              ))}
            </div>

            {/* Benefits Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-16 border-t border-white/5">
              <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-4">
                  <h3 className="font-secondary text-3xl text-[#FAF8F5]">
                    {t('home.why.title')}
                  </h3>
                  <p className="font-primary text-[#888] text-sm leading-relaxed max-w-md">
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
                      <CheckCircle size={16} className="text-[#C9A962] shrink-0" />
                      <span className="font-primary text-xs text-white/70">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative aspect-video overflow-hidden rounded-xl border border-white/5 group"
              >
                <img 
                  src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=2070&auto=format&fit=crop"
                  alt="Real Estate Investment"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />
              </motion.div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-[#181818] border border-white/5 rounded-xl"
            >
              <div className="flex flex-col gap-1">
                <h4 className="font-secondary text-xl text-white">{t('services.final_cta.title_part1')}{t('services.final_cta.title_highlight')}</h4>
                <p className="font-primary text-sm text-[#888]">{t('services.final_cta.subtitle')}</p>
              </div>
              <a
                href="#contact"
                className="px-8 py-4 bg-[#C9A962] text-black font-primary text-xs font-bold uppercase tracking-widest hover:bg-[#D4B673] transition-all flex items-center gap-3 shrink-0 rounded-sm"
              >
                {t('services.final_cta.contact_btn')}
                <ArrowRight size={14} />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
