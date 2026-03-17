import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PropertyCard } from '../components/PropertyCard';
import { Link } from 'react-router-dom';
import { Building, Key, Briefcase, ShieldCheck, Home as HomeIcon, Star, CheckCircle } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { Helmet } from 'react-helmet-async';

export const Home = () => {
  const { t, i18n } = useTranslation();
  const { properties: featuredProperties, loading } = useProperties({ is_featured: true, limit: 3 });

  return (
    <div className="w-full pb-20">
      <Helmet>
        <title>{t('seo.home_title')}</title>
        <meta name="description" content={t('seo.home_description')} />
        <meta name="keywords" content="inmobiliaria málaga, costa del sol, comprar casa málaga, alquiler málaga, gelaberthomes, gelabert homes, real estate malaga" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gelaberthomes.es/" />
        <meta property="og:title" content="Gelabert Homes Real Estate | Inmobiliaria en Málaga" />
        <meta property="og:description" content="Encuentra tu propiedad ideal en Málaga & la Costa del Sol con Gelabert Homes Real Estate. Compra, venta y gestión integral." />
        <meta property="og:image" content="https://gelaberthomes.es/logo.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://gelaberthomes.es/" />
        <meta property="twitter:title" content="Gelabert Homes Real Estate | Inmobiliaria en Málaga" />
        <meta property="twitter:description" content="Especialistas en la gestión inmobiliaria en Málaga & Costa del Sol." />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": "Gelabert Homes Real Estate",
              "image": "https://gelaberthomes.es/logo.png",
              "@id": "https://gelaberthomes.es/",
              "url": "https://gelaberthomes.es/",
              "telephone": "+34611898827",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "",
                "addressLocality": "Málaga",
                "addressRegion": "Andalucía",
                "postalCode": "",
                "addressCountry": "ES"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 36.7212,
                "longitude": -4.4214
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday"
                ],
                "opens": "09:00",
                "closes": "19:00"
              },
              "sameAs": []
            }
          `}
        </script>
      </Helmet>
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] flex flex-col items-center justify-center text-center px-6">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center brightness-[0.3]" />
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-secondary text-5xl md:text-7xl text-[#FAF8F5] leading-tight"
          >
            {t('hero.hero_title')} <br/> <span className="text-[#C9A962] italic">Real Estate</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="font-primary text-lg md:text-xl text-[#DFDFE6] max-w-2xl font-light"
          >
            {t('hero.hero_subtitle')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row gap-4"
          >
            <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`} className="px-8 py-4 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[13px] uppercase tracking-wider hover:bg-[#D4B673] transition-colors text-center w-full sm:w-auto">
              {t('hero.view_properties')}
            </Link>
            <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/contacto`} className="px-8 py-4 border border-[#C9A962] text-[#C9A962] font-primary font-bold text-[13px] uppercase tracking-wider hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-colors text-center w-full sm:w-auto">
              {t('hero.contact_us')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Block */}
      <section className="w-full px-6 md:px-14 py-24 bg-[#0A0A0A] flex flex-col gap-12">
        <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5] text-center">{t('home.services.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: t('home.services.rent.title'), icon: <Key className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.rent.desc') },
            { title: t('home.services.sale.title'), icon: <Building className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.sale.desc') },
            { title: t('home.services.transfers.title'), icon: <Briefcase className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.transfers.desc') },
            { title: t('home.services.management.title'), icon: <ShieldCheck className="w-8 h-8 text-[#C9A962]" />, desc: t('home.services.management.desc') }
          ].map((srv, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="flex flex-col gap-4 p-8 border border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#C9A962] transition-colors group cursor-pointer"
            >
              <div className="transform group-hover:scale-110 transition-transform duration-300">
                {srv.icon}
              </div>
              <h3 className="font-primary text-xl text-[#FAF8F5] font-bold group-hover:text-[#C9A962] transition-colors">{srv.title}</h3>
              <p className="font-primary text-[#888888] text-sm">{srv.desc}</p>
            </motion.div>
          ))}
        </div>
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
          <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/propietarios`} className="self-start mt-4 px-8 py-4 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[13px] uppercase tracking-wider hover:bg-[#D4B673] transition-colors">
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
            className="w-full h-full object-cover border border-[#1F1F1F]"
          />
        </motion.div>
      </section>

      {/* Customers Block */}
      <section className="w-full px-6 md:px-14 py-24 bg-[#0A0A0A] flex flex-col gap-12 items-center">
        <div className="text-center max-w-2xl flex flex-col gap-4">
          <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5]">{t('home.customers.title')}</h2>
          <p className="font-primary text-[#888888] text-base">
            {t('home.customers.subtitle')}
          </p>
        </div>
        
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
        
        <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`} className="mt-8 px-8 py-4 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[13px] uppercase tracking-wider hover:bg-[#D4B673] transition-colors">
          {t('home.customers.button')}
        </Link>
      </section>

      {/* Featured Properties Staggered List */}
      <section className="w-full px-6 md:px-14 py-24 bg-[#0F0F0F] flex flex-col gap-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#1F1F1F] pb-6">
          <div className="flex flex-col gap-2">
            <span className="font-primary text-[#C9A962] text-sm uppercase tracking-[0.2em] font-bold">{t('home.featured.badge')}</span>
            <h2 className="font-secondary text-4xl text-[#FAF8F5]">{t('home.featured.title')}</h2>
          </div>
      <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`} className="font-primary text-[13px] text-[#C9A962] hover:text-[#FAF8F5] transition-colors font-bold uppercase tracking-wider">
        {t('home.featured.view_all')} →
      </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : featuredProperties.length > 0 ? (
            featuredProperties.map(p => (
              <PropertyCard
                key={p.id}
                title={p.title}
                title_en={p.title_en || undefined}
                price={p.price ?? 0}
                location={[p.zone, p.city].filter(Boolean).join(', ')}
                area={p.area_m2 ?? 0}
                bedrooms={p.bedrooms}
                bathrooms={p.bathrooms}
                operation={p.operation.toUpperCase() as 'ALQUILER' | 'VENTA' | 'TRASPASO'}
                isFeatured={p.is_featured}
                imageUrl={p.main_image ?? ''}
                linkTo={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades/${p.reference || p.slug || p.id}`}
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
      <section className="w-full px-6 md:px-14 py-24 bg-[#0A0A0A] flex flex-col gap-12">
        <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5] text-center">{t('home.why.title')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {[
            t('home.why.item1'),
            t('home.why.item2'),
            t('home.why.item3'),
            t('home.why.item4'),
            t('home.why.item5'),
            t('home.why.item6')
          ].map((why, i) => (
            <div key={i} className="flex items-center gap-4 p-6 border border-[#1F1F1F] bg-[#0F0F0F]">
              <CheckCircle className="w-6 h-6 text-[#C9A962] shrink-0" />
              <span className="font-primary text-[#FAF8F5] font-bold">{why}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full px-6 md:px-14 py-24 bg-[#0F0F0F] flex flex-col gap-12">
        <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5] text-center">{t('home.testimonials.title')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {[
            { name: t('home.testimonials.item1.name'), role: t('home.testimonials.item1.role'), text: t('home.testimonials.item1.text') },
            { name: t('home.testimonials.item2.name'), role: t('home.testimonials.item2.role'), text: t('home.testimonials.item2.text') },
            { name: t('home.testimonials.item3.name'), role: t('home.testimonials.item3.role'), text: t('home.testimonials.item3.text') }
          ].map((test, i) => (
            <div key={i} className="flex flex-col gap-6 p-8 border border-[#1F1F1F] bg-[#0A0A0A]">
              <div className="flex gap-1 text-[#C9A962]">
                {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="font-primary text-[#888888] text-sm italic leading-relaxed">"{test.text}"</p>
              <div className="mt-auto pt-4">
                <p className="font-primary text-[#FAF8F5] font-bold">{test.name}</p>
                <p className="font-primary text-[#C9A962] text-xs uppercase tracking-wider mt-1">{test.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
