import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Send, CheckCircle, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { CartService } from '../hooks/useServiceCart';


interface ServiceCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartService[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const inputClass = `
  w-full bg-white/[0.03] border border-white/10 px-5 py-4 
  font-primary text-white text-sm outline-none 
  focus:border-[#C9A962] focus:bg-white/[0.06] 
  transition-all placeholder:text-white/20 rounded-sm
`;

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export const ServiceCartDrawer = ({ isOpen, onClose, cartItems, onRemove, onClear }: ServiceCartDrawerProps) => {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [formState, setFormState] = useState<FormState>('idle');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isEmpty = cartItems.length === 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty) return;
    setFormState('submitting');

    const serviceList = cartItems.map(s => `• ${s.title} (${s.tag})`).join('\n');
    const fullMessage = `SERVICIOS SOLICITADOS:\n${serviceList}\n\nMENSAJE ADICIONAL:\n${form.message || 'Sin mensaje adicional.'}`;

    try {
      // 1. Enviar a Supabase para registro interno
      const { error: supabaseError } = await supabase
        .from('inquiries')
        .insert([
          {
            name: form.name,
            email: form.email,
            phone: form.phone,
            inquiry_type: 'servicio',
            message: fullMessage,
            privacy_accepted: privacyAccepted,
            accepted_at: new Date().toISOString(),
            status: 'nuevo'
          }
        ]);

      if (supabaseError) {
        console.error('Error insertando en Supabase:', supabaseError);
        // Continuamos de todas formas para intentar Netlify
      }

      // 2. Enviar a Netlify Forms
      const data = new URLSearchParams();
      data.append('form-name', 'service-inquiry');
      data.append('bot-field', '');
      data.append('name', form.name);
      data.append('email', form.email);
      data.append('phone', form.phone);
      data.append('services', serviceList);
      data.append('message', fullMessage);
      data.append('privacy_accepted', 'Aceptado (SI)');

      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data.toString(),
      });

      if (res.ok || res.status === 200 || res.status === 303) {
        setFormState('success');
        setForm({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => {
          onClear();
          onClose();
          setFormState('idle');
        }, 3500);
      } else {
        setFormState('error');
      }
    } catch {
      setFormState('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            variants={OVERLAY_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } }}
            exit={{ x: '100%', transition: { duration: 0.25, ease: 'easeIn' } }}
            className="fixed top-0 right-0 h-full w-full max-w-lg z-[80] bg-[#070707] border-l border-white/[0.06] flex flex-col shadow-[−40px_0_80px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A962]/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-20 left-0 w-48 h-48 bg-[#C9A962]/3 blur-[80px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#C9A962]/10 border border-[#C9A962]/20 rounded-sm">
                  <ShoppingBag className="w-5 h-5 text-[#C9A962]" />
                </div>
                <div>
                  <h2 className="font-secondary text-xl text-white">{t('services.cart.drawer_title')}</h2>
                  <p className="font-primary text-[10px] text-white/30 uppercase tracking-[0.2em]">
                    {isEmpty ? t('services.cart.drawer_count_zero') : t(cartItems.length === 1 ? 'services.cart.drawer_count_one' : 'services.cart.drawer_count_many', { count: cartItems.length })}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/30 hover:text-white transition-colors hover:bg-white/5 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Cart items */}
              <div className="px-8 pt-6 pb-4">
                <AnimatePresence mode="popLayout">
                  {isEmpty ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-16 gap-4 text-center"
                    >
                      <div className="p-5 border border-white/5 rounded-full bg-white/[0.02]">
                        <ShoppingBag className="w-8 h-8 text-white/10" />
                      </div>
                      <p className="font-primary text-white/30 text-sm">
                        {t('services.cart.drawer_empty')}
                      </p>
                      <p className="font-primary text-white/20 text-xs">
                        {t('services.cart.drawer_empty_desc')}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {cartItems.map((service, i) => (
                        <motion.div
                          key={service.id}
                          layout
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                          exit={{ opacity: 0, x: 30, scale: 0.95 }}
                          className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-sm group hover:border-[#C9A962]/20 transition-colors"
                        >
                          <div className="p-2.5 bg-[#C9A962]/10 border border-[#C9A962]/20 rounded-sm text-xl shrink-0">
                            {service.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-secondary text-white text-base leading-tight">
                              {service.titleKey ? t(service.titleKey) : service.title}
                            </p>
                            <span className="font-primary text-[9px] text-[#C9A962] uppercase tracking-[0.2em] font-bold">
                              {service.tagKey ? t(service.tagKey) : service.tag}
                            </span>
                            <p className="font-primary text-white/30 text-xs mt-1 leading-relaxed line-clamp-2">
                              {service.descKey ? t(service.descKey) : service.desc}
                            </p>
                          </div>
                          <button
                            onClick={() => onRemove(service.id)}
                            className="text-white/40 hover:text-red-400 transition-colors p-1 shrink-0 md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}

                      {cartItems.length > 1 && (
                        <button
                          onClick={onClear}
                          className="font-primary text-[9px] text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors text-right mt-1"
                        >
                          {t('services.cart.drawer_clear')}
                        </button>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              {!isEmpty && (
                <div className="px-8 py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/[0.05]" />
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-[#C9A962]" />
                      <span className="font-primary text-[9px] text-[#C9A962]/60 uppercase tracking-[0.3em]">{t('services.cart.drawer_form_title')}</span>
                    </div>
                    <div className="h-px flex-1 bg-white/[0.05]" />
                  </div>
                </div>
              )}

              {/* Form */}
              {!isEmpty && (
                <div className="px-8 pb-8">
                  {formState === 'success' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-4 py-12 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="w-16 h-16 bg-[#C9A962]/10 border border-[#C9A962]/30 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle className="w-8 h-8 text-[#C9A962]" />
                      </motion.div>
                      <h3 className="font-secondary text-2xl text-white">{t('services.cart.drawer_success_title')}</h3>
                      <p className="font-primary text-white/40 text-sm">
                        {t('services.cart.drawer_success_desc')}
                      </p>
                    </motion.div>
                  ) : (
                    <form
                      ref={formRef}
                      name="service-inquiry"
                      data-netlify="true"
                      data-netlify-honeypot="bot-field"
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-4"
                    >
                      <input type="hidden" name="form-name" value="service-inquiry" />
                      <input name="bot-field" className="hidden" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-primary text-[9px] text-white/30 uppercase tracking-[0.2em]">{t('services.cart.drawer_form_name')}</label>
                          <input
                            className={inputClass}
                            placeholder={t('services.cart.drawer_form_name_placeholder')}
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="font-primary text-[9px] text-white/30 uppercase tracking-[0.2em]">{t('services.cart.drawer_form_phone')}</label>
                          <input
                            className={inputClass}
                            placeholder="+34 600 000 000"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[9px] text-white/30 uppercase tracking-[0.2em]">{t('services.cart.drawer_form_email')}</label>
                        <input
                          className={inputClass}
                          placeholder="tu@email.com"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-primary text-[9px] text-white/30 uppercase tracking-[0.2em]">{t('services.cart.drawer_form_message')}</label>
                        <textarea
                          className={`${inputClass} resize-none`}
                          rows={3}
                          placeholder={t('services.cart.drawer_form_message_placeholder')}
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                        />
                      </div>

                      {/* Legal Disclaimer */}
                      <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-sm">
                        <p className="font-primary text-[10px] text-white/40 leading-relaxed text-justify">
                          {t('forms.legal_disclaimers.owners')}
                        </p>
                      </div>

                      {/* Privacy Checkbox */}
                      <div className="flex items-start gap-3 mt-1">
                        <input
                          type="checkbox"
                          id="privacy-cart"
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          className="mt-1 shrink-0 accent-[#C9A962]"
                          required
                        />
                        <label htmlFor="privacy-cart" className="font-primary text-[11px] text-white/50 leading-snug cursor-pointer hover:text-white/70 transition-colors">
                          <Trans 
                            i18nKey="forms.owner_inquiry.privacy_accept" 
                            components={{ 
                              1: <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/privacidad`} target="_blank" className="text-[#C9A962] hover:underline" /> 
                            }} 
                          />
                        </label>
                      </div>

                      {formState === 'error' && (
                        <p className="font-primary text-red-400/80 text-xs text-center">
                          {t('services.cart.drawer_form_error')}
                        </p>
                      )}

                      <motion.button
                        type="submit"
                        disabled={formState === 'submitting' || !privacyAccepted}
                        whileTap={{ scale: 0.98 }}
                        className="relative mt-2 flex items-center justify-center gap-3 px-8 py-5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[10px] uppercase tracking-[0.25em] hover:brightness-110 transition-all disabled:opacity-50 shadow-[0_10px_40px_rgba(201,169,98,0.2)] hover:shadow-[0_10px_40px_rgba(201,169,98,0.4)]"
                      >
                        {formState === 'submitting' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('services.cart.drawer_form_sending')}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            {t('services.cart.drawer_form_submit')}
                          </>
                        )}
                      </motion.button>

                      <p className="font-primary text-[9px] text-white/20 text-center leading-relaxed">
                        {t('services.cart.drawer_form_policy')}
                      </p>
                    </form>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
