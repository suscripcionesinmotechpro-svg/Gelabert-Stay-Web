import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant, useTenantMutations } from '../../hooks/useTenants';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save, Loader2, User, Plus, Trash2 } from 'lucide-react';
import type { TenantInsert } from '../../types/tenant';

const AVATAR_COLORS = ['#C9A962', '#6A9FB5', '#8B6BAE', '#5BAD7F', '#C97062', '#B5A36A'];

const emptyTenant = {
  first_name: '', last_name: '', dni: '', email: '', phone: '',
  address: '', zip_code: '', city: '', country: 'España', notes: '',
  avatar_color: '#C9A962',
  employment_status: 'empleado',
  company_name: '',
  job_title: '',
  seniority_date: '',
  contract_type: 'indefinido',
  monthly_income: 0,
  annual_income: 0,
  solvency_score: '',
  ai_analysis_notes: '',
  age: '',
  nationality: '',
  tenant_type: '',
};

interface CoTenantForm {
  id?: string;
  first_name: string;
  lastName?: string; // fallback in case of dynamic types
  last_name: string;
  dni: string;
  email: string;
  phone: string;
  monthly_income: number;
  age?: number | null;
  nationality?: string | null;
  tenant_type?: 'titular' | 'avalista' | '';
  employment_status?: string;
  company_name?: string;
  job_title?: string;
  contract_type?: string;
  seniority_date?: string;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="font-primary text-[11px] uppercase tracking-wider text-[#666]">{label}</label>
    {children}
  </div>
);

export const AdminTenantForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { tenant, loading: loadingTenant } = useTenant(id);
  const { createTenant, updateTenant } = useTenantMutations();

  const [form, setForm] = useState<any>(emptyTenant);
  const [coTenants, setCoTenants] = useState<CoTenantForm[]>([]);
  const [deletedCoTenantIds, setDeletedCoTenantIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && tenant) {
      setForm({
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        dni: tenant.dni ?? '',
        email: tenant.email ?? '',
        phone: tenant.phone ?? '',
        address: tenant.address ?? '',
        zip_code: tenant.zip_code ?? '',
        city: tenant.city ?? '',
        country: tenant.country ?? 'España',
        notes: tenant.notes ?? '',
        avatar_color: tenant.avatar_color ?? '#C9A962',
        employment_status: tenant.employment_status ?? 'empleado',
        company_name: tenant.company_name ?? '',
        job_title: tenant.job_title ?? '',
        seniority_date: tenant.seniority_date ?? '',
        contract_type: tenant.contract_type ?? 'indefinido',
        monthly_income: tenant.monthly_income ?? 0,
        annual_income: tenant.annual_income ?? 0,
        solvency_score: tenant.solvency_score ?? '',
        ai_analysis_notes: tenant.ai_analysis_notes ?? '',
        age: tenant.age ?? '',
        nationality: tenant.nationality ?? '',
        tenant_type: tenant.tenant_type === 'avalista' ? 'avalista' : 'titular_principal',
      });

      // Fetch co-tenants
      supabase
        .from('tenants')
        .select('*')
        .eq('parent_tenant_id', id)
        .then(({ data }) => {
          if (data) {
            setCoTenants(data.map(c => ({
              id: c.id,
              first_name: c.first_name,
              last_name: c.last_name,
              dni: c.dni || '',
              email: c.email || '',
              phone: c.phone || '',
              monthly_income: Number(c.monthly_income || 0),
              age: c.age || null,
              nationality: c.nationality || '',
              tenant_type: c.tenant_type || '',
              employment_status: c.employment_status || 'empleado',
              company_name: c.company_name || '',
              job_title: c.job_title || '',
              contract_type: c.contract_type || 'indefinido',
              seniority_date: c.seniority_date || ''
            })));
          }
        });
    }
  }, [tenant, isEdit, id]);

  const set = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('El nombre y apellido son obligatorios.');
      return;
    }
    if (!form.tenant_type) {
      setError('Por favor, selecciona el Rol en Contrato (Titular o Avalista) para el inquilino principal.');
      return;
    }
    if (coTenants.some(c => !c.tenant_type)) {
      setError('Por favor, selecciona el Rol en Contrato (Titular o Avalista) para todos los co-inquilinos.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado.');

      let mainTenantId = id;
      const dbForm = {
        ...form,
        tenant_type: form.tenant_type === 'titular_principal' ? 'titular' : form.tenant_type,
        seniority_date: form.seniority_date && form.seniority_date.trim() !== '' ? form.seniority_date : null,
        age: form.age !== '' && form.age !== null ? Number(form.age) : null,
        monthly_income: form.monthly_income || null,
        annual_income: form.annual_income || null
      };
      if (isEdit && id) {
        await updateTenant(id, dbForm);
      } else {
        mainTenantId = await createTenant(dbForm as unknown as TenantInsert);
      }

      // Save co-tenants
      for (const co of coTenants) {
        const coPayload = {
          first_name: co.first_name,
          last_name: co.last_name,
          dni: co.dni || null,
          email: co.email || null,
          phone: co.phone || null,
          monthly_income: co.monthly_income || null,
          age: co.age || null,
          nationality: co.nationality || null,
          tenant_type: co.tenant_type || 'titular',
          employment_status: co.employment_status || null,
          company_name: co.company_name || null,
          job_title: co.job_title || null,
          contract_type: co.contract_type || null,
          seniority_date: co.seniority_date && co.seniority_date.trim() !== '' ? co.seniority_date : null
        };

        if (co.id) {
          const { error: coErr } = await supabase
            .from('tenants')
            .update(coPayload)
            .eq('id', co.id);
          if (coErr) throw coErr;
        } else {
          const { error: coErr } = await supabase
            .from('tenants')
            .insert([{
              ...coPayload,
              user_id: user.id,
              agent_id: user.id,
              parent_tenant_id: mainTenantId
            }]);
          if (coErr) throw coErr;
        }
      }

      // Delete removed co-tenants
      for (const delId of deletedCoTenantIds) {
        await supabase.from('tenants').delete().eq('id', delId);
      }

      navigate(`/admin/inquilinos/${mainTenantId}`);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  if (isEdit && loadingTenant) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "bg-[#0A0A0A] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2.5 font-primary text-sm focus:outline-none focus:border-[#C9A962] transition-colors placeholder-[#444] w-full";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="text-[#666] hover:text-[#FAF8F5] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">
            {isEdit ? 'Editar Inquilino' : 'Nuevo Inquilino'}
          </h1>
          <p className="font-primary text-[#666] text-sm mt-0.5">Datos personales, solvencia laboral e inquilinos asociados</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-primary text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Avatar color picker */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[#0A0A0A] font-bold text-xl font-primary flex-shrink-0"
            style={{ backgroundColor: form.avatar_color || '#C9A962' }}
          >
            {form.first_name ? form.first_name[0] : <User className="w-6 h-6" />}
            {form.last_name ? form.last_name[0] : ''}
          </div>
          <div>
            <p className="font-primary text-sm text-[#FAF8F5] font-semibold">
              {form.first_name || 'Nombre'} {form.last_name || 'Apellido'}
            </p>
            <div className="flex gap-2 mt-2">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => set('avatar_color', c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${form.avatar_color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Fields */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
        <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Información Personal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre *">
            <input className={inputClass} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Juan" required />
          </Field>
          <Field label="Apellido *">
            <input className={inputClass} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="García López" required />
          </Field>
          <Field label="DNI / NIE">
            <input className={inputClass} value={form.dni || ''} onChange={e => set('dni', e.target.value)} placeholder="12345678A" />
          </Field>
          <Field label="Edad">
            <input type="number" className={inputClass} value={form.age || ''} onChange={e => set('age', e.target.value ? Number(e.target.value) : '')} placeholder="30" />
          </Field>
          <Field label="Nacionalidad">
            <input className={inputClass} value={form.nationality || ''} onChange={e => set('nationality', e.target.value)} placeholder="Española" />
          </Field>
          <Field label="Teléfono">
            <input className={inputClass} value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+34 600 000 000" />
          </Field>
          <Field label="Email">
            <input type="email" className={inputClass} value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" />
          </Field>
          <Field label="Rol en Contrato *">
            <select className={inputClass} value={form.tenant_type || ''} onChange={e => set('tenant_type', e.target.value)}>
              <option value="">-- Seleccionar --</option>
              <option value="titular_principal">Titular Principal</option>
              <option value="avalista">Avalista</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Solvency Section */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
        <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Solvencia Laboral y Económica</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Situación Laboral">
            <select className={inputClass} value={form.employment_status} onChange={e => set('employment_status', e.target.value)}>
              <option value="empleado">Cuenta Ajena (Empleado)</option>
              <option value="autónomo">Cuenta Propia (Autónomo)</option>
              <option value="estudiante">Estudiante</option>
              <option value="pensionista">Pensionista</option>
              <option value="desempleado">Desempleado</option>
            </select>
          </Field>
          <Field label="Empresa">
            <input className={inputClass} value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Empresa S.A." />
          </Field>
          <Field label="Puesto / Cargo">
            <input className={inputClass} value={form.job_title} onChange={e => set('job_title', e.target.value)} placeholder="Administrativo" />
          </Field>
          <Field label="Tipo de Contrato">
            <select className={inputClass} value={form.contract_type} onChange={e => set('contract_type', e.target.value)}>
              <option value="indefinido">Indefinido</option>
              <option value="temporal">Temporal</option>
              <option value="prácticas">Prácticas</option>
              <option value="otro">Otro</option>
            </select>
          </Field>
          <Field label="Antigüedad Laboral">
            <input type="date" className={inputClass} value={form.seniority_date} onChange={e => set('seniority_date', e.target.value)} />
          </Field>
          <Field label="Ingresos Mensuales Netos (€)">
            <input type="number" className={inputClass} value={form.monthly_income || ''} onChange={e => set('monthly_income', Number(e.target.value))} placeholder="1500" />
          </Field>
        </div>
      </div>

      {/* Co-tenants Section */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-2">
          <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Co-inquilinos / Personas Asociadas</h2>
          <button
            type="button"
            onClick={() => setCoTenants(prev => [...prev, { 
              first_name: '', 
              last_name: '', 
              dni: '', 
              email: '', 
              phone: '', 
              monthly_income: 0, 
              age: null, 
              nationality: '', 
              tenant_type: '',
              employment_status: 'empleado',
              company_name: '',
              job_title: '',
              contract_type: 'indefinido',
              seniority_date: ''
            }])}
            className="flex items-center gap-1 text-[10px] text-[#C9A962] hover:underline font-primary uppercase tracking-wider font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir Persona
          </button>
        </div>
        
        {coTenants.length === 0 ? (
          <p className="font-primary text-xs text-[#555] italic">Este perfil solo tiene un inquilino. Añade co-inquilinos si es un alquiler conjunto.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {coTenants.map((co, idx) => (
              <div key={idx} className="border border-[#1F1F1F] p-5 flex flex-col gap-4 relative bg-[#0D0D0D] rounded-sm transition-all duration-300 hover:border-[#333]">
                <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-2">
                  <span className="font-primary text-xs text-[#C9A962] uppercase tracking-wider font-bold">Persona #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (co.id) setDeletedCoTenantIds(prev => [...prev, co.id!]);
                      setCoTenants(prev => prev.filter((_, i) => i !== idx));
                    }}
                    className="text-[#666] hover:text-red-400 transition-colors flex items-center gap-1 font-primary text-[10px] uppercase tracking-wider font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
                
                {/* Datos Personales */}
                <div>
                  <h3 className="font-primary text-[10px] uppercase tracking-wider text-[#555] font-bold mb-3">Datos Personales</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <Field label="Nombre *">
                      <input
                        className={inputClass}
                        value={co.first_name}
                        required
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, first_name: val } : c));
                        }}
                        placeholder="Nombre"
                      />
                    </Field>
                    <Field label="Apellido *">
                      <input
                        className={inputClass}
                        value={co.last_name}
                        required
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, last_name: val } : c));
                        }}
                        placeholder="Apellido"
                      />
                    </Field>
                    <Field label="DNI / NIE">
                      <input
                        className={inputClass}
                        value={co.dni}
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, dni: val } : c));
                        }}
                        placeholder="12345678A"
                      />
                    </Field>
                    <Field label="Edad">
                      <input
                        type="number"
                        className={inputClass}
                        value={co.age ?? ''}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, age: val } : c));
                        }}
                        placeholder="30"
                      />
                    </Field>
                    <Field label="Nacionalidad">
                      <input
                        className={inputClass}
                        value={co.nationality || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, nationality: val } : c));
                        }}
                        placeholder="Española"
                      />
                    </Field>
                    <Field label="Rol en Contrato *">
                      <select
                        className={inputClass}
                        value={co.tenant_type || ''}
                        onChange={e => {
                          const val = e.target.value as 'titular' | 'avalista' | '';
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, tenant_type: val } : c));
                        }}
                      >
                        <option value="">-- Seleccionar --</option>
                        <option value="titular">Titular</option>
                        <option value="avalista">Avalista</option>
                      </select>
                    </Field>
                    <Field label="Teléfono">
                      <input
                        className={inputClass}
                        value={co.phone}
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, phone: val } : c));
                        }}
                        placeholder="+34 600..."
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        className={inputClass}
                        value={co.email}
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, email: val } : c));
                        }}
                        placeholder="ejemplo@email.com"
                      />
                    </Field>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-[#1A1A1A] my-1" />

                {/* Situación Laboral y Económica */}
                <div>
                  <h3 className="font-primary text-[10px] uppercase tracking-wider text-[#555] font-bold mb-3">Situación Laboral y Económica</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <Field label="Situación Laboral">
                      <select
                        className={inputClass}
                        value={co.employment_status || 'empleado'}
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, employment_status: val } : c));
                        }}
                      >
                        <option value="empleado">Cuenta Ajena (Empleado)</option>
                        <option value="autónomo">Cuenta Propia (Autónomo)</option>
                        <option value="estudiante">Estudiante</option>
                        <option value="pensionista">Pensionista</option>
                        <option value="desempleado">Desempleado</option>
                      </select>
                    </Field>
                    <Field label="Empresa">
                      <input
                        className={inputClass}
                        value={co.company_name || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, company_name: val } : c));
                        }}
                        placeholder="Empresa S.A."
                      />
                    </Field>
                    <Field label="Puesto / Cargo">
                      <input
                        className={inputClass}
                        value={co.job_title || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, job_title: val } : c));
                        }}
                        placeholder="Administrativo"
                      />
                    </Field>
                    <Field label="Tipo de Contrato">
                      <select
                        className={inputClass}
                        value={co.contract_type || 'indefinido'}
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, contract_type: val } : c));
                        }}
                      >
                        <option value="indefinido">Indefinido</option>
                        <option value="temporal">Temporal</option>
                        <option value="prácticas">Prácticas</option>
                        <option value="otro">Otro</option>
                      </select>
                    </Field>
                    <Field label="Antigüedad Laboral">
                      <input
                        type="date"
                        className={inputClass}
                        value={co.seniority_date || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, seniority_date: val } : c));
                        }}
                      />
                    </Field>
                    <Field label="Ingresos Netos (€/mes)">
                      <input
                        type="number"
                        className={inputClass}
                        value={co.monthly_income || ''}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : 0;
                          setCoTenants(prev => prev.map((c, i) => i === idx ? { ...c, monthly_income: val } : c));
                        }}
                        placeholder="1500"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
        <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Dirección</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Dirección">
            <input className={inputClass} value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Calle Mayor, 12, 3º A" />
          </Field>
          <Field label="Código Postal">
            <input className={inputClass} value={form.zip_code || ''} onChange={e => set('zip_code', e.target.value)} placeholder="29001" />
          </Field>
          <Field label="Ciudad">
            <input className={inputClass} value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="Málaga" />
          </Field>
          <Field label="País">
            <input className={inputClass} value={form.country || ''} onChange={e => set('country', e.target.value)} placeholder="España" />
          </Field>
        </div>
      </div>

      {/* Notes / IA Analysis */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-3">
        <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Resumen e Informe del Perfil (Comercial / IA)</h2>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={form.ai_analysis_notes || ''}
          onChange={e => set('ai_analysis_notes', e.target.value)}
          placeholder="Un resumen comercial sobre la solvencia del inquilino para mostrar en el informe PDF del propietario..."
        />
      </div>

      {/* Notes */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-3">
        <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Notas Internas</h2>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={form.notes || ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Añade aquí cualquier información relevante sobre el inquilino..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Guardar Cambios' : 'Crear Inquilino'}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-6 py-3 border border-[#1F1F1F] text-[#888] font-primary text-sm hover:text-[#FAF8F5] hover:border-[#333] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
