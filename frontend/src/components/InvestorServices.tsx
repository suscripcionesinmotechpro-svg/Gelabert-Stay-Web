import { motion } from 'framer-motion';
import { TrendingUp, Hammer, Key, BarChart3, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const t = (es: string, en: string) => isEn ? en : es;

  const pillars = [
    {
      icon: TrendingUp,
      title: t('Adquisición Estratégica', 'Strategic Acquisition'),
      description: t('Localizamos activos con alto potencial de revalorización, incluyendo oportunidades exclusivas Off-Market y subastas.', 'We locate assets with high appreciation potential, including exclusive Off-Market opportunities and auctions.')
    },
    {
      icon: Hammer,
      title: t('Reformas y Valor Añadido', 'Renovations & Value-Add'),
      description: t('Transformamos propiedades para maximizar su valor de mercado a través de nuestro equipo interno de arquitectura y diseño.', 'We transform properties to maximize their market value through our in-house architecture and design team.')
    },
    {
      icon: Key,
      title: t('Gestión 360º de Alquiler', '360º Rental Management'),
      description: t('Nos encargamos de todo: desde la búsqueda de inquilinos y contratos hasta el mantenimiento y optimización de rentas.', 'We handle everything: from tenant sourcing and contracts to maintenance and yield optimization.')
    },
    {
      icon: BarChart3,
      title: t('Estrategia de Salida (Exit)', 'Exit Strategy'),
      description: t('Especialistas en Buy-to-Sell (comprar, reformar, vender). Asesoramos en el momento óptimo de desinversión para maximizar el ROI.', 'Specialists in Buy-to-Sell. We advise on the optimal time to divest to maximize your ROI.')
    }
  ];

  return (
    <section className="w-full px-6 md:px-14 py-24 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C9A962]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#C9A962]/[0.01] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="flex flex-col gap-4 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-[1px] bg-[#C9A962]" />
              <span className="font-primary text-[11px] text-[#C9A962] uppercase tracking-[0.3em] font-bold">
                {t('Servicio para Inversores', 'Investor Solutions')}
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-secondary text-4xl md:text-5xl lg:text-6xl text-[#FAF8F5] leading-tight"
            >
              {t('Rentabilice su capital con gestión experta end-to-end', 'Maximize your capital with expert end-to-end management')}
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-2 shrink-0 text-right md:text-left"
          >
            <div className="flex items-center gap-2 text-[#C9A962]">
              <ShieldCheck size={18} />
              <span className="font-primary text-sm font-semibold tracking-wide">
                {t('Gestión de confianza', 'Trusted Management')}
              </span>
            </div>
            <p className="font-primary text-xs text-[#555] uppercase tracking-wider">
              {t('Resultados demostrables en la Costa del Sol', 'Proven results in Costa del Sol')}
            </p>
          </motion.div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <InvestmentPillar key={i} {...pillar} delay={0.1 * i} />
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-12 border-t border-white/5">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h3 className="font-secondary text-3xl text-[#FAF8F5]">
                {t('Por qué invertir con nosotros', 'Why invest with us')}
              </h3>
              <p className="font-primary text-[#888] text-sm leading-relaxed max-w-md">
                {t('Combinamos conocimiento local profundo con una visión financiera estratégica para asegurar el éxito de cada operación.', 'We combine deep local knowledge with strategic financial vision to ensure the success of every operation.')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { es: 'Acceso a activos Off-Market', en: 'Access to Off-Market assets' },
                { es: 'Análisis de viabilidad (ROI)', en: 'Feasibility analysis (ROI)' },
                { es: 'Red de partners expertos', en: 'Expert partner network' },
                { es: 'Reportes de gestión periódicos', en: 'Regular management reports' },
                { es: 'Optimización de impuestos', en: 'Tax optimization' },
                { es: 'Oportunidades de subasta', en: 'Auction opportunities' }
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 size={16} className="text-[#C9A962] shrink-0" />
                  <span className="font-primary text-xs text-white/70">{t(benefit.es, benefit.en)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* New Investor Service Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video lg:aspect-square overflow-hidden rounded-sm border border-white/5 group"
          >
            <img 
              src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=2070&auto=format&fit=crop"
              alt="Real Estate Investment"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-6 left-6 flex flex-col gap-1">
              <span className="font-primary text-[10px] text-[#C9A962] uppercase tracking-[0.2em] font-bold">
                {t('Proyectos de Inversión', 'Investment Projects')}
              </span>
              <span className="font-secondary text-lg text-white">
                Costa del Sol
              </span>
            </div>
          </motion.div>
        </div>

        {/* Call to Action Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="w-full p-10 bg-gradient-to-r from-[#0F0F0F] to-[#161616] border border-[#C9A962]/10 rounded-sm flex flex-col md:flex-row items-center justify-between gap-8 mt-8"
        >
          <div className="flex flex-col gap-2">
            <h4 className="font-secondary text-2xl text-[#FAF8F5]">
              {t('¿Busca rentabilizar su próxima inversión?', 'Looking to monetize your next investment?')}
            </h4>
            <p className="font-primary text-[#888] text-sm">
              {t('Diseñamos un plan de negocio a medida basado en sus objetivos de retorno.', 'We design a bespoke business plan based on your return objectives.')}
            </p>
          </div>
          <a
            href="#contact"
            className="px-8 py-4 bg-[#C9A962] text-black font-primary text-xs font-bold uppercase tracking-widest hover:bg-[#D4B673] transition-all flex items-center gap-3 shrink-0"
          >
            {t('Consultar Servicio Inversores', 'Consult Investor Services')}
            <ArrowRight size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
