import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Send, Check, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
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

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export const ServiceCartDrawer = ({ isOpen, onClose, cartItems, onRemove, onClear }: ServiceCartDrawerProps) => {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [formState, setFormState] = useState<FormState>('idle');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

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
    } catch (err) {
      console.error('Error en el envío:', err);
      setFormState('error');
    }
  };

  const inputClass = "w-full bg-white/[0.05] border border-white/20 rounded-sm px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A962] focus:bg-white/[0.08] transition-all font-primary text-sm shadow-inner";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#0A0A0A] border-l border-white/5 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C9A962]/10 flex items-center justify-center">
                  <ShoppingBag className="text-[#C9A962]" size={20} />
                </div>
                <div>
                  <h2 className="text-white font-secondary text-xl tracking-wide">{t('services.cart.drawer_title')}</h2>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-primary">
                    {isEmpty 
                      ? t('services.cart.drawer_count_zero')
                      : cartItems.length === 1
                        ? t('services.cart.drawer_count_one', { count: 1 })
                        : t('services.cart.drawer_count_many', { count: cartItems.length })
                    }
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                <X className="text-white/40 group-hover:text-white" size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {isEmpty ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/[0.02] flex items-center justify-center">
                    <ShoppingBag className="text-white/10" size={40} />
                  </div>
                  <div>
                    <h3 className="text-white font-secondary text-lg">{t('services.cart.drawer_empty')}</h3>
                    <p className="text-white/40 text-sm max-w-[240px] mx-auto mt-2 font-primary">
                      {t('services.cart.drawer_empty_desc')}
                    </p>
                  </div>
                </div>
              ) : formState === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
                  >
                    <Check className="text-green-500" size={40} />
                  </motion.div>
                  <div>
                    <h3 className="text-white font-secondary text-2xl">{t('services.cart.drawer_success_title')}</h3>
                    <p className="text-white/60 mt-2 font-primary">
                      {t('services.cart.drawer_success_desc')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 pb-10">
                  {/* Items List */}
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={item.id}
                        className="group relative bg-white/[0.02] border border-white/5 rounded-sm p-4 flex items-center gap-4 hover:border-[#C9A962]/30 transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-sm bg-white/[0.03] flex items-center justify-center text-2xl">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-[#C9A962] font-primary uppercase tracking-[0.2em] block mb-1">
                            {item.tagKey ? t(item.tagKey) : item.tag}
                          </span>
                          <h4 className="text-white font-primary font-bold text-sm truncate">
                            {item.titleKey ? t(item.titleKey) : item.title}
                          </h4>
                        </div>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/5 rounded-full transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                    
                    <button 
                      onClick={onClear}
                      className="text-[10px] text-white/30 hover:text-white font-primary uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto pt-2"
                    >
                      {t('services.cart.drawer_clear')}
                    </button>
                  </div>

                  {/* Form */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-sm p-6 space-y-6">
                    <h3 className="text-white font-secondary text-lg flex items-center gap-2">
                      <div className="w-1 h-6 bg-[#C9A962]" />
                      {t('services.cart.drawer_form_title')}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2 font-primary">{t('services.cart.drawer_form_name')}</label>
                        <input
                          type="text"
                          name="name"
                          required
                          className={inputClass}
                          placeholder={t('services.cart.drawer_form_name_placeholder')}
                          value={form.name}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2 font-primary">{t('services.cart.drawer_form_email')}</label>
                          <input
                            type="email"
                            name="email"
                            required
                            className={inputClass}
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2 font-primary">{t('services.cart.drawer_form_phone')}</label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            className={inputClass}
                            placeholder="+34 600 000 000"
                            value={form.phone}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2 font-primary">{t('services.cart.drawer_form_message')}</label>
                        <textarea
                          name="message"
                          rows={3}
                          className={`${inputClass} resize-none`}
                          placeholder={t('services.cart.drawer_form_message_placeholder')}
                          value={form.message}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="flex items-start gap-3 pt-2">
                        <div className="relative flex items-center h-5">
                          <input
                            type="checkbox"
                            id="privacy"
                            required
                            checked={privacyAccepted}
                            onChange={e => setPrivacyAccepted(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#C9A962] focus:ring-[#C9A962] transition-colors cursor-pointer"
                          />
                        </div>
                        <label htmlFor="privacy" className="text-xs text-white/50 leading-relaxed cursor-pointer hover:text-white transition-colors font-primary">
                          <Trans 
                            i18nKey="forms.owner_inquiry.privacy_accept" 
                            components={{ 
                              1: <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/privacidad`} target="_blank" className="text-[#C9A962] hover:underline" /> 
                            }} 
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={formState === 'submitting' || !privacyAccepted}
                        className="w-full bg-[#C9A962] disabled:bg-white/10 text-[#0A0A0A] disabled:text-white/20 py-4 font-primary text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-sm flex items-center justify-center gap-3 group overflow-hidden relative shadow-lg active:scale-[0.98]"
                      >
                        {formState === 'submitting' && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        )}
                        <span className="relative flex items-center gap-2">
                          {formState === 'submitting' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {t('services.cart.drawer_form_sending')}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                              {t('services.cart.drawer_form_submit')}
                            </>
                          )}
                        </span>
                      </button>

                      {formState === 'error' && (
                        <p className="text-red-400 text-[10px] text-center font-primary uppercase tracking-widest">
                          {t('services.cart.drawer_form_error')}
                        </p>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
