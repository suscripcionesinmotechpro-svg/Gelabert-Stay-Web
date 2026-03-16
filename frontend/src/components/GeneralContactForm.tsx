import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation, Trans } from 'react-i18next';

interface FormData {
  name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  message: string;
}

export const GeneralContactForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    inquiry_type: 'compra',
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
            inquiry_type: formData.inquiry_type,
            message: formData.message,
            privacy_accepted: privacyAccepted,
            accepted_at: new Date().toISOString(),
            status: 'nuevo'
          }
        ]);

      if (supabaseError) throw supabaseError;

      // 2. Enviar a Netlify Forms
      const netlifyData = new URLSearchParams();
      netlifyData.append('form-name', 'general-contact');
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
        inquiry_type: 'compra',
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
      <div className="bg-[#111111] border border-[#C9A962]/30 p-8 text-center w-full h-full flex flex-col items-center justify-center">
        <h3 className="font-secondary text-2xl text-[#FAF8F5] mb-4">{t('forms.success_title')}</h3>
        <p className="font-primary text-[#888888] mb-6 max-w-sm">
          {t('forms.success_desc')}
        </p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="px-8 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[12px] uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
        >
          {t('forms.send_another')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0F0F0F] p-8 md:p-14 lg:p-20 flex flex-col justify-center border-l border-[#1A1A1A]">
      <form 
        name="general-contact" 
        method="POST" 
        data-netlify="true" 
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 w-full max-w-xl mx-auto"
      >
        <input type="hidden" name="form-name" value="general-contact" />
        <div className="hidden">
          <label>
            Don't fill this out if you're human: <input name="bot-field" />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.name')}</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="bg-[#0A0A0A] border border-[#222222] p-3 text-[#FAF8F5] font-primary focus:border-[#C9A962] outline-none transition-colors"
            placeholder={t('forms.name_placeholder')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="bg-[#0A0A0A] border border-[#222222] p-3 text-[#FAF8F5] font-primary focus:border-[#C9A962] outline-none transition-colors"
              placeholder={t('forms.email_placeholder')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.phone')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="bg-[#0A0A0A] border border-[#222222] p-3 text-[#FAF8F5] font-primary focus:border-[#C9A962] outline-none transition-colors"
              placeholder={t('forms.phone_placeholder')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="inquiry_type" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.inquiry_type.label')}</label>
          <select
            id="inquiry_type"
            name="inquiry_type"
            required
            value={formData.inquiry_type}
            onChange={handleChange}
            className="bg-[#0A0A0A] border border-[#222222] p-3 text-[#FAF8F5] font-primary focus:border-[#C9A962] outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="compra">{t('forms.inquiry_type.buy')}</option>
            <option value="alquiler">{t('forms.inquiry_type.rent')}</option>
            <option value="venta">{t('forms.inquiry_type.sell')}</option>
            <option value="colaborar">{t('forms.inquiry_type.collab')}</option>
            <option value="trabajar">{t('forms.inquiry_type.work')}</option>
            <option value="otro">{t('forms.inquiry_type.other')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-[#666666] text-xs uppercase tracking-widest font-bold">{t('forms.message')}</label>
          <textarea
            id="message"
            name="message"
            required
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className="bg-[#0A0A0A] border border-[#222222] p-3 text-[#FAF8F5] font-primary focus:border-[#C9A962] outline-none transition-colors resize-none"
            placeholder={t('forms.message_placeholder')}
          ></textarea>
        </div>

        <div className="flex items-start gap-3 mt-2">
          <input
            type="checkbox"
            id="privacy_accepted"
            name="privacy_accepted"
            required
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 accent-[#C9A962] bg-[#0A0A0A] border-[#222222] cursor-pointer"
          />
          <label htmlFor="privacy_accepted" className="text-[#888888] text-xs font-primary leading-tight">
            <Trans i18nKey="forms.privacy_accept">
              He leído y acepto la <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-[#C9A962] hover:underline">Política de Privacidad</a> y el tratamiento de mis datos personales para gestionar mi consulta. *
            </Trans>
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
