import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Users, Briefcase, TrendingUp, Calendar, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LeadFormLayout from '../../components/leads/LeadFormLayout';
import { toast } from 'react-hot-toast';

interface Occupant {
  name: string;
  age: string;
  occupation: string;
  income: string;
  seniority: string;
  origin: string;
}

const TenantLeadForm: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    num_people: '1'
  });

  const [occupants, setOccupants] = useState<Occupant[]>([
    { name: '', age: '', occupation: '', income: '', seniority: '', origin: '' }
  ]);

  const handleNumPeopleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const num = parseInt(e.target.value);
    setFormData({ ...formData, num_people: e.target.value });
    
    if (num > occupants.length) {
      const newOccupants = [...occupants];
      for (let i = occupants.length; i < num; i++) {
        newOccupants.push({ name: '', age: '', occupation: '', income: '', seniority: '', origin: '' });
      }
      setOccupants(newOccupants);
    } else {
      setOccupants(occupants.slice(0, num));
    }
  };

  const handleOccupantChange = (index: number, field: keyof Occupant, value: string) => {
    const newOccupants = [...occupants];
    newOccupants[index] = { ...newOccupants[index], [field]: value };
    setOccupants(newOccupants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save to Supabase leads_crm
      const { error: supabaseError } = await supabase
        .from('leads_crm')
        .insert([
          {
            name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            intent: 'alquilar',
            occupants: occupants, // This matches the JSONB column
            status: 'Nuevo'
          }
        ]);

      if (supabaseError) throw supabaseError;

      // 2. Submit to Netlify Forms (for email notification)
      const netlifyData = new FormData();
      netlifyData.append('form-name', 'tenant-lead-form');
      netlifyData.append('full_name', formData.full_name);
      netlifyData.append('email', formData.email);
      netlifyData.append('phone', formData.phone);
      netlifyData.append('num_people', formData.num_people);
      
      // Detailed occupants info for the email
      const occupantsSummary = occupants.map((o, i) => 
        `Persona ${i+1}: ${o.name}, ${o.age} años, ${o.occupation}, ${o.income}€/mes, ${o.seniority}, de ${o.origin}`
      ).join('\n');
      
      netlifyData.append('occupants_details', occupantsSummary);

      await fetch('/', {
        method: 'POST',
        body: netlifyData
      });

      setSubmitted(true);
      toast.success(t('lead_forms.tenants.success_title'));
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al enviar la solicitud. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <LeadFormLayout
        title={t('lead_forms.tenants.success_title')}
        description={t('lead_forms.tenants.success_desc')}
        badge={t('lead_forms.tenants.badge')}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </motion.div>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent-dark transition-all shadow-lg hover:shadow-accent/40"
          >
            Volver al inicio
          </button>
        </div>
      </LeadFormLayout>
    );
  }

  return (
    <LeadFormLayout
      title={t('lead_forms.tenants.title')}
      description={t('lead_forms.tenants.description')}
      badge={t('lead_forms.tenants.badge')}
    >
      <form 
        onSubmit={handleSubmit} 
        className="space-y-8"
        data-netlify="true"
        name="tenant-lead-form"
      >
        {/* Hidden inputs for Netlify */}
        <input type="hidden" name="form-name" value="tenant-lead-form" />
        <input type="hidden" name="occupants_details" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              {t('lead_forms.tenants.person_name')}
            </label>
            <input
              required
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
              placeholder="Ej: Juan Pérez"
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
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
              placeholder="juan@ejemplo.com"
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
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
              placeholder="+34 600 000 000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              {t('lead_forms.tenants.num_people')}
            </label>
            <select
              name="num_people"
              value={formData.num_people}
              onChange={handleNumPeopleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all appearance-none"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num} className="bg-slate-900">{num}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {occupants.map((occupant, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {t('lead_forms.tenants.person')} {index + 1}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('lead_forms.tenants.person_name')}
                    </label>
                    <input
                      required
                      type="text"
                      value={occupant.name}
                      onChange={(e) => handleOccupantChange(index, 'name', e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-accent transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {t('lead_forms.tenants.person_age')}
                    </label>
                    <input
                      required
                      type="number"
                      value={occupant.age}
                      onChange={(e) => handleOccupantChange(index, 'age', e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-accent transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-3 h-3" />
                      {t('lead_forms.tenants.person_occupation')}
                    </label>
                    <input
                      required
                      type="text"
                      value={occupant.occupation}
                      onChange={(e) => handleOccupantChange(index, 'occupation', e.target.value)}
                      placeholder={t('lead_forms.tenants.occupation_placeholder')}
                      className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-accent transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      {t('lead_forms.tenants.person_income')}
                    </label>
                    <input
                      required
                      type="text"
                      value={occupant.income}
                      onChange={(e) => handleOccupantChange(index, 'income', e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-accent transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('lead_forms.tenants.person_seniority')}
                    </label>
                    <input
                      required
                      type="text"
                      value={occupant.seniority}
                      onChange={(e) => handleOccupantChange(index, 'seniority', e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-accent transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      {t('lead_forms.tenants.person_origin')}
                    </label>
                    <input
                      required
                      type="text"
                      value={occupant.origin}
                      onChange={(e) => handleOccupantChange(index, 'origin', e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-accent transition-all outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-6 pt-6">
          <label className="flex items-center gap-3 cursor-pointer group max-w-lg">
            <div className="relative w-5 h-5 flex-shrink-0">
              <input 
                required
                type="checkbox" 
                className="peer absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="absolute inset-0 bg-white/5 border border-white/20 rounded peer-checked:bg-accent peer-checked:border-accent transition-all" />
              <CheckCircle2 className="absolute inset-0 w-5 h-5 text-white scale-0 peer-checked:scale-100 transition-all" />
            </div>
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              {t('property.labels.features.accept_privacy_short')}
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-12 py-4 bg-accent text-white rounded-2xl font-bold text-lg hover:bg-accent-dark transition-all shadow-xl hover:shadow-accent/40 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span>Enviar Solicitud</span>
              </>
            )}
          </button>
        </div>
      </form>
    </LeadFormLayout>
  );
};

export default TenantLeadForm;
