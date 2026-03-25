import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useContractMutations, useContract } from '../../hooks/useContracts';
import { useTenants } from '../../hooks/useTenants';
import { useProperties } from '../../hooks/useProperties';
import { useTenantDocuments, uploadTenantDocument, deleteTenantDocument } from '../../hooks/useTenantDocuments';
import {
  ArrowLeft, Save, Loader2, Upload, Trash2, FileText,
  ExternalLink, AlertCircle
} from 'lucide-react';
import type { ContractInsert, DocumentType } from '../../types/tenant';
import { DOCUMENT_TYPE_LABELS } from '../../types/tenant';

const DOC_TYPES: DocumentType[] = [
  'contrato_arrendamiento', 'documento_reserva', 'encargo_servicios',
  'ficha_visita', 'dni', 'otro',
];

const emptyContract: Omit<ContractInsert, 'tenant_id'> = {
  property_id: null,
  property_label: '',
  start_date: '',
  end_date: '',
  monthly_rent: null,
  deposit: null,
  currency: 'EUR',
  status: 'active',
  notes: '',
  landlord_name: '',
  landlord_dni: '',
  landlord_phone: '',
  landlord_email: '',
  landlord_address: '',
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="font-primary text-[11px] uppercase tracking-wider text-[#666]">{label}</label>
    {children}
  </div>
);

export const AdminContractForm = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const prefillTenantId = searchParams.get('tenant_id') || '';
  const { contract, loading: loadingContract } = useContract(id);
  const { createContract, updateContract } = useContractMutations();

  const { tenants } = useTenants();
  const { properties } = useProperties(undefined, true);

  const [tenantId, setTenantId] = useState(prefillTenantId);
  const [form, setForm] = useState(emptyContract);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(id || null);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);

  // Documents (available after contract is saved)
  const { documents, refetch: refetchDocs } = useTenantDocuments(contractId || undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocType, setPendingDocType] = useState<DocumentType | null>(null);

  useEffect(() => {
    if (isEdit && contract) {
      setTenantId(contract.tenant_id);
      setForm({
        property_id: contract.property_id,
        property_label: contract.property_label ?? '',
        start_date: contract.start_date,
        end_date: contract.end_date,
        monthly_rent: contract.monthly_rent,
        deposit: contract.deposit,
        currency: contract.currency,
        status: contract.status,
        notes: contract.notes ?? '',
        landlord_name: contract.landlord_name ?? '',
        landlord_dni: contract.landlord_dni ?? '',
        landlord_phone: contract.landlord_phone ?? '',
        landlord_email: contract.landlord_email ?? '',
        landlord_address: contract.landlord_address ?? '',
      });
    }
  }, [contract, isEdit]);

  const set = (key: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handlePropertyChange = (propId: string) => {
    const p = properties.find(x => x.id === propId);
    setForm(prev => ({
      ...prev,
      property_id: propId || null,
      property_label: p?.title || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) { setError('Selecciona un inquilino.'); return; }
    if (!form.start_date || !form.end_date) { setError('Las fechas de inicio y fin son obligatorias.'); return; }
    if (form.start_date > form.end_date) { setError('La fecha de fin debe ser posterior a la de inicio.'); return; }

    setSaving(true); setError(null);
    try {
      const payload: ContractInsert = { ...form, tenant_id: tenantId };
      if (isEdit && id) {
        await updateContract(id, payload);
        navigate(`/admin/inquilinos/${tenantId}`);
      } else {
        const newId = await createContract(payload);
        setContractId(newId);
        // Stay on this page so user can upload documents
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const triggerUpload = (docType: DocumentType) => {
    setPendingDocType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingDocType || !contractId) return;
    setUploadingType(pendingDocType);
    try {
      await uploadTenantDocument(contractId, file, pendingDocType);
      await refetchDocs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingType(null);
      setPendingDocType(null);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId: string, filePath: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await deleteTenantDocument(docId, filePath);
      await refetchDocs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isEdit && loadingContract) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "bg-[#0A0A0A] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2.5 font-primary text-sm focus:outline-none focus:border-[#C9A962] transition-colors placeholder-[#444] w-full";
  const saved = Boolean(contractId);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="text-[#666] hover:text-[#FAF8F5] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">
            {isEdit ? 'Editar Contrato' : 'Nuevo Contrato de Arrendamiento'}
          </h1>
          <p className="font-primary text-[#666] text-sm mt-0.5">
            Vincula un inquilino con una propiedad y gestiona su documentación
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-primary text-sm px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {saved && !isEdit && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 font-primary text-sm px-4 py-3">
          ✓ Contrato guardado. Ahora puedes subir los documentos del inquilino.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Parties */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
          <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Partes del Contrato</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Inquilino *">
              <select
                className={inputClass}
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
                required
                disabled={Boolean(prefillTenantId) || isEdit}
              >
                <option value="">— Seleccionar inquilino —</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Propiedad">
              <select
                className={inputClass}
                value={form.property_id || ''}
                onChange={e => handlePropertyChange(e.target.value)}
              >
                <option value="">— Sin propiedad vinculada —</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
          <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Duración del Contrato</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fecha de Inicio *">
              <input type="date" className={inputClass} value={form.start_date}
                onChange={e => set('start_date', e.target.value)} required />
            </Field>
            <Field label="Fecha de Fin *">
              <input type="date" className={inputClass} value={form.end_date}
                onChange={e => set('end_date', e.target.value)} required />
            </Field>
          </div>
          {form.start_date && form.end_date && form.start_date <= form.end_date && (
            <p className="font-primary text-[#555] text-xs">
              Duración:{' '}
              {Math.round(
                (new Date(form.end_date).getTime() - new Date(form.start_date).getTime())
                / (1000 * 60 * 60 * 24 * 30)
              )}{' '}
              meses aprox.
            </p>
          )}
        </div>

        {/* Financials */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
          <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Condiciones Económicas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Renta Mensual (€)">
              <input type="number" min="0" step="0.01" className={inputClass}
                value={form.monthly_rent ?? ''} onChange={e => set('monthly_rent', e.target.value ? Number(e.target.value) : null)}
                placeholder="800.00" />
            </Field>
            <Field label="Fianza (€)">
              <input type="number" min="0" step="0.01" className={inputClass}
                value={form.deposit ?? ''} onChange={e => set('deposit', e.target.value ? Number(e.target.value) : null)}
                placeholder="1600.00" />
            </Field>
          </div>
        </div>

        {/* Status + Notes */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Estado del Contrato">
              <select className={inputClass} value={form.status}
                onChange={e => set('status', e.target.value as any)}>
                <option value="active">Activo</option>
                <option value="expired">Expirado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </Field>
          </div>
          <Field label="Notas internas">
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.notes || ''}
              onChange={e => set('notes', e.target.value)} placeholder="Observaciones sobre el contrato…" />
          </Field>
        </div>

        {/* Landlord Details */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
          <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#666]">Datos del Propietario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre Completo">
              <input type="text" className={inputClass} value={form.landlord_name || ''}
                onChange={e => set('landlord_name', e.target.value)} placeholder="Ej. Ana Belén Robles" />
            </Field>
            <Field label="DNI / NIE">
              <input type="text" className={inputClass} value={form.landlord_dni || ''}
                onChange={e => set('landlord_dni', e.target.value)} placeholder="Ej. 12345678Z" />
            </Field>
            <Field label="Teléfono">
              <input type="text" className={inputClass} value={form.landlord_phone || ''}
                onChange={e => set('landlord_phone', e.target.value)} placeholder="+34 600..." />
            </Field>
            <Field label="Email">
              <input type="email" className={inputClass} value={form.landlord_email || ''}
                onChange={e => set('landlord_email', e.target.value)} placeholder="ana@email.com" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Dirección Postal">
                <input type="text" className={inputClass} value={form.landlord_address || ''}
                  onChange={e => set('landlord_address', e.target.value)} placeholder="Calle Falsa 123, Madrid" />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Guardar Cambios' : 'Crear Contrato'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-3 border border-[#1F1F1F] text-[#888] font-primary text-sm hover:text-[#FAF8F5] hover:border-[#333] transition-colors">
            Cancelar
          </button>
        </div>
      </form>

      {/* Document Uploads — only after contract is created */}
      {saved && contractId && (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5">
          <div>
            <h2 className="font-primary font-bold text-xs uppercase tracking-wider text-[#C9A962]">Documentación del Contrato</h2>
            <p className="font-primary text-[#555] text-xs mt-1">Sube los PDFs del inquilino para este contrato</p>
          </div>

          {/* Doc type grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DOC_TYPES.map(docType => {
              const existing = documents.filter(d => d.document_type === docType);
              const isUploading = uploadingType === docType;
              return (
                <div key={docType} className="border border-[#1A1A1A] p-4 flex flex-col gap-2">
                  <p className="font-primary text-sm text-[#FAF8F5] font-semibold">{DOCUMENT_TYPE_LABELS[docType]}</p>
                  {existing.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#C9A962] flex-shrink-0" />
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-primary text-[11px] text-[#888] hover:text-[#FAF8F5] truncate flex-1 flex items-center gap-1"
                      >
                        {doc.file_name} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.file_path)}
                        className="text-[#444] hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => triggerUpload(docType)}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 text-[#555] hover:text-[#C9A962] font-primary text-xs transition-colors disabled:opacity-50 mt-1"
                  >
                    {isUploading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Upload className="w-3.5 h-3.5" />
                    }
                    {existing.length > 0 ? 'Añadir otro' : 'Subir PDF'}
                  </button>
                </div>
              );
            })}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => navigate(`/admin/inquilinos/${contract?.tenant_id || prefillTenantId}`)}
            className="self-start flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
          >
            ✓ Finalizar y Ver Inquilino
          </button>
        </div>
      )}
    </div>
  );
};
