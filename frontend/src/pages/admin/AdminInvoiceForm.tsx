import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useInvoiceMutations, uploadInvoicePDF } from '../../hooks/useInvoices';
import { useInvoiceSettings } from '../../hooks/useInvoiceSettings';
import type { Invoice, InvoiceInsert, InvoiceStatus, InvoiceItem, PaymentMethod } from '../../types/invoice';
import { STATUS_LABELS } from '../../types/invoice';
import { ChevronLeft, Save, Upload, X, FileText, Building2, Plus, Trash2 } from 'lucide-react';

const inputClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";
const labelClass = "font-primary text-xs text-[#666666] uppercase tracking-wider mb-1 block";
const sectionClass = "bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5";

const DEFAULT_FORM: InvoiceInsert = {
  invoice_number: '',
  series: 'A',
  client_name: '',
  client_nif: '',
  client_address: '',
  client_zip: '',
  client_city: '',
  client_email: '',
  client_phone: '',
  concept: 'Concepto general',
  items: [],
  amount: 0,
  tax_rate: 21,
  irpf_rate: 0,
  payment_method: '',
  payment_details: '',
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
  const { settings, updateSettings } = useInvoiceSettings();

  const [form, setForm] = useState<InvoiceInsert>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingForm, setLoadingForm] = useState(isEditing);
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  // Auto-generate invoice number on new form
  useEffect(() => {
    if (!isEditing) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const rand = String(Math.floor(Math.random() * 9000) + 1000);
      setForm(prev => ({ ...prev, invoice_number: `${year}/${month}-${rand}` }));
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
        series: inv.series || 'A',
        client_name: inv.client_name,
        client_nif: inv.client_nif || '',
        client_address: inv.client_address || '',
        client_zip: inv.client_zip || '',
        client_city: inv.client_city || '',
        client_email: inv.client_email || '',
        client_phone: inv.client_phone || '',
        concept: inv.concept || '',
        items: inv.items || [],
        amount: inv.amount,
        tax_rate: inv.tax_rate,
        irpf_rate: inv.irpf_rate || 0,
        payment_method: inv.payment_method || '',
        payment_details: inv.payment_details || '',
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

  // Dynamic items logic
  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: 0 }]
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      const newAmount = newItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      return { ...prev, items: newItems, amount: newAmount > 0 ? newAmount : prev.amount };
    });
  };

  const removeItem = (index: number) => {
    setForm(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const newAmount = newItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      return { ...prev, items: newItems, amount: newItems.length > 0 ? newAmount : prev.amount };
    });
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    let details = '';
    if (method === 'transferencia') details = settings?.default_iban || '';
    if (method === 'bizum') details = settings?.default_bizum || '';
    if (method === 'paypal') details = settings?.default_paypal || '';
    setForm(prev => ({ ...prev, payment_method: method, payment_details: details }));
  };

  const totalAmount = form.amount + (form.amount * form.tax_rate / 100) - (form.amount * form.irpf_rate / 100);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

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
    if (!form.client_name.trim()) { setError('El nombre del cliente es obligatorio'); return; }
    if (!form.amount || form.amount <= 0) { setError('El importe base debe ser mayor que 0'); return; }

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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/facturas')} className="text-[#888888] hover:text-[#FAF8F5] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-secondary text-3xl text-[#FAF8F5]">
              {isEditing ? 'Editar Registro' : 'Generador de Facturas'}
            </h1>
            <p className="font-primary text-[#666666] text-sm mt-1">
              Registro completo de facturación para tu base de datos y PDF
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#1F1F1F] bg-[#0A0A0A] text-[#FAF8F5] font-primary font-bold text-xs uppercase tracking-wider hover:border-[#C9A962] hover:text-[#C9A962] transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Emisor
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Factura'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-2">
          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="font-primary text-red-400 text-sm">{error}</p>
        </div>
      )}



      {/* Basic Data */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Serie</label>
            <input className={inputClass} value={form.series} onChange={e => set('series', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={labelClass}>Nº Factura *</label>
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
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={labelClass}>Fecha de Emisión *</label>
            <input type="date" className={inputClass} value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={labelClass}>Fecha de Vencimiento (Opcional)</label>
            <input type="date" className={inputClass} value={form.due_date || ''} onChange={e => set('due_date', e.target.value || null)} />
          </div>
        </div>
      </div>

      {/* Client Data */}
      <div className={sectionClass}>
         <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]">
          Datos del Cliente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Nombre / Razón Social *</label>
            <input className={inputClass} placeholder="Ej: Tech Solutions SL" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>NIF / CIF</label>
            <input className={inputClass} placeholder="Ej: B12345678" value={form.client_nif || ''} onChange={e => set('client_nif', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={labelClass}>Dirección</label>
            <input className={inputClass} placeholder="Ej: Calle Principal 123" value={form.client_address || ''} onChange={e => set('client_address', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Código Postal</label>
            <input className={inputClass} placeholder="Ej: 28001" value={form.client_zip || ''} onChange={e => set('client_zip', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Ciudad</label>
            <input className={inputClass} placeholder="Ej: Madrid" value={form.client_city || ''} onChange={e => set('client_city', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} placeholder="cliente@example.com" value={form.client_email || ''} onChange={e => set('client_email', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Teléfono</label>
            <input className={inputClass} placeholder="+34 600 000 000" value={form.client_phone || ''} onChange={e => set('client_phone', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Dynamic Items */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
          <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">
            Artículos / Conceptos
          </h2>
          <button 
            onClick={addItem}
            className="flex items-center gap-1 text-[#C9A962] hover:text-[#D4B673] font-primary text-xs uppercase font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Añadir Línea
          </button>
        </div>
        
        {form.items.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#1F1F1F]">
            <p className="font-primary text-[#666666] text-sm">No hay artículos. El importe base se introducirá manualmente, o añade líneas para cálculo automático.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 mb-1 hidden md:grid">
              <span className="font-primary text-xs text-[#666666] uppercase">Descripción</span>
              <span className="font-primary text-xs text-[#666666] uppercase text-right">Cant.</span>
              <span className="font-primary text-xs text-[#666666] uppercase text-right">Precio</span>
              <span className="font-primary text-xs text-[#666666] uppercase text-right">Total</span>
              <span className="font-primary text-xs text-[#666666] uppercase text-right"></span>
            </div>
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_80px_100px_100px_40px] gap-2 items-center bg-[#111] p-2 border border-[#1F1F1F]">
                <input 
                  className={inputClass} 
                  placeholder="Descripción del concepto..."
                  value={item.description}
                  onChange={e => updateItem(idx, 'description', e.target.value)} 
                />
                <input 
                  type="number" 
                  min="1"
                  className={`${inputClass} text-right`} 
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} 
                />
                <input 
                  type="number"
                  step="0.01" 
                  className={`${inputClass} text-right`} 
                  value={item.price}
                  onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} 
                />
                <div className="h-10 flex items-center justify-end px-3 font-secondary text-[#FAF8F5]">
                  {formatCurrency(item.quantity * item.price)}
                </div>
                <button 
                  onClick={() => removeItem(idx)}
                  className="w-10 h-10 flex items-center justify-center text-[#888888] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Taxes & Payment & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <div className={sectionClass}>
            <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]">
              Impuestos
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>IVA (%)</label>
                <select className={inputClass} value={form.tax_rate} onChange={e => set('tax_rate', parseFloat(e.target.value))}>
                  <option value={0}>0% — Exento</option>
                  <option value={4}>4% — Superreducido</option>
                  <option value={10}>10% — Reducido</option>
                  <option value={21}>21% — General</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>IRPF Retención (%)</label>
                <select className={inputClass} value={form.irpf_rate} onChange={e => set('irpf_rate', parseFloat(e.target.value))}>
                  <option value={0}>0% — Sin IRPF</option>
                  <option value={7}>7% — Reducido</option>
                  <option value={15}>15% — General</option>
                  <option value={19}>19% — Alquileres</option>
                </select>
              </div>
            </div>
          </div>
          <div className={sectionClass}>
            <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]">
              Método de Pago
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(['transferencia', 'bizum', 'paypal', 'efectivo'] as PaymentMethod[]).map(pm => (
                <button
                  key={pm}
                  onClick={() => handlePaymentMethodChange(pm)}
                  className={`h-10 border text-xs font-primary uppercase tracking-wider font-bold transition-colors ${
                    form.payment_method === pm 
                      ? 'bg-[#C9A962] text-[#000] border-[#C9A962]' 
                      : 'bg-[#111] text-[#888888] border-[#1F1F1F] hover:border-[#C9A962]/50'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
            {form.payment_method && form.payment_method !== 'efectivo' && (
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Detalles del Pago ({form.payment_method})</label>
                <input 
                  className={inputClass} 
                  placeholder={form.payment_method === 'transferencia' ? 'ESXX XXXX XXXX...' : 'Email / Teléfono'} 
                  value={form.payment_details || ''} 
                  onChange={e => set('payment_details', e.target.value)} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Global Summary */}
        <div className="bg-[#111] border border-[#C9A962]/20 p-6 flex flex-col gap-4">
          <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]">
            Resumen Total
          </h2>
          
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Base Imponible Manual (€)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={form.amount}
              onChange={e => set('amount', parseFloat(e.target.value) || 0)}
              disabled={form.items.length > 0}
              title={form.items.length > 0 ? "Calculado automáticamente desde los artículos" : ""}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex justify-between font-primary text-sm text-[#888888]">
              <span>Base Imponible</span>
              <span>{formatCurrency(form.amount)}</span>
            </div>
            <div className="flex justify-between font-primary text-sm text-[#888888]">
              <span>+ IVA ({form.tax_rate}%)</span>
              <span>{formatCurrency(form.amount * form.tax_rate / 100)}</span>
            </div>
            {form.irpf_rate > 0 && (
              <div className="flex justify-between font-primary text-sm text-purple-400/80">
                <span>- IRPF ({form.irpf_rate}%)</span>
                <span>-{formatCurrency(form.amount * form.irpf_rate / 100)}</span>
              </div>
            )}
            <div className="flex justify-between font-secondary text-2xl text-[#C9A962] border-t border-[#1F1F1F] pt-4 mt-2">
              <span className="font-primary text-sm uppercase tracking-wider font-bold mt-1">Total Factura</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Subida */}
      <div className={sectionClass}>
        <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]">
          Documento PDF Externo Adjunto
        </h2>

        {form.file_url ? (
          <div className="flex items-center gap-4 p-4 bg-[#111111] border border-[#1F1F1F]">
            <FileText className="w-8 h-8 text-[#C9A962] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-primary text-[#FAF8F5] text-sm truncate">Archivo PDF vinculado</p>
              <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="font-primary text-[#C9A962] text-xs hover:underline">
                Ver Documento
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
                {uploading ? 'Subiendo archivo...' : 'Arrastra un PDF original o haz clic para subirlo'}
              </p>
              <p className="font-primary text-[#444444] text-xs mt-1">PDF, máx. 20MB</p>
            </div>
            <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
              <h2 className="font-secondary text-2xl text-[#FAF8F5]">Configurar Datos del Emisor</h2>
              <button onClick={() => setShowSettings(false)} className="text-[#888888] hover:text-[#FAF8F5]">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="font-primary text-[#888888] text-sm">
              Estos datos se usarán por defecto para todas las facturas. (Se guardan de forma permanente).
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Nombre / Empresa</label>
                <input className={inputClass} value={localSettings?.issuer_name || ''} onChange={e => setLocalSettings(p => ({ ...p!, issuer_name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>NIF / CIF</label>
                <input className={inputClass} value={localSettings?.issuer_nif || ''} onChange={e => setLocalSettings(p => ({ ...p!, issuer_nif: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className={labelClass}>Dirección Principal</label>
                <input className={inputClass} value={localSettings?.issuer_address || ''} onChange={e => setLocalSettings(p => ({ ...p!, issuer_address: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Código Postal</label>
                <input className={inputClass} value={localSettings?.issuer_zip || ''} onChange={e => setLocalSettings(p => ({ ...p!, issuer_zip: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Ciudad</label>
                <input className={inputClass} value={localSettings?.issuer_city || ''} onChange={e => setLocalSettings(p => ({ ...p!, issuer_city: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2 border-t border-[#1F1F1F] pt-4 mt-2">
                <label className={labelClass}>IBAN por defecto (Transferencias)</label>
                <input className={inputClass} value={localSettings?.default_iban || ''} onChange={e => setLocalSettings(p => ({ ...p!, default_iban: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#1F1F1F] pt-4 mt-2">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-[#888888] font-primary font-bold text-xs uppercase hover:text-[#FAF8F5]"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if (localSettings) {
                    await updateSettings(localSettings);
                    setShowSettings(false);
                  }
                }}
                className="px-6 py-2 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-xs uppercase hover:bg-[#D4B673]"
              >
                Guardar Ajustes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
