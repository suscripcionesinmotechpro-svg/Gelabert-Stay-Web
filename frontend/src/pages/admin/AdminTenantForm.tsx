import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant, useTenantMutations } from '../../hooks/useTenants';
import { ArrowLeft, Save, Loader2, User } from 'lucide-react';
import type { TenantInsert } from '../../types/tenant';

const AVATAR_COLORS = ['#C9A962', '#6A9FB5', '#8B6BAE', '#5BAD7F', '#C97062', '#B5A36A'];

const emptyTenant: TenantInsert = {
  first_name: '', last_name: '', dni: '', email: '', phone: '',
  address: '', zip_code: '', city: '', country: 'España', notes: '',
  avatar_color: '#C9A962',
};

export const AdminTenantForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { tenant, loading: loadingTenant } = useTenant(id);
  const { createTenant, updateTenant } = useTenantMutations();

  const [form, setForm] = useState<TenantInsert>(emptyTenant);
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
      });
    }
  }, [tenant, isEdit]);

  const set = (key: keyof TenantInsert, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('El nombre y apellido son obligatorios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await updateTenant(id, form);
        navigate(`/admin/inquilinos/${id}`);
      } else {
        const newId = await createTenant(form);
        navigate(`/admin/inquilinos/${newId}`);
      }
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

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <label className="font-primary text-[11px] uppercase tracking-wider text-[#666]">{label}</label>
      {children}
    </div>
  );

  const inputClass = "bg-[#0A0A0A] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2.5 font-primary text-sm focus:outline-none focus:border-[#C9A962] transition-colors placeholder-[#444]";

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
          <p className="font-primary text-[#666] text-sm mt-0.5">Datos personales del arrendatario</p>
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
            className="w-14 h-14 rounded-full flex items-center justify-center text-[#0A0A0A] font-bold text-xl font-primary"
            style={{ backgroundColor: form.avatar_color || '#C9A962' }}
          >
            {(form.first_name[0] || <User className="w-6 h-6" />)}
            {form.last_name[0] || ''}
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
        <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Datos Personales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre *">
            <input className={inputClass} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Juan" />
          </Field>
          <Field label="Apellidos *">
            <input className={inputClass} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="García López" />
          </Field>
          <Field label="DNI / NIE">
            <input className={inputClass} value={form.dni || ''} onChange={e => set('dni', e.target.value)} placeholder="12345678A" />
          </Field>
          <Field label="Teléfono">
            <input className={inputClass} value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+34 600 000 000" />
          </Field>
          <Field label="Email">
            <input type="email" className={inputClass} value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" />
          </Field>
        </div>
      </div>

      {/* Address */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
        <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Dirección</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Calle y número">
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

      {/* Notes */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-3">
        <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Notas internas</h2>
        <textarea
          className={`${inputClass} resize-none`}
          rows={4}
          value={form.notes || ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Observaciones sobre el inquilino…"
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
