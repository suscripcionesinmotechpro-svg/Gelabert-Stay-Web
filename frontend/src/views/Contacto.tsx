"use client";

import { motion } from 'framer-motion';
import { GeneralContactForm } from '../components/GeneralContactForm';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { useTranslation } from 'react-i18next';
import { getWhatsAppLink } from '../utils/whatsapp';
import { Mail, Phone, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as any },
};

export const Contacto = () => {
  const { t, i18n } = useTranslation();
  const [contactLink, setContactLink] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setContactLink(getWhatsAppLink({
        context: 'contact',
        url: `${window.location.origin}${i18n.language.startsWith('en') ? '/en' : ''}/contacto`
      }));
    }
  }, [i18n.language]);

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#121212] relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Imagen: Modern luxury office for real estate contact */}
        <img 
          src="https://images.unsplash.com/photo-1690378820474-b468b8ee64d3?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-70 brightness-[1.0] saturate-[1.4] contrast-[1.1] scale-105"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/90 via-[#121212]/40 to-[#121212]/70" />
      </div>

      {/* Background Mesh */}
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none z-[1]" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C9A962]/5 blur-[120px] rounded-full mix-blend-screen z-[1]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#C9A962]/3 blur-[100px] rounded-full mix-blend-screen z-[1]" />

      {/* Left Content */}
      <div className="flex-1 relative z-10 pt-20 pb-12 px-6 md:p-16 lg:p-24 flex flex-col justify-center">
        <motion.div {...(fadeUp as any)} className="max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-4 h-4 text-[#C9A962]" />
            <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.4em] font-bold">
              {t('contact_page.hero.badge')}
            </span>
          </div>
          
          <h1 className="font-secondary text-5xl md:text-8xl text-white mb-8 leading-[1.1]">
            {t('contact_page.hero.title_1')}<br />
            <span className="italic text-[#C9A962] font-light">
              {t('contact_page.hero.title_2')}
            </span>
          </h1>

          <p className="font-primary text-lg text-[#FAF8F5]/70 font-light mb-16 leading-relaxed">
            {t('contact_page.hero.description')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-sm group transition-all duration-500 hover:border-[#C9A962]/40"
            >
              <div className="w-10 h-10 bg-black border border-white/5 group-hover:border-[#C9A962]/30 flex items-center justify-center mb-6 transition-colors font-primary">
                <Mail className="w-5 h-5 text-[#C9A962]" />
              </div>
              <span className="block text-[#FAF8F5]/75 text-xs uppercase tracking-widest mb-2 font-bold font-primary">
                {t('contact_page.hero.email')}
              </span>
              <a href="mailto:info@gelaberthomes.es" className="text-white hover:text-[#C9A962] transition-colors font-secondary text-lg break-all">
                info@gelaberthomes.es
              </a>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-sm group transition-all duration-500 hover:border-[#C9A962]/40"
            >
              <div className="w-10 h-10 bg-black border border-white/5 group-hover:border-[#C9A962]/30 flex items-center justify-center mb-6 transition-colors font-primary">
                <Phone className="w-5 h-5 text-[#C9A962]" />
              </div>
              <span className="block text-[#FAF8F5]/75 text-xs uppercase tracking-widest mb-2 font-bold font-primary">
                {t('contact_page.hero.phone')}
              </span>
              <a href="tel:+34611898827" className="text-white hover:text-[#C9A962] transition-colors font-secondary text-lg block">
                +34 611 89 88 27
              </a>
            </motion.div>
          </div>

          <div className="mt-12">
            <WhatsAppButton 
              phoneNumber="34611898827" 
              href={contactLink}
              label={t('contact_page.hero.whatsapp_label')}
            />
          </div>
        </motion.div>
      </div>

      {/* Right Form Area */}
      <div className="flex-1 relative z-10 pb-20 px-6 lg:p-14 flex items-center">
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full max-w-2xl mx-auto glass shadow-2xl overflow-hidden"
        >
          <div className="h-2 w-full bg-gradient-to-r from-transparent via-[#C9A962] to-transparent opacity-30" />
          <div className="p-8 md:p-12">
            <GeneralContactForm />
            {/* RGPD / Protección de datos */}
            <div className="mt-6 pt-5 border-t border-white/5">
              <p className="font-primary text-[10px] text-white/60 leading-relaxed">
                <span className="text-[#C9A962] font-bold uppercase tracking-wider">{t('contact_page.legal.title')} · </span>
                <strong className="text-[#FAF8F5]/80">{t('contact_page.legal.responsible')}:</strong> Gelabert Homes Real Estate.{' '}
                <strong className="text-[#FAF8F5]/80">{t('contact_page.legal.purpose')}:</strong> {t('contact_page.legal.purpose_text')}{' '}
                <strong className="text-[#FAF8F5]/80">{t('contact_page.legal.legitimation')}:</strong> {t('contact_page.legal.legitimation_text')}{' '}
                <strong className="text-[#FAF8F5]/80">{t('contact_page.legal.recipients')}:</strong> {t('contact_page.legal.recipients_text')}{' '}
                <strong className="text-[#FAF8F5]/80">{t('contact_page.legal.rights')}:</strong>{' '}
                <a href="mailto:info@gelaberthomes.es" className="text-[#C9A962] hover:text-[#D4B673] transition-colors underline underline-offset-2">
                  info@gelaberthomes.es
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
