import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useInvoiceMutations, uploadInvoicePDF } from '../../hooks/useInvoices';
import { useIssuers } from '../../hooks/useIssuers';
import type { Invoice, InvoiceInsert, InvoiceStatus, InvoiceItem } from '../../types/invoice';
import { STATUS_LABELS } from '../../types/invoice';
import { ChevronLeft, Save, Upload, X, FileText, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const inputClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";
const labelClass = "font-primary text-xs text-[#666666] uppercase tracking-wider mb-1 block";
const sectionClass = "bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5";

const DEFAULT_FORM: InvoiceInsert = {
  invoice_number: '',
  series: 'A',
  client_name: '',
  client_nif: '',
  client_street_type: '',
  client_street_name: '',
  client_street_number: '',
  client_floor_door: '',
  client_address: '',
  client_zip: '',
  client_city: '',
  client_province: '',
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
  type: 'income',
  issuer_id: '',
  fixed_expense_id: '',
};

export const AdminInvoiceForm = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id && id !== 'nueva';
  const navigate = useNavigate();
  const { createInvoice, updateInvoice } = useInvoiceMutations();
  const { issuers, loading: loadingIssuers, createIssuer } = useIssuers();
  const [fixedExpenses, setFixedExpenses] = useState<{id: string, name: string}[]>([]);

  // Load Fixed Expenses
  useEffect(() => {
    const fetchFixed = async () => {
      const { data } = await supabase
        .from('accounting_fixed_expenses')
        .select('id, name')
        .eq('is_active', true);
      if (data) setFixedExpenses(data);
    };
    fetchFixed();
  }, []);

  const [form, setForm] = useState<InvoiceInsert>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingForm, setLoadingForm] = useState(isEditing);
  
  // Issuer Management State
  const [showIssuerModal, setShowIssuerModal] = useState(false);
  const [newIssuer, setNewIssuer] = useState({ name: '', nif: '', street_type: '', street_name: '', street_number: '', floor_door: '', address: '', city: '', province: '', zip: '', phone: '', email: '', is_default: false });

  // Auto-generate invoice number on new form
  useEffect(() => {
    if (!isEditing) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const rand = String(Math.floor(Math.random() * 9000) + 1000);
      setForm(prev => ({ ...prev, invoice_number: `${year}/${month}-${rand}` }));
    }
  }, [isEditing]);

  // Set default issuer if available
  useEffect(() => {
    if (!isEditing && issuers.length > 0 && !form.issuer_id) {
      const def = issuers.find(i => i.is_default) || issuers[0];
      setForm(prev => ({ ...prev, issuer_id: def.id }));
    }
  }, [issuers, isEditing]);

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
        client_street_type: inv.client_street_type || '',
        client_street_name: inv.client_street_name || '',
        client_street_number: inv.client_street_number || '',
        client_floor_door: inv.client_floor_door || '',
        client_address: inv.client_address || '', // Support old address
        client_zip: inv.client_zip || '',
        client_city: inv.client_city || '',
        client_province: inv.client_province || '',
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
        type: inv.type || 'income',
        issuer_id: inv.issuer_id || '',
        fixed_expense_id: inv.fixed_expense_id || '',
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


  const totalAmount = form.amount + (form.amount * form.tax_rate / 100) - (form.amount * form.irpf_rate / 100);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setError('El archivo no puede superar los 20MB'); return; }
    setError(null);
    try {
      const url = await uploadInvoicePDF(file);
      set('file_url', url);
    } catch (err: any) {
      setError(`Error al subir el archivo: ${err.message}`);
    }
  };

  const handleSave = async () => {
    if (!form.invoice_number.trim()) { setError('El número de factura es obligatorio'); return; }
    if (!form.client_name.trim()) { setError('El nombre del cliente es obligatorio'); return; }
    if (!form.amount || form.amount <= 0) { setError('El importe base debe ser mayor que 0'); return; }
    if (!form.issuer_id) { setError('Debes seleccionar un emisor'); return; }

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

  const handleAddIssuer = async () => {
    if (!newIssuer.name) return;
    try {
      const added = await createIssuer(newIssuer as any);
      if (added) {
        set('issuer_id', added.id);
        setShowIssuerModal(false);
        setNewIssuer({ name: '', nif: '', street_type: '', street_name: '', street_number: '', floor_door: '', address: '', city: '', province: '', zip: '', phone: '', email: '', is_default: false });
      }
    } catch (err: any) {
      setError(`Error al añadir emisor: ${err.message}`);
    }
  };

  if (loadingForm) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const selectedIssuer = issuers.find(i => i.id === form.issuer_id);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/facturas')} className="text-[#888888] hover:text-[#FAF8F5] transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="font-secondary text-3xl text-[#FAF8F5]">{isEditing ? 'Editar Registro' : 'Generador de Facturas'}</h1>
            <p className="font-primary text-[#666666] text-sm mt-1">Registro completo de facturación y directorio de emisores</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Factura'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-2">
          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="font-primary text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Main Form Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Config & Issuer */}
        <div className="flex flex-col gap-6">
          
          <div className={sectionClass}>
            <h2 className="font-primary text-[#FAF8F5] font-bold text-[10px] uppercase tracking-[0.2em] pb-3 border-b border-[#1F1F1F]">Tipo de Registro</h2>
            <div className="flex gap-1 p-1 bg-[#111] border border-[#1F1F1F]">
              <button onClick={() => set('type', 'income')} className={`flex-1 py-2 text-[10px] font-primary font-bold uppercase tracking-widest transition-all ${form.type === 'income' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'text-[#666666] hover:text-[#FAF8F5]'}`}>Ingreso</button>
              <button onClick={() => set('type', 'expense')} className={`flex-1 py-2 text-[10px] font-primary font-bold uppercase tracking-widest transition-all ${form.type === 'expense' ? 'bg-red-500 text-[#FAF8F5]' : 'text-[#666666] hover:text-[#FAF8F5]'}`}>Gasto</button>
            </div>
          </div>

          <div className={sectionClass}>
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
              <h2 className="font-primary text-[#FAF8F5] font-bold text-[10px] uppercase tracking-[0.2em]">Datos del Emisor</h2>
              <button 
                onClick={() => setShowIssuerModal(true)}
                className="text-[#C9A962] p-1 hover:bg-[#C9A962]/10 transition-colors rounded"
                title="Añadir nuevo emisor"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Seleccionar Emisor</label>
                <select 
                  className={inputClass} 
                  value={form.issuer_id || ''} 
                  onChange={e => set('issuer_id', e.target.value)}
                  disabled={loadingIssuers}
                >
                  <option value="">Selecciona un emisor...</option>
                  {issuers.map(i => (
                    <option key={i.id} value={i.id}>{i.name} {i.is_default ? '(Por defecto)' : ''}</option>
                  ))}
                </select>
              </div>

              {selectedIssuer && (
                <div className="bg-[#111] p-3 border border-[#1F1F1F] rounded-sm flex flex-col gap-1">
                  <p className="font-primary text-[#FAF8F5] text-xs font-bold">{selectedIssuer.name}</p>
                  <p className="font-primary text-[#888888] text-[10px]">{selectedIssuer.nif}</p>
                  <p className="font-primary text-[#666666] text-[9px] leading-tight">
                    {selectedIssuer.address}, {selectedIssuer.zip} {selectedIssuer.city}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className={sectionClass}>
            <h2 className="font-primary text-[#FAF8F5] font-bold text-[10px] uppercase tracking-[0.2em] pb-3 border-b border-[#1F1F1F]">Adjunto</h2>
            {form.file_url ? (
              <div className="flex items-center gap-3 p-3 bg-[#111] border border-[#1F1F1F]">
                <FileText className="w-6 h-6 text-[#C9A962]" />
                <a href={form.file_url} target="_blank" className="text-[10px] font-primary text-[#C9A962] hover:underline uppercase font-bold tracking-wider">Ver PDF</a>
                <button onClick={() => set('file_url', null)} className="ml-auto text-[#444] hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 border border-dashed border-[#1F1F1F] hover:border-[#C9A962]/30 cursor-pointer group transition-colors">
                <Upload className="w-6 h-6 text-[#333] group-hover:text-[#C9A962]" />
                <span className="text-[9px] font-primary text-[#666] uppercase tracking-widest">Subir PDF</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>

        </div>

        {/* Right Columns: Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className={sectionClass}>
             <h2 className="font-primary text-[#FAF8F5] font-bold text-[10px] uppercase tracking-[0.2em] pb-3 border-b border-[#1F1F1F]">Identificación y Pago</h2>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="flex flex-col gap-2">
                 <label className={labelClass}>Serie</label>
                 <input className={inputClass} value={form.series} onChange={e => set('series', e.target.value)} placeholder="Ej: A, B, R..." />
               </div>
               <div className="flex flex-col gap-2 lg:col-span-2">
                 <label className={labelClass}>Nº Factura *</label>
                 <input className={inputClass} value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} />
               </div>
               <div className="flex flex-col gap-2">
                 <label className={labelClass}>Estado</label>
                 <select className={inputClass} value={form.status} onChange={e => set('status', e.target.value as InvoiceStatus)}>
                   {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                 </select>
               </div>
               <div className="flex flex-col gap-2 lg:col-span-2">
                 <label className={labelClass}>Método de Pago</label>
                 <select className={inputClass} value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                   <option value="">Seleccionar...</option>
                   <option value="transferencia">Transferencia Bancaria</option>
                   <option value="bizum">Bizum</option>
                   <option value="paypal">PayPal</option>
                   <option value="efectivo">Efectivo</option>
                   <option value="tarjeta">Tarjeta</option>
                   <option value="domiciliacion">Domiciliación</option>
                 </select>
               </div>
                <div className="flex flex-col gap-2 lg:col-span-2">
                  <label className={labelClass}>Detalles de Pago (IBAN...)</label>
                  <input className={inputClass} value={form.payment_details ?? ''} onChange={e => set('payment_details', e.target.value)} placeholder="ES00 0000..." />
                </div>
               <div className="flex flex-col gap-2 lg:col-span-2">
                 <label className={labelClass}>Fecha Emisión</label>
                 <input type="date" className={inputClass} value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
               </div>
                <div className="flex flex-col gap-2 lg:col-span-2">
                  <label className={labelClass}>Fecha Vencimiento</label>
                  <input type="date" className={inputClass} value={form.due_date ?? ''} onChange={e => set('due_date', e.target.value || null)} />
                </div>

                {form.type === 'expense' && (
                  <div className="flex flex-col gap-2 lg:col-span-2">
                    <label className={labelClass}>Vincular a Gasto Fijo</label>
                    <select 
                      className={inputClass}
                      value={form.fixed_expense_id ?? ''} 
                      onChange={(e) => set('fixed_expense_id', e.target.value || null)}
                    >
                      <option value="">No vincular (Gasto Variable)</option>
                      {fixedExpenses.map(fe => (
                        <option key={fe.id} value={fe.id}>{fe.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#666666] mt-1 italic">
                      Vincular a un gasto fijo evita que se contabilice doble en el balance neto.
                    </p>
                  </div>
                )}
             </div>
          </div>

          <div className={sectionClass}>
            <h2 className="font-primary text-[#FAF8F5] font-bold text-[10px] uppercase tracking-[0.2em] pb-3 border-b border-[#1F1F1F]">Datos del Receptor (Cliente / Proveedor)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-3">
                <label className={labelClass}>Nombre / Razón Social *</label>
                <input className={inputClass} value={form.client_name} onChange={e => set('client_name', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>NIF / CIF</label>
                <input className={inputClass} value={form.client_nif || ''} onChange={e => set('client_nif', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1 lg:col-span-1">
                <label className={labelClass}>Tipo Vía</label>
                <select className={inputClass} value={form.client_street_type || ''} onChange={e => set('client_street_type', e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option value="Calle">Calle</option>
                  <option value="Avenida">Avenida</option>
                  <option value="Paseo">Paseo</option>
                  <option value="Plaza">Plaza</option>
                  <option value="Camino">Camino</option>
                  <option value="Carretera">Carretera</option>
                  <option value="Ronda">Ronda</option>
                  <option value="Pasaje">Pasaje</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 lg:col-span-1">
                <label className={labelClass}>Nombre Vía</label>
                <input className={inputClass} value={form.client_street_name || ''} onChange={e => set('client_street_name', e.target.value)} placeholder="Ej. Larios" />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Nº</label>
                <input className={inputClass} value={form.client_street_number || ''} onChange={e => set('client_street_number', e.target.value)} placeholder="Ej. 1A" />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Piso/Puerta</label>
                <input className={inputClass} value={form.client_floor_door || ''} onChange={e => set('client_floor_door', e.target.value)} placeholder="Ej. 3º B" />
              </div>
              <div className="flex flex-col gap-1 lg:col-span-2">
                <label className={labelClass}>Municipio</label>
                <input className={inputClass} value={form.client_city || ''} onChange={e => set('client_city', e.target.value)} placeholder="Málaga" />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Provincia</label>
                <input className={inputClass} value={form.client_province || ''} onChange={e => set('client_province', e.target.value)} placeholder="Málaga" />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>CP</label>
                <input className={inputClass} value={form.client_zip || ''} onChange={e => set('client_zip', e.target.value)} placeholder="29001" />
              </div>
              <div className="flex flex-col gap-1 lg:col-span-2">
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={form.client_email || ''} onChange={e => set('client_email', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1 lg:col-span-2">
                <label className={labelClass}>Teléfono</label>
                <input className={inputClass} value={form.client_phone || ''} onChange={e => set('client_phone', e.target.value)} />
              </div>
            </div>
          </div>

          <div className={sectionClass}>
             <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
              <h2 className="font-primary text-[#FAF8F5] font-bold text-[10px] uppercase tracking-[0.2em]">Líneas de Detalle</h2>
              <button 
                onClick={addItem}
                className="flex items-center gap-1 text-[#C9A962] hover:text-[#D4B673] font-primary text-[10px] uppercase font-bold transition-colors"
              >
                <Plus className="w-4 h-4" /> Añadir Línea
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_60px_90px_90px_40px] gap-2 items-center bg-[#111] p-2 border border-[#1F1F1F]">
                  <input className={inputClass} placeholder="Descripción..." value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  <input type="number" className={cn(inputClass, "px-1 text-center")} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                  <input type="number" step="0.01" className={cn(inputClass, "px-1 text-right")} value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                  <div className="font-secondary text-[#FAF8F5] text-right text-xs">{formatCurrency(item.quantity * item.price)}</div>
                  <button onClick={() => removeItem(idx)} className="text-[#444] hover:text-red-400 flex justify-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {form.items.length === 0 && (
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Base Imponible Manual (€)</label>
                  <input type="number" step="0.01" className={inputClass} value={form.amount} onChange={e => set('amount', parseFloat(e.target.value) || 0)} />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={sectionClass}>
              <h2 className="font-primary text-[#FAF8F5] font-bold text-[10px] uppercase tracking-[0.2em] pb-3 border-b border-[#1F1F1F]">Impuestos e IRPF</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>IVA (%)</label>
                  <select className={inputClass} value={form.tax_rate} onChange={e => set('tax_rate', parseFloat(e.target.value))}>
                    <option value={0}>0%</option>
                    <option value={4}>4%</option>
                    <option value={10}>10%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>IRPF (%)</label>
                  <select className={inputClass} value={form.irpf_rate} onChange={e => set('irpf_rate', parseFloat(e.target.value))}>
                    <option value={0}>0%</option>
                    <option value={7}>7%</option>
                    <option value={15}>15%</option>
                    <option value={19}>19%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-[#C9A962]/20 p-6 flex flex-col gap-3">
              <div className="flex justify-between font-primary text-[10px] uppercase tracking-wider text-[#666]">
                <span>Total Base</span>
                <span>{formatCurrency(form.amount)}</span>
              </div>
              <div className="flex justify-between font-primary text-[10px] uppercase tracking-wider text-[#666]">
                <span>IVA ({form.tax_rate}%)</span>
                <span>{formatCurrency(form.amount * form.tax_rate / 100)}</span>
              </div>
              {form.irpf_rate > 0 && (
                <div className="flex justify-between font-primary text-[10px] uppercase tracking-wider text-red-400">
                  <span>IRPF ({form.irpf_rate}%)</span>
                  <span>-{formatCurrency(form.amount * form.irpf_rate / 100)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#1F1F1F] pt-3 mt-1">
                <span className="font-primary text-[10px] uppercase tracking-widest font-bold text-[#666]">Total</span>
                <span className="font-secondary text-2xl text-[#C9A962]">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Issuer Modal */}
      {showIssuerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] w-full max-w-md p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-secondary text-xl text-[#FAF8F5]">Añadir Emisor al Directorio</h3>
              <button onClick={() => setShowIssuerModal(false)} className="text-[#444] hover:text-[#FAF8F5]"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Nombre / Empresa</label>
                <input className={inputClass} value={newIssuer.name} onChange={e => setNewIssuer({...newIssuer, name: e.target.value})} placeholder="Ej: Gelabert Homes SL" />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>NIF / CIF</label>
                <input className={inputClass} value={newIssuer.nif} onChange={e => setNewIssuer({...newIssuer, nif: e.target.value})} placeholder="Ej: B12345678" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Tipo Vía</label>
                  <select className={inputClass} value={newIssuer.street_type || ''} onChange={e => setNewIssuer({...newIssuer, street_type: e.target.value})}>
                    <option value="">Seleccionar</option>
                    <option value="Calle">Calle</option>
                    <option value="Avenida">Avenida</option>
                    <option value="Paseo">Paseo</option>
                    <option value="Plaza">Plaza</option>
                    <option value="Camino">Camino</option>
                    <option value="Carretera">Carretera</option>
                    <option value="Ronda">Ronda</option>
                    <option value="Pasaje">Pasaje</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Nombre Vía</label>
                  <input className={inputClass} value={newIssuer.street_name || ''} onChange={e => setNewIssuer({...newIssuer, street_name: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Número</label>
                  <input className={inputClass} value={newIssuer.street_number || ''} onChange={e => setNewIssuer({...newIssuer, street_number: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Piso/Puerta</label>
                  <input className={inputClass} value={newIssuer.floor_door || ''} onChange={e => setNewIssuer({...newIssuer, floor_door: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Municipio</label>
                  <input className={inputClass} value={newIssuer.city} onChange={e => setNewIssuer({...newIssuer, city: e.target.value})} placeholder="Málaga" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Provincia</label>
                  <input className={inputClass} value={newIssuer.province || ''} onChange={e => setNewIssuer({...newIssuer, province: e.target.value})} placeholder="Málaga" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>CP</label>
                  <input className={inputClass} value={newIssuer.zip} onChange={e => setNewIssuer({...newIssuer, zip: e.target.value})} placeholder="29001" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <input type="checkbox" checked={newIssuer.is_default} onChange={e => setNewIssuer({...newIssuer, is_default: e.target.checked})} className="w-4 h-4 accent-[#C9A962]" />
                <span className="text-[10px] font-primary text-[#FAF8F5] uppercase tracking-widest">Establecer como predeterminado</span>
              </label>
            </div>

            <button onClick={handleAddIssuer} className="w-full py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-xs uppercase tracking-widest hover:bg-[#D4B673] transition-colors">Confirmar y Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
};
