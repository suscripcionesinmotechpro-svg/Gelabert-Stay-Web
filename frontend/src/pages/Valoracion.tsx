import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Zap, Users } from 'lucide-react';

export const Valoracion = () => {
  return (
    <div className="w-full bg-[#0F0F0F] min-h-screen text-[#FAF8F5]">
      <Helmet>
        <title>Valora tu Inmueble | Gelabert Homes</title>
        <meta name="description" content="Descubre el valor real de tu propiedad en Málaga y la Costa del Sol. Valoración gratuita y en minutos." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 md:px-14 flex flex-col items-center justify-center text-center">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[50%] bg-[#C9A962] opacity-[0.03] blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[40%] bg-[#C9A962] opacity-[0.03] blur-[100px] rounded-full"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10 max-w-4xl mx-auto"
        >
          <span className="inline-block px-3 py-1 mb-6 border border-[#C9A962]/30 text-[#C9A962] text-xs font-secondary uppercase tracking-widest bg-[#C9A962]/5 rounded-full">
            Inteligencia de Mercado
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-primary uppercase tracking-tight mb-6 leading-tight">
            Descubre el <span className="text-[#C9A962]">valor real</span> de tu propiedad
          </h1>
          <p className="text-gray-400 font-secondary text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Obtén una estimación precisa de mercado en menos de 2 minutos, impulsada por tecnología y Big Data. Sin compromisos.
          </p>
        </motion.div>
      </section>

      {/* Valuation Tool Section */}
      <section className="px-4 md:px-14 pb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-5xl mx-auto w-full"
        >
          {/* Iframe Container */}
          <div className="w-full bg-white rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 relative" style={{ height: '800px' }}>
            <iframe 
              src="https://statefox.com/mites/v/6093dc70f21ebc61f637b472" 
              className="w-full h-full border-none bg-white"
              title="Valorador de Inmuebles Statefox"
              allow="geolocation"
              loading="lazy"
            />
          </div>
        </motion.div>
      </section>

      {/* Value Proposition Section */}
      <section className="px-6 md:px-14 pb-32 bg-[#0A0A0A] relative z-10">
        <div className="max-w-7xl mx-auto pt-24 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#C9A962]/10 flex items-center justify-center mb-6 text-[#C9A962]">
                <TrendingUp size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-primary uppercase tracking-wide mb-4">Datos Reales</h3>
              <p className="text-gray-400 font-secondary leading-relaxed">
                Analizamos miles de testigos reales en el mercado actual para darte el precio más ajustado.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#C9A962]/10 flex items-center justify-center mb-6 text-[#C9A962]">
                <Zap size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-primary uppercase tracking-wide mb-4">Rápido y Online</h3>
              <p className="text-gray-400 font-secondary leading-relaxed">
                Resultados inmediatos directamente en tu pantalla, sin largas esperas ni compromisos.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#C9A962]/10 flex items-center justify-center mb-6 text-[#C9A962]">
                <Users size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-primary uppercase tracking-wide mb-4">Asesoramiento Experto</h3>
              <p className="text-gray-400 font-secondary leading-relaxed">
                Si decides dar el paso, el equipo de Gelabert Homes diseñará la mejor estrategia para ti.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};
