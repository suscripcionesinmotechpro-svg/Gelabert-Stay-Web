import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useInvoiceMutations, uploadInvoicePDF } from '../../hooks/useInvoices';
import type { Invoice, InvoiceInsert, InvoiceStatus } from '../../types/invoice';
import { STATUS_LABELS } from '../../types/invoice';
import { ChevronLeft, Save, Upload, X, FileText } from 'lucide-react';

const inputClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";
const labelClass = "font-primary text-xs text-[#666666] uppercase tracking-wider mb-1";
const sectionClass = "bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5";

const DEFAULT_FORM: InvoiceInsert = {
  invoice_number: '',
  client_name: '',
  concept: '',
  amount: 0,
  tax_rate: 21,
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: null,
  status: 'pendiente',
  file_url: null,
  notes: null,
};

export const AdminInvoiceForm = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id && id !== 'nueva';
  const navigate = useNavigate();
  const { createInvoice, updateInvoice } = useInvoiceMutations();

  const [form, setForm] = useState<InvoiceInsert>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingForm, setLoadingForm] = useState(isEditing);

  // Auto-generate invoice number on new form
  useEffect(() => {
    if (!isEditing) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const rand = String(Math.floor(Math.random() * 9000) + 1000);
      set('invoice_number', `${year}/${month}-${rand}`);
    }
  }, [isEditing]);

  // Load existing invoice if editing
  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();
      if (error || !data) { navigate('/admin/facturas'); return; }
      const inv = data as Invoice;
      setForm({
        invoice_number: inv.invoice_number,
        client_name: inv.client_name,
        concept: inv.concept,
        amount: inv.amount,
        tax_rate: inv.tax_rate,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        status: inv.status,
        file_url: inv.file_url,
        notes: inv.notes,
      });
      setLoadingForm(false);
    };
    load();
  }, [id, isEditing]);

  const set = (field: keyof InvoiceInsert, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const totalAmount = form.amount * (1 + form.tax_rate / 100);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setError('El archivo no puede superar los 20MB'); return; }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadInvoicePDF(file);
      set('file_url', url);
    } catch (err: any) {
      setError(`Error al subir el archivo: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.invoice_number.trim()) { setError('El número de factura es obligatorio'); return; }
    if (!form.client_name.trim()) { setError('El cliente es obligatorio'); return; }
    if (!form.concept.trim()) { setError('El concepto es obligatorio'); return; }
    if (!form.amount || form.amount <= 0) { setError('El importe debe ser mayor que 0'); return; }

    setSaving(true);
    setError(null);
    try {
      if (isEditing && id) {
        await updateInvoice(id, form);
      } else {
        await createInvoice(form);
      }
      navigate('/admin/facturas');
    } catch (err: any) {
      setError(err.message || 'Error al guardar la factura');
    } finally {
      setSaving(false);
    }
  };

  if (loadingForm) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/facturas')} className="text-[#888888] hover:text-[#FAF8F5] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-secondary text-3xl text-[#FAF8F5]">
              {isEditing ? 'Editar Factura' : 'Nueva Factura'}
            </h1>
            <p className="font-primary text-[#666666] text-sm mt-1">
              {isEditing ? `Modificando factura ${form.invoice_number}` : 'Registra una nueva factura'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-2">
          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="font-primary text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Datos principales */}
      <div className={sectionClass}>
        <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]">
          Datos de la Factura
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Nº de Factura *</label>
            <input className={inputClass} value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Estado</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={e => set('status', e.target.value as InvoiceStatus)}
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Fecha de Factura *</label>
            <input type="date" className={inputClass} value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Fecha de Vencimiento</label>
            <input type="date" className={inputClass} value={form.due_date || ''} onChange={e => set('due_date', e.target.value || null)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Cliente / Razón Social *</label>
          <input className={inputClass} placeholder="Nombre del cliente o empresa" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Concepto *</label>
          <input className={inputClass} placeholder="Descripción del servicio o producto" value={form.concept} onChange={e => set('concept', e.target.value)} />
        </div>
      </div>

      {/* Importes */}
      <div className={sectionClass}>
        <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]">
          Importes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Base Imponible (€) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0.00"
              value={form.amount || ''}
              onChange={e => set('amount', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>IVA (%)</label>
            <select className={inputClass} value={form.tax_rate} onChange={e => set('tax_rate', parseFloat(e.target.value))}>
              <option value={0}>0% — Exento</option>
              <option value={4}>4% — Superreducido</option>
              <option value={10}>10% — Reducido</option>
              <option value={21}>21% — General</option>
            </select>
          </div>
        </div>

        {/* Summary box */}
        <div className="bg-[#111111] border border-[#1F1F1F] p-4 flex flex-col gap-2">
          <div className="flex justify-between font-primary text-sm text-[#888888]">
            <span>Base imponible</span>
            <span>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(form.amount)}</span>
          </div>
          <div className="flex justify-between font-primary text-sm text-[#888888]">
            <span>IVA ({form.tax_rate}%)</span>
            <span>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(form.amount * form.tax_rate / 100)}</span>
          </div>
          <div className="flex justify-between font-secondary text-xl text-[#C9A962] border-t border-[#1F1F1F] pt-2 mt-1">
            <span className="font-primary text-sm uppercase tracking-wider font-bold">Total</span>
            <span>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Archivo PDF */}
      <div className={sectionClass}>
        <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]">
          Documento PDF
        </h2>

        {form.file_url ? (
          <div className="flex items-center gap-4 p-4 bg-[#111111] border border-[#1F1F1F]">
            <FileText className="w-8 h-8 text-[#C9A962] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-primary text-[#FAF8F5] text-sm truncate">Archivo subido correctamente</p>
              <a
                href={form.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-primary text-[#C9A962] text-xs hover:underline"
              >
                Ver / Descargar PDF
              </a>
            </div>
            <button
              onClick={() => set('file_url', null)}
              className="text-[#444444] hover:text-red-400 transition-colors"
              title="Quitar archivo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-[#1F1F1F] hover:border-[#C9A962]/50 transition-colors cursor-pointer">
            <Upload className={`w-8 h-8 ${uploading ? 'text-[#C9A962] animate-pulse' : 'text-[#444444]'}`} />
            <div className="text-center">
              <p className="font-primary text-[#888888] text-sm">
                {uploading ? 'Subiendo archivo...' : 'Arrastra un PDF o haz clic para seleccionar'}
              </p>
              <p className="font-primary text-[#444444] text-xs mt-1">PDF, máx. 20MB</p>
            </div>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Notas */}
      <div className={sectionClass}>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Notas internas</label>
          <textarea
            className={`${inputClass} h-24 py-2.5 resize-none`}
            placeholder="Notas adicionales (solo visible en el panel)"
            value={form.notes || ''}
            onChange={e => set('notes', e.target.value || null)}
          />
        </div>
      </div>
    </div>
  );
};
