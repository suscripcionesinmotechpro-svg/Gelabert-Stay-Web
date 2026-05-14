import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Euro, FileText, Link as LinkIcon, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LeadFormLayout from '../../components/leads/LeadFormLayout';
import { toast } from 'react-hot-toast';

interface OwnerLeadFormProps {
  type: 'venta' | 'alquiler';
}

const OwnerLeadForm: React.FC<OwnerLeadFormProps> = ({ type }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    price: '',
    features: '',
    ad_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const intent = type === 'venta' ? 'vender' : 'alquilar_propietario';
      
      // 1. Save to Supabase
      const { error: supabaseError } = await supabase
        .from('leads_crm')
        .insert([
          {
            name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            intent: intent,
            property_ad_url: formData.ad_url,
            property_features: formData.features,
            rental_price: formData.price,
            status: 'Nuevo'
          }
        ]);

      if (supabaseError) throw supabaseError;

      // 2. Submit to Netlify Forms
      const formName = `owner-${type}-form`;
      const netlifyData = new FormData();
      netlifyData.append('form-name', formName);
      netlifyData.append('full_name', formData.full_name);
      netlifyData.append('email', formData.email);
      netlifyData.append('phone', formData.phone);
      netlifyData.append('address', formData.address);
      netlifyData.append('price', formData.price);
      netlifyData.append('features', formData.features);
      netlifyData.append('ad_url', formData.ad_url);

      await fetch('/', {
        method: 'POST',
        body: netlifyData
      });

      setSubmitted(true);
      const successKey = type === 'venta' ? 'lead_forms.owners_sale.success_title' : 'lead_forms.owners_rent.success_title';
      toast.success(t(successKey));
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const labels = type === 'venta' ? {
    title: t('lead_forms.owners_sale.title'),
    description: t('lead_forms.owners_sale.description'),
    badge: t('lead_forms.owners_sale.badge'),
    price: t('lead_forms.owners_sale.price'),
    success_title: t('lead_forms.owners_sale.success_title'),
    success_desc: t('lead_forms.owners_sale.success_desc')
  } : {
    title: t('lead_forms.owners_rent.title'),
    description: t('lead_forms.owners_rent.description'),
    badge: t('lead_forms.owners_rent.badge'),
    price: t('lead_forms.owners_rent.price'),
    success_title: t('lead_forms.owners_rent.success_title'),
    success_desc: t('lead_forms.owners_rent.success_desc')
  };

  if (submitted) {
    return (
      <LeadFormLayout
        title={labels.success_title}
        description={labels.success_desc}
        badge={labels.badge}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mb-8"
          >
            <CheckCircle2 className="w-12 h-12 text-accent" />
          </motion.div>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all"
          >
            Volver al inicio
          </button>
        </div>
      </LeadFormLayout>
    );
  }

  return (
    <LeadFormLayout
      title={labels.title}
      description={labels.description}
      badge={labels.badge}
    >
      <form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        data-netlify="true"
        name={`owner-${type}-form`}
      >
        <input type="hidden" name="form-name" value={`owner-${type}-form`} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              {t('lead_forms.tenants.person_name')}
            </label>
            <input
              required
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" />
              {t('property.labels.features.email')}
            </label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent" />
              {t('property.labels.features.phone')}
            </label>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Euro className="w-4 h-4 text-accent" />
              {labels.price}
            </label>
            <input
              required
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            {t('lead_forms.owners_sale.address')}
          </label>
          <input
            required
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            {t('lead_forms.owners_sale.features')}
          </label>
          <textarea
            required
            rows={4}
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-accent" />
            {t('lead_forms.owners_sale.ad_url')}
          </label>
          <input
            type="url"
            value={formData.ad_url}
            onChange={(e) => setFormData({ ...formData, ad_url: e.target.value })}
            placeholder="https://..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          />
        </div>

        <div className="flex flex-col items-center gap-6 pt-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input required type="checkbox" className="w-5 h-5 accent-accent" />
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              {t('property.labels.features.accept_privacy_short')}
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-12 py-4 bg-accent text-white rounded-2xl font-bold text-lg hover:bg-accent-dark transition-all shadow-xl hover:shadow-accent/40 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>Enviar Solicitud</span>
          </button>
        </div>
      </form>
    </LeadFormLayout>
  );
};

export default OwnerLeadForm;
