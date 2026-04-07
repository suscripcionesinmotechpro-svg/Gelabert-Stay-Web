import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation, Trans } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FormData {
  name: string;
  email: string;
  phone: string;
  city: string;
  operation_type: 'vender' | 'alquilar';
  message: string;
}

export const PropertyContactForm = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    city: '',
    operation_type: 'vender',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Enviar a Supabase para registro interno
      const { error: supabaseError } = await supabase
        .from('inquiries')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            operation_type: formData.operation_type,
            message: formData.message || `Interés en ${formData.operation_type} propiedad en ${formData.city}`,
            privacy_accepted: privacyAccepted,
            accepted_at: new Date().toISOString(),
            status: 'nuevo'
          }
        ]);

      if (supabaseError) throw supabaseError;

      // 2. Enviar a Netlify Forms
      const netlifyData = new URLSearchParams();
      netlifyData.append('form-name', 'property-owners-contact');
      netlifyData.append('bot-field', '');
      
      Object.entries(formData).forEach(([key, value]) => {
        netlifyData.append(key, value);
      });
      netlifyData.append('privacy_accepted', 'Aceptado (SI)');

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: netlifyData.toString(),
      });

      if (!response.ok) {
        console.warn('Netlify submission might have failed, but Supabase recorded it.');
      }

      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        operation_type: 'vender',
        message: '',
      });
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(t('forms.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-8 text-center w-full h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-[#C9A962]/10 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-[#C9A962]" />
        </div>
        <h3 className="font-secondary text-3xl text-white mb-4">{t('forms.success_title')}</h3>
        <p className="font-primary text-white/50 mb-10 max-w-sm leading-relaxed">
          {t('forms.success_desc')}
        </p>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSuccess(false)}
          className="px-10 py-4 bg-[#C9A962] text-black font-primary font-bold text-xs uppercase tracking-[0.2em] transition-all"
        >
          {t('forms.send_another')}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form 
        name="property-owners-contact" 
        method="POST" 
        data-netlify="true" 
        onSubmit={handleSubmit}
        className="flex flex-col gap-8 w-full"
      >
        <input type="hidden" name="form-name" value="property-owners-contact" />
        <div className="hidden">
          <label>
            Don't fill this out if you're human: <input name="bot-field" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.name')}</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
            className="bg-black/40 border border-white/5 p-4 text-white font-primary focus:border-[#C9A962]/50 outline-none transition-all placeholder:text-white/20"
              placeholder={t('forms.name_placeholder')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
            className="bg-black/40 border border-white/5 p-4 text-white font-primary focus:border-[#C9A962]/50 outline-none transition-all placeholder:text-white/20"
              placeholder={t('forms.email_placeholder')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.phone')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
            className="bg-black/40 border border-white/5 p-4 text-white font-primary focus:border-[#C9A962]/50 outline-none transition-all placeholder:text-white/20"
              placeholder={t('forms.phone_placeholder')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="city" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.city')}</label>
            <input
              type="text"
              id="city"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
            className="bg-black/40 border border-white/5 p-4 text-white font-primary focus:border-[#C9A962]/50 outline-none transition-all placeholder:text-white/20"
              placeholder={t('forms.city_placeholder')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[#666666] text-xs uppercase tracking-widest font-bold mb-2">{t('forms.owner_inquiry.label')}</label>
          <div className="flex gap-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="operation_type"
                value="vender"
                checked={formData.operation_type === 'vender'}
                onChange={handleChange}
                className="accent-[#C9A962] w-4 h-4"
              />
              <span className="text-[#FAF8F5] font-primary text-sm group-hover:text-[#C9A962] transition-colors">{t('forms.owner_inquiry.sell')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="operation_type"
                value="alquilar"
                checked={formData.operation_type === 'alquilar'}
                onChange={handleChange}
                className="accent-[#C9A962] w-4 h-4"
              />
              <span className="text-[#FAF8F5] font-primary text-sm group-hover:text-[#C9A962] transition-colors">{t('forms.owner_inquiry.rent')}</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.owner_inquiry.message_label')}</label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className="bg-[#0A0A0A] border border-[#222222] p-3 text-[#FAF8F5] font-primary focus:border-[#C9A962] outline-none transition-colors resize-none"
            placeholder={t('forms.owner_inquiry.message_placeholder')}
          ></textarea>
        </div>

        {/* Legal Disclaimer Block */}
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-sm">
          <p className="text-[10px] text-[#888888] leading-relaxed font-primary uppercase tracking-wider mb-2">
            {t('forms.legal_disclaimers.owners')}
          </p>
        </div>

        <div className="flex items-start gap-4 mt-2">
          <div className="pt-1">
            <input
              type="checkbox"
              id="privacy_accepted_owner"
              name="privacy_accepted"
              required
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="w-4 h-4 accent-[#C9A962] bg-black/40 border-white/10 cursor-pointer"
            />
          </div>
          <label htmlFor="privacy_accepted_owner" className="text-[#888888] text-[11px] font-primary leading-tight cursor-pointer">
            <Trans 
              i18nKey="forms.privacy_accept"
              components={[
                <Link 
                  key="privacy-link"
                  to={`${i18n.language.startsWith('en') ? '/en' : ''}/privacidad`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#C9A962] hover:underline"
                />
              ]}
            />
          </label>
        </div>

        {error && (
          <p className="text-red-500 text-sm font-primary">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !privacyAccepted}
          className={`mt-4 w-full py-4 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[13px] uppercase tracking-widest transition-all ${isSubmitting || !privacyAccepted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#D4B673]'}`}
        >
          {isSubmitting ? t('forms.sending') : t('forms.send')}
        </button>
      </form>
    </div>
  );
};
