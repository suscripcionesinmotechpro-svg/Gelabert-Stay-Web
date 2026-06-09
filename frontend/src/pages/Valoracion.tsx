import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Zap, Users } from 'lucide-react';

export const Valoracion = () => {
  return (
    <div className="w-full bg-[#121212] min-h-screen text-[#FAF8F5]">
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
          className="max-w-5xl mx-auto w-full flex flex-col gap-8"
        >
          {/* Embedded Iframe Container */}
          <div className="w-full bg-[#161616] rounded-2xl md:rounded-[2rem] p-1 border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(201,169,98,0.05)] h-[600px] md:h-[750px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A962] opacity-[0.03] blur-[80px] rounded-full pointer-events-none"></div>
            <iframe 
              src="https://valuation.lystos.com?clientId=8b18c1ba-a7b9-4282-9430-f881d50afa64" 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no"
              className="rounded-2xl md:rounded-[1.9rem] bg-transparent"
              title="Valorador Lystos"
            />
          </div>

          {/* Alternative QR / Link Section */}
          <div className="w-full bg-[#1C1C1C]/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <h3 className="font-primary text-[#FAF8F5] text-lg uppercase tracking-wider">¿Prefieres usar otro dispositivo?</h3>
              <p className="text-gray-400 font-secondary text-sm max-w-xl">
                Escanea el código QR para realizar la valoración cómodamente desde tu teléfono móvil, o si lo prefieres, puedes{' '}
                <a 
                  href="https://valuation.lystos.com?clientId=8b18c1ba-a7b9-4282-9430-f881d50afa64" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#C9A962] hover:text-[#FAF8F5] underline transition-colors"
                >
                  abrir el valorador en una pestaña nueva
                </a>.
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-lg shadow-xl shrink-0">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://valuation.lystos.com?clientId=8b18c1ba-a7b9-4282-9430-f881d50afa64')}`} 
                alt="Código QR Valorador Lystos"
                className="w-32 h-32 object-contain"
              />
              <span className="text-[10px] text-[#0A0A0A] font-bold uppercase tracking-wider font-primary">Escanear QR</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Value Proposition Section */}
      <section className="px-6 md:px-14 pb-32 bg-[#161616] relative z-10">
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
