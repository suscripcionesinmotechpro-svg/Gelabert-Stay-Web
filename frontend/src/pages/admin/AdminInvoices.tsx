import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoiceSummary, useInvoices, useInvoiceMutations } from '../../hooks/useInvoices';
import { useAccounting } from '../../hooks/useAccounting';
import { STATUS_LABELS } from '../../types/invoice';
import { 
  PlusCircle, TrendingUp, Zap,
  Trash2, Edit, ArrowUpRight, 
  Calculator, Check, X, Building2, Mail, Phone, MapPin, Receipt
} from 'lucide-react';
import { useIssuers } from '../../hooks/useIssuers';
import { cn } from '../../lib/utils';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
type PeriodType = 'year' | 'h1' | 'h2' | 'q1' | 'q2' | 'q3' | 'q4' | 'month';

const cardClass = "bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-col gap-2";
const inputClass = "w-full h-10 bg-[#0F0F0F] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";

export const AdminInvoices = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'variable_expenses' | 'fixed_expenses' | 'issuers'>('invoices');
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [filterInvoiceType, setFilterInvoiceType] = useState<'income' | 'expense' | 'all'>('all');

  // State for monthly variable amounts (keyed by fixed_expense_id)
  const [variableMonthlyAmounts, setVariableMonthlyAmounts] = useState<Record<string, string>>({});
  const [savingMonthlyEntry, setSavingMonthlyEntry] = useState<string | null>(null);

  const [isAddingFixed, setIsAddingFixed] = useState(false);
  const [newFixedExpense, setNewFixedExpense] = useState({
    name: '',
    amount: 0,
    category: 'General',
    day_of_month: 1,
    day_of_month_end: null as number | null,
    frequency: 'monthly' as const,
    is_variable: false,
    is_active: true
  });

  const { 
    fixedExpenses, 
    variableMonthlyEntries,
    addFixedExpense, 
    updateFixedExpense, 
    deleteFixedExpense,
    upsertVariableMonthlyEntry,
  } = useAccounting();

  const getDateRange = () => {
    if (periodType === 'year') {
      return { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31`, label: 'Anual' };
    }
    if (periodType === 'month') {
      const m = String(selectedMonth).padStart(2, '0');
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      return { start: `${selectedYear}-${m}-01`, end: `${selectedYear}-${m}-${lastDay}`, label: MONTHS[selectedMonth - 1] };
    }
    const mapping: Record<PeriodType, any> = {
      'h1': { start: `${selectedYear}-01-01`, end: `${selectedYear}-06-30`, label: '1º Semestre' },
      'h2': { start: `${selectedYear}-07-01`, end: `${selectedYear}-12-31`, label: '2º Semestre' },
      'q1': { start: `${selectedYear}-01-01`, end: `${selectedYear}-03-31`, label: 'Q1' },
      'q2': { start: `${selectedYear}-04-01`, end: `${selectedYear}-06-30`, label: 'Q2' },
      'q3': { start: `${selectedYear}-07-01`, end: `${selectedYear}-09-30`, label: 'Q3' },
      'q4': { start: `${selectedYear}-10-01`, end: `${selectedYear}-12-31`, label: 'Q4' },
      'year': { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31`, label: 'Anual' },
      'month': { start: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`, end: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`, label: MONTHS[selectedMonth - 1] }
    };
    return mapping[periodType] || mapping['year'];
  };

  const dateRange = getDateRange();

  const { summary, loading: loadingSummary } = useInvoiceSummary({
    startDate: dateRange.start,
    endDate: dateRange.end
  });
  
  const { invoices, refetch } = useInvoices({
    startDate: dateRange.start,
    endDate: dateRange.end,
    status: selectedStatus,
  });

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'invoices') {
      if (filterInvoiceType === 'all') return true;
      return inv.type === filterInvoiceType;
    }
    if (activeTab === 'variable_expenses') return inv.type === 'expense';
    return true;
  });

  const { deleteInvoice } = useInvoiceMutations();

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta factura?')) return;
    try {
      await deleteInvoice(id);
      refetch();
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };



  const { issuers, createIssuer, updateIssuer, deleteIssuer } = useIssuers();
  const [isAddingIssuer, setIsAddingIssuer] = useState(false);
  const [newIssuer, setNewIssuer] = useState({
    name: '',
    nif: '',
    street_type: '',
    street_name: '',
    street_number: '',
    floor_door: '',
    address: '',
    zip: '',
    city: '',
    province: '',
    email: '',
    phone: '',
    is_default: false
  });

  const [editingFixedId, setEditingFixedId] = useState<string | null>(null);
  const [editingFixedData, setEditingFixedData] = useState<any>(null);
  const [editingIssuerId, setEditingIssuerId] = useState<string | null>(null);
  const [editingIssuerData, setEditingIssuerData] = useState<any>(null);

  const handleSaveFixedExpense = async () => {
    if (!newFixedExpense.name || newFixedExpense.amount <= 0) return;
    await addFixedExpense(newFixedExpense);
    setIsAddingFixed(false);
    setNewFixedExpense({ 
      name: '', 
      amount: 0, 
      category: 'General', 
      day_of_month: 1, 
      day_of_month_end: null,
      frequency: 'monthly',
      is_variable: false,
      is_active: true 
    });
  };

  const handleUpdateFixedExpense = async (id: string) => {
    if (!editingFixedData) return;
    await updateFixedExpense(id, editingFixedData);
    setEditingFixedId(null);
    setEditingFixedData(null);
  };

  const handleSaveIssuer = async () => {
    if (!newIssuer.name) return;
    try {
      await createIssuer(newIssuer);
      setIsAddingIssuer(false);
      setNewIssuer({ name: '', nif: '', street_type: '', street_name: '', street_number: '', floor_door: '', address: '', zip: '', city: '', province: '', email: '', phone: '', is_default: false });
    } catch (err) {
      console.error('Error saving issuer:', err);
    }
  };

  const handleUpdateIssuer = async (id: string) => {
    if (!editingIssuerData) return;
    await updateIssuer(id, editingIssuerData);
    setEditingIssuerId(null);
    setEditingIssuerData(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-secondary text-4xl text-[#FAF8F5]">Contabilidad</h1>
          <p className="font-primary text-[#666666] text-sm mt-2">
            Gestión unificada de ingresos, gastos y directorio fiscal
          </p>
        </div>
        
        <div className="flex bg-[#0A0A0A] border border-[#1F1F1F] p-1 h-11 self-start md:self-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`px-6 h-full font-primary text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
              activeTab === 'invoices' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FAF8F5]'
            }`}
          >
            Facturación
          </button>
          <button 
            onClick={() => setActiveTab('variable_expenses')}
            className={`px-6 h-full font-primary text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
              activeTab === 'variable_expenses' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FAF8F5]'
            }`}
          >
            Gastos Variables
          </button>
          <button 
            onClick={() => setActiveTab('fixed_expenses')}
            className={`px-6 h-full font-primary text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
              activeTab === 'fixed_expenses' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FAF8F5]'
            }`}
          >
            Gastos Fijos
          </button>
          <button 
            onClick={() => setActiveTab('issuers')}
            className={`px-6 h-full font-primary text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
              activeTab === 'issuers' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FAF8F5]'
            }`}
          >
            Emisores
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Balance */}
        <div className={cn(cardClass, summary.totalPeriod >= 0 ? 'border-[#C9A962]/40 bg-[#C9A962]/5' : 'border-red-500/30 bg-red-500/5')}>
          <div className={cn("flex items-center gap-2", summary.totalPeriod >= 0 ? 'text-[#C9A962]' : 'text-red-400')}>
            <Calculator className="w-4 h-4" />
            <span className="font-primary text-[10px] uppercase tracking-wider text-[#666]">Balance {dateRange.label}</span>
          </div>
          <p className={cn("font-secondary text-2xl leading-tight", summary.totalPeriod >= 0 ? 'text-[#C9A962]' : 'text-red-400')}>
            {loadingSummary ? '—' : formatCurrency(summary.totalPeriod)}
          </p>
        </div>
        {/* Ingresos */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-green-400">
            <ArrowUpRight className="w-4 h-4" />
            <span className="font-primary text-[10px] uppercase tracking-wider text-[#666]">Ingresos</span>
          </div>
          <p className="font-secondary text-2xl leading-tight text-green-400">
            {loadingSummary ? '—' : formatCurrency(summary.income)}
          </p>
          <span className="text-[9px] text-[#444] font-primary uppercase tracking-tighter">Facturas cobradas</span>
        </div>
        {/* Gastos Fijos */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-orange-400">
            <TrendingUp className="w-4 h-4" />
            <span className="font-primary text-[10px] uppercase tracking-wider text-[#666]">Gastos Fijos</span>
          </div>
          <p className="font-secondary text-2xl leading-tight text-orange-400">
            {loadingSummary ? '—' : formatCurrency(summary.fixedExpenses)}
          </p>
          <span className="text-[9px] text-[#444] font-primary uppercase tracking-tighter">Alquiler, seguros...</span>
        </div>
        {/* Gastos Variables */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-yellow-400">
            <Zap className="w-4 h-4" />
            <span className="font-primary text-[10px] uppercase tracking-wider text-[#666]">Gastos Variables</span>
          </div>
          <p className="font-secondary text-2xl leading-tight text-yellow-400">
            {loadingSummary ? '—' : formatCurrency(summary.variableExpenses)}
          </p>
          <span className="text-[9px] text-[#444] font-primary uppercase tracking-tighter">Luz, agua, teléfono...</span>
        </div>
        {/* Gastos Facturas */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-red-400">
            <Receipt className="w-4 h-4" />
            <span className="font-primary text-[10px] uppercase tracking-wider text-[#666]">Gastos Facturas</span>
          </div>
          <p className="font-secondary text-2xl leading-tight text-red-400">
            {loadingSummary ? '—' : formatCurrency(summary.invoiceExpenses)}
          </p>
          <span className="text-[9px] text-[#444] font-primary uppercase tracking-tighter">Sin vincular a fijo</span>
        </div>
      </div>

      {activeTab === 'invoices' || activeTab === 'variable_expenses' ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center bg-[#0A0A0A] border border-[#1F1F1F] p-3">
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y: number) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={cn(
                    'px-4 py-1.5 font-primary text-sm border transition-colors',
                    selectedYear === y
                      ? 'bg-[#C9A962] text-[#0A0A0A] border-[#C9A962]'
                      : 'border-[#1F1F1F] text-[#888888] hover:border-[#C9A962] hover:text-[#C9A962]'
                  )}
                >
                  {y}
                </button>
              ))}

              <div className="w-px h-6 bg-[#1F1F1F] mx-2" />

              <select
                value={periodType}
                onChange={e => setPeriodType(e.target.value as PeriodType)}
                className="h-9 bg-[#111] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
              >
                <option value="year">Todo el año (Anual)</option>
                <optgroup label="Trimestres">
                  <option value="q1">1º Trimestre (Q1)</option>
                  <option value="q2">2º Trimestre (Q2)</option>
                  <option value="q3">3º Trimestre (Q3)</option>
                  <option value="q4">4º Trimestre (Q4)</option>
                </optgroup>
                <optgroup label="Semestres">
                  <option value="h1">1º Semestre</option>
                  <option value="h2">2º Semestre</option>
                </optgroup>
                <option value="month">Mes Específico...</option>
              </select>

              {periodType === 'month' && (
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="h-9 bg-[#111] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              )}

              <div className="w-px h-6 bg-[#1F1F1F] mx-2" />

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="h-9 bg-[#111] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
              >
                <option value="todos">Todos los estados</option>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>

              <div className="w-px h-6 bg-[#1F1F1F] mx-2" />

              <div className="flex bg-[#111] border border-[#1F1F1F] p-0.5 h-9">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'income', label: 'Ingresos' },
                  { id: 'expense', label: 'Gastos' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilterInvoiceType(t.id as any)}
                    className={cn(
                      "px-3 h-full font-primary text-[9px] uppercase tracking-wider font-bold transition-all",
                      filterInvoiceType === t.id ? "bg-[#C9A962] text-[#0A0A0A]" : "text-[#666] hover:text-[#FAF8F5]"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Link
              to="/admin/facturas/nueva"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva Factura
            </Link>
          </div>

          {activeTab === 'invoices' ? (
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                    <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Factura</th>
                    <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Cliente / Concepto</th>
                    <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Fecha</th>
                    <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-right">Base</th>
                    <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-right">Total</th>
                    <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Estado</th>
                    <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-[#444] text-xs uppercase italic">
                        No se encontraron facturas para este periodo
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#111] transition-colors">
                        <td className="px-6 py-4 font-primary text-[#FAF8F5] text-xs font-bold">{inv.invoice_number}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-primary text-[#FAF8F5] text-xs">{inv.client_name}</span>
                            <span className="text-[10px] text-[#666] font-primary">{inv.type === 'income' ? 'Ingreso' : 'Gasto'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-primary text-[#888] text-[10px]">
                          {new Date(inv.invoice_date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 font-secondary text-[#FAF8F5] text-xs text-right">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-6 py-4 font-secondary text-[#C9A962] text-xs font-bold text-right">
                          {formatCurrency(inv.total_amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                            inv.status === 'pagado' ? 'border-green-400/30 text-green-400 bg-green-400/5' :
                            inv.status === 'pendiente' ? 'border-[#C9A962]/30 text-[#C9A962] bg-[#C9A962]/5' :
                            'border-red-400/30 text-red-400 bg-red-400/5'
                          )}>
                            {STATUS_LABELS[inv.status as keyof typeof STATUS_LABELS]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link 
                              to={`/admin/facturas/${inv.id}/editar`} 
                              className="p-1 text-[#444] hover:text-[#FAF8F5] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button 
                              onClick={() => handleDelete(inv.id)} 
                              className="p-1 text-[#444] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ─── GASTOS VARIABLES TAB ─────────────────────────────────────── */
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">Gastos Variables</h2>
                  </div>
                  <p className="font-primary text-[#666] text-[10px] uppercase tracking-widest ml-7">
                    Gastos cuyo importe cambia cada mes — introduce el importe real para cada periodo
                  </p>
                </div>
                <button
                  onClick={() => { setIsAddingFixed(true); setNewFixedExpense(prev => ({ ...prev, is_variable: true })); setActiveTab('fixed_expenses'); }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[10px] uppercase tracking-widest hover:bg-[#D4B673] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Nuevo Variable
                </button>
              </div>

              {/* Month selector for this tab */}
              <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#1F1F1F] p-3">
                <span className="font-primary text-[9px] text-[#666] uppercase tracking-widest">Imputar mes:</span>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="h-8 bg-[#111] border border-[#1F1F1F] px-3 font-primary text-xs text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="h-8 bg-[#111] border border-[#1F1F1F] px-3 font-primary text-xs text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="font-primary text-[9px] text-[#444] uppercase tracking-widest ml-2">
                  — Introduce el importe real de {MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
              </div>

              {/* Variable expenses list with monthly entry inputs */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                      <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Concepto</th>
                      <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Categoría</th>
                      <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-right">Estimación</th>
                      <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Importe Real {MONTHS[selectedMonth - 1]}</th>
                      <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F]">
                    {fixedExpenses.filter(fe => fe.is_variable).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Zap className="w-8 h-8 text-[#333]" />
                            <p className="font-primary text-[#444] text-[10px] uppercase tracking-wider">No hay gastos variables configurados</p>
                            <p className="font-primary text-[#333] text-[10px]">
                              Ve a "Gastos Fijos", añade un gasto y marca "Variable" para que aparezca aquí
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      fixedExpenses.filter(fe => fe.is_variable && fe.is_active).map(fe => {
                        // Find existing monthly entry for this expense + selected month
                        const existingEntry = variableMonthlyEntries.find(
                          m => m.fixed_expense_id === fe.id && m.year === selectedYear && m.month === selectedMonth
                        );
                        const currentInput = variableMonthlyAmounts[fe.id] ?? (existingEntry ? String(existingEntry.actual_amount) : '');
                        const hasEntry = !!existingEntry;
                        const isSaving = savingMonthlyEntry === fe.id;

                        return (
                          <tr key={fe.id} className="hover:bg-[#111] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-primary text-[#FAF8F5] text-xs font-bold">{fe.name}</span>
                                <span className="text-[9px] text-[#C9A962] font-primary uppercase tracking-tighter">Variable</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-primary text-[10px] text-[#666] uppercase">{fe.category}</td>
                            <td className="px-6 py-4 font-secondary text-xs text-[#555] text-right">
                              {formatCurrency(fe.amount)}
                              <div className="text-[9px] text-[#444] font-primary mt-0.5">estimación</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 text-[#666] text-xs font-bold">€</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder={String(fe.amount)}
                                    value={currentInput}
                                    onChange={e => setVariableMonthlyAmounts(prev => ({ ...prev, [fe.id]: e.target.value }))}
                                    className={cn(
                                      "w-32 h-9 pl-7 pr-3 bg-[#0F0F0F] border text-right font-secondary text-sm text-[#FAF8F5] outline-none transition-colors",
                                      hasEntry ? "border-yellow-500/40 focus:border-yellow-400" : "border-[#1F1F1F] focus:border-[#C9A962]"
                                    )}
                                  />
                                </div>
                                <button
                                  disabled={isSaving || currentInput === ''}
                                  onClick={async () => {
                                    setSavingMonthlyEntry(fe.id);
                                    try {
                                      await upsertVariableMonthlyEntry(
                                        fe.id,
                                        selectedYear,
                                        selectedMonth,
                                        parseFloat(currentInput) || 0
                                      );
                                      setVariableMonthlyAmounts(prev => {
                                        const next = { ...prev };
                                        delete next[fe.id];
                                        return next;
                                      });
                                    } finally {
                                      setSavingMonthlyEntry(null);
                                    }
                                  }}
                                  className={cn(
                                    "h-9 px-3 font-primary text-[9px] uppercase tracking-wider font-bold transition-all border",
                                    currentInput !== ''
                                      ? "bg-[#C9A962] text-[#0A0A0A] border-[#C9A962] hover:bg-[#D4B673]"
                                      : "text-[#444] border-[#1F1F1F] cursor-not-allowed"
                                  )}
                                >
                                  {isSaving ? '...' : <Check className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {hasEntry ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-wider">✓ Registrado</span>
                                  <span className="text-[9px] text-[#444] font-primary">{formatCurrency(existingEntry.actual_amount)}</span>
                                </div>
                              ) : (
                                <span className="text-[9px] text-[#444] font-primary uppercase tracking-wider">Sin registrar</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Inactive variables */}
              {fixedExpenses.filter(fe => fe.is_variable && !fe.is_active).length > 0 && (
                <div className="border border-[#1F1F1F] p-4">
                  <p className="font-primary text-[9px] text-[#444] uppercase tracking-widest mb-3">Gastos variables inactivos</p>
                  <div className="flex flex-wrap gap-2">
                    {fixedExpenses.filter(fe => fe.is_variable && !fe.is_active).map(fe => (
                      <span key={fe.id} className="px-3 py-1 border border-[#1F1F1F] font-primary text-[10px] text-[#444] uppercase">
                        {fe.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeTab === 'fixed_expenses' ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#C9A962]" />
              <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">Gestión de Gastos Fijos</h2>
            </div>
            <button 
              onClick={() => setIsAddingFixed(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[10px] uppercase tracking-widest hover:bg-[#D4B673] transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Nuevo Gasto
            </button>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Concepto</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Categoría</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Frecuencia</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Día Pago</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Variable</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-right">Importe</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Estado</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {isAddingFixed && (
                  <tr className="border-b border-[#C9A962]/30 bg-[#C9A962]/5">
                    <td className="px-6 py-4">
                      <input className={inputClass} placeholder="Alquiler, Gestoría..." value={newFixedExpense.name} onChange={e => setNewFixedExpense({...newFixedExpense, name: e.target.value})} />
                    </td>
                    <td className="px-6 py-4">
                      <input className={inputClass} placeholder="Oficina" value={newFixedExpense.category} onChange={e => setNewFixedExpense({...newFixedExpense, category: e.target.value})} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        className={cn(inputClass, "w-24 mx-auto")} 
                        value={newFixedExpense.frequency} 
                        onChange={e => setNewFixedExpense({...newFixedExpense, frequency: e.target.value as any})}
                      >
                        <option value="monthly">Mensual</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="semiannual">Semestral</option>
                        <option value="annual">Anual</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <input 
                          type="number" min="1" max="31" 
                          className={cn(inputClass, "w-12 text-center px-1")} 
                          value={newFixedExpense.day_of_month || ''} 
                          onChange={e => setNewFixedExpense({...newFixedExpense, day_of_month: parseInt(e.target.value) || 1})} 
                          placeholder="Ini"
                        />
                        <span className="text-[#444]">-</span>
                        <input 
                          type="number" min="1" max="31" 
                          className={cn(inputClass, "w-12 text-center px-1")} 
                          value={newFixedExpense.day_of_month_end || ''} 
                          onChange={e => setNewFixedExpense({...newFixedExpense, day_of_month_end: parseInt(e.target.value) || null})} 
                          placeholder="Fin"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="accent-[#C9A962]" 
                        checked={newFixedExpense.is_variable} 
                        onChange={e => setNewFixedExpense({...newFixedExpense, is_variable: e.target.checked})} 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input type="number" step="0.01" className={cn(inputClass, "w-24 ml-auto text-right")} value={newFixedExpense.amount} onChange={e => setNewFixedExpense({...newFixedExpense, amount: parseFloat(e.target.value) || 0})} />
                    </td>
                    <td className="px-6 py-4 text-center"><span className="text-[10px] font-bold text-[#C9A962] uppercase tracking-wider">Nuevo</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-[#C9A962]">
                        <button onClick={handleSaveFixedExpense}><Check className="w-5 h-5 transition-transform hover:scale-110" /></button>
                        <button onClick={() => setIsAddingFixed(false)} className="text-[#444] hover:text-red-400"><X className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                )}
                {fixedExpenses.length === 0 && !isAddingFixed ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-[#444] text-xs uppercase italic">No hay gastos fijos configurados</td></tr>
                ) : (
                  fixedExpenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-[#111] transition-colors">
                      {editingFixedId === expense.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input 
                              className={inputClass} 
                              value={editingFixedData?.name || ''} 
                              onChange={e => setEditingFixedData({ ...editingFixedData, name: e.target.value })} 
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              className={inputClass} 
                              value={editingFixedData?.category || ''} 
                              onChange={e => setEditingFixedData({ ...editingFixedData, category: e.target.value })} 
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <select 
                              className={cn(inputClass, "w-24 mx-auto")} 
                              value={editingFixedData?.frequency || 'monthly'} 
                              onChange={e => setEditingFixedData({...editingFixedData, frequency: e.target.value as any})}
                            >
                              <option value="monthly">Mensual</option>
                              <option value="quarterly">Trimestral</option>
                              <option value="semiannual">Semestral</option>
                              <option value="annual">Anual</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <input 
                                type="number" 
                                className={cn(inputClass, "w-12 text-center px-1")} 
                                value={editingFixedData?.day_of_month || 1} 
                                onChange={e => setEditingFixedData({ ...editingFixedData, day_of_month: parseInt(e.target.value) || 1 })} 
                              />
                              <span className="text-[#444]">-</span>
                              <input 
                                type="number" 
                                className={cn(inputClass, "w-12 text-center px-1")} 
                                value={editingFixedData?.day_of_month_end || ''} 
                                onChange={e => setEditingFixedData({ ...editingFixedData, day_of_month_end: parseInt(e.target.value) || null })} 
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              className="accent-[#C9A962]" 
                              checked={editingFixedData?.is_variable || false} 
                              onChange={e => setEditingFixedData({...editingFixedData, is_variable: e.target.checked})} 
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <input 
                              type="number" 
                              step="0.01" 
                              className={cn(inputClass, "w-24 ml-auto text-right")} 
                              value={editingFixedData?.amount || 0} 
                              onChange={e => setEditingFixedData({ ...editingFixedData, amount: parseFloat(e.target.value) || 0 })} 
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Check className="w-5 h-5 text-[#C9A962] mx-auto cursor-pointer" onClick={() => handleUpdateFixedExpense(expense.id)} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <X className="w-5 h-5 text-[#444] cursor-pointer" onClick={() => { setEditingFixedId(null); setEditingFixedData(null); }} />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-primary text-xs text-[#FAF8F5]">{expense.name}</td>
                          <td className="px-6 py-4 font-primary text-[10px] text-[#666] uppercase">{expense.category}</td>
                          <td className="px-6 py-4 font-primary text-[10px] text-[#888] text-center uppercase">
                            {expense.frequency === 'monthly' ? 'Mensual' : 
                             expense.frequency === 'quarterly' ? 'Trimestral' :
                             expense.frequency === 'semiannual' ? 'Semestral' : 'Anual'}
                          </td>
                          <td className="px-6 py-4 font-primary text-xs text-[#888] text-center">
                            {expense.day_of_month}{expense.day_of_month_end ? `-${expense.day_of_month_end}` : ''}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {expense.is_variable ? (
                              <span className="text-[10px] text-[#C9A962] font-bold uppercase tracking-wider">Sí</span>
                            ) : (
                              <span className="text-[10px] text-[#444] font-bold uppercase tracking-wider">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-secondary text-sm text-[#FAF8F5] text-right">{formatCurrency(expense.amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => updateFixedExpense(expense.id, { is_active: !expense.is_active })}
                              className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                                expense.is_active 
                                  ? 'border-green-400/30 text-green-400 bg-green-400/5' 
                                  : 'border-red-400/30 text-red-400 bg-red-400/5'
                              )}
                            >
                              {expense.is_active ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setEditingFixedId(expense.id); setEditingFixedData(expense); }} className="text-[#444] hover:text-[#FAF8F5] transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteFixedExpense(expense.id)} className="text-[#444] hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Issuers Tab Content */
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#C9A962]" />
              <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">Directorio de Emisores</h2>
            </div>
            <button 
              onClick={() => setIsAddingIssuer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[10px] uppercase tracking-widest hover:bg-[#D4B673] transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Nuevo Emisor
            </button>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Nombre / Empresa</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">NIF/CIF</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Ubicación</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em]">Contacto</th>
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {isAddingIssuer && (
                  <tr className="border-b border-[#C9A962]/30 bg-[#C9A962]/5">
                    <td className="px-6 py-4">
                      <input className={inputClass} placeholder="Nombre Fiscal" value={newIssuer.name} onChange={e => setNewIssuer({...newIssuer, name: e.target.value})} />
                    </td>
                    <td className="px-6 py-4">
                      <input className={inputClass} placeholder="B12345678" value={newIssuer.nif} onChange={e => setNewIssuer({...newIssuer, nif: e.target.value})} />
                    </td>
                    <td className="px-6 py-4 min-w-[280px]">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <select className={cn(inputClass, "w-1/3 px-1 text-center")} value={newIssuer.street_type || ''} onChange={e => setNewIssuer({...newIssuer, street_type: e.target.value})}>
                            <option value="">Tipo Vía</option>
                            <option value="Calle">Calle</option>
                            <option value="Avenida">Avenida</option>
                            <option value="Paseo">Paseo</option>
                            <option value="Plaza">Plaza</option>
                            <option value="Camino">Camino</option>
                            <option value="Carretera">Carretera</option>
                            <option value="Ronda">Ronda</option>
                            <option value="Pasaje">Pasaje</option>
                          </select>
                          <input className={cn(inputClass, "w-2/3")} placeholder="Nombre Vía" value={newIssuer.street_name || ''} onChange={e => setNewIssuer({...newIssuer, street_name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <input className={cn(inputClass, "col-span-1")} placeholder="Nº" value={newIssuer.street_number || ''} onChange={e => setNewIssuer({...newIssuer, street_number: e.target.value})} />
                          <input className={cn(inputClass, "col-span-1")} placeholder="Piso" value={newIssuer.floor_door || ''} onChange={e => setNewIssuer({...newIssuer, floor_door: e.target.value})} />
                          <input className={cn(inputClass, "col-span-2")} placeholder="C.P." value={newIssuer.zip || ''} onChange={e => setNewIssuer({...newIssuer, zip: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input className={inputClass} placeholder="Municipio" value={newIssuer.city || ''} onChange={e => setNewIssuer({...newIssuer, city: e.target.value})} />
                          <input className={inputClass} placeholder="Provincia" value={newIssuer.province || ''} onChange={e => setNewIssuer({...newIssuer, province: e.target.value})} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <input className={inputClass} placeholder="Email" value={newIssuer.email} onChange={e => setNewIssuer({...newIssuer, email: e.target.value})} />
                        <input className={inputClass} placeholder="Teléfono" value={newIssuer.phone} onChange={e => setNewIssuer({...newIssuer, phone: e.target.value})} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top pt-8">
                      <div className="flex items-center justify-end gap-2 text-[#C9A962]">
                        <button onClick={handleSaveIssuer}><Check className="w-5 h-5" /></button>
                        <button onClick={() => setIsAddingIssuer(false)} className="text-[#444]"><X className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                )}
                {issuers.length === 0 && !isAddingIssuer ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-[#444] text-xs uppercase italic">No hay emisores registrados</td></tr>
                ) : (
                  issuers.map((issuer) => (
                    <tr key={issuer.id} className="border-b border-[#1F1F1F] hover:bg-[#1A1A1A] transition-colors">
                      {editingIssuerId === issuer.id ? (
                        <>
                          <td className="px-6 py-4">
                            <input 
                              className={inputClass} 
                              value={editingIssuerData?.name || ''} 
                              onChange={e => setEditingIssuerData({ ...editingIssuerData, name: e.target.value })} 
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              className={inputClass} 
                              value={editingIssuerData?.nif || ''} 
                              onChange={e => setEditingIssuerData({ ...editingIssuerData, nif: e.target.value })} 
                            />
                          </td>
                          <td className="px-6 py-4 min-w-[280px]">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <select className={cn(inputClass, "w-1/3 px-1 text-center")} value={editingIssuerData?.street_type || ''} onChange={e => setEditingIssuerData({ ...editingIssuerData, street_type: e.target.value })}>
                                  <option value="">Tipo Vía</option>
                                  <option value="Calle">Calle</option>
                                  <option value="Avenida">Avenida</option>
                                  <option value="Paseo">Paseo</option>
                                  <option value="Plaza">Plaza</option>
                                  <option value="Camino">Camino</option>
                                  <option value="Carretera">Carretera</option>
                                  <option value="Ronda">Ronda</option>
                                  <option value="Pasaje">Pasaje</option>
                                </select>
                                <input className={cn(inputClass, "w-2/3")} placeholder="Nombre Vía" value={editingIssuerData?.street_name || ''} onChange={e => setEditingIssuerData({ ...editingIssuerData, street_name: e.target.value })} />
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <input className={cn(inputClass, "col-span-1")} placeholder="Nº" value={editingIssuerData?.street_number || ''} onChange={e => setEditingIssuerData({ ...editingIssuerData, street_number: e.target.value })} />
                                <input className={cn(inputClass, "col-span-1")} placeholder="Piso" value={editingIssuerData?.floor_door || ''} onChange={e => setEditingIssuerData({ ...editingIssuerData, floor_door: e.target.value })} />
                                <input className={cn(inputClass, "col-span-2")} placeholder="C.P." value={editingIssuerData?.zip || ''} onChange={e => setEditingIssuerData({ ...editingIssuerData, zip: e.target.value })} />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input className={inputClass} placeholder="Municipio" value={editingIssuerData?.city || ''} onChange={e => setEditingIssuerData({ ...editingIssuerData, city: e.target.value })} />
                                <input className={inputClass} placeholder="Provincia" value={editingIssuerData?.province || ''} onChange={e => setEditingIssuerData({ ...editingIssuerData, province: e.target.value })} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <input 
                                className={cn(inputClass, "h-8")} 
                                placeholder="Email" 
                                value={editingIssuerData?.email || ''} 
                                onChange={e => setEditingIssuerData({ ...editingIssuerData, email: e.target.value })} 
                              />
                              <input 
                                className={cn(inputClass, "h-8 text-[10px]")} 
                                placeholder="Teléfono" 
                                value={editingIssuerData?.phone || ''} 
                                onChange={e => setEditingIssuerData({ ...editingIssuerData, phone: e.target.value })} 
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 text-[#C9A962]">
                              <button onClick={() => handleUpdateIssuer(issuer.id)}><Check className="w-5 h-5" /></button>
                              <button onClick={() => { setEditingIssuerId(null); setEditingIssuerData(null); }} className="text-[#444]"><X className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {issuer.is_default && <span className="w-2 h-2 rounded-full bg-[#C9A962]" title="Predeterminado" />}
                              <span className="font-primary text-xs text-[#FAF8F5]">{issuer.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-primary text-xs text-[#888]">{issuer.nif || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              {issuer.street_name && (
                                <div className="flex items-center gap-1 text-xs text-[#FAF8F5]">
                                  <MapPin className="w-3 h-3 text-[#C9A962]" />
                                  <span>
                                    {issuer.street_type} {issuer.street_name} {issuer.street_number}
                                    {issuer.floor_door ? `, ${issuer.floor_door}` : ''}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-[10px] text-[#666] ml-4">
                                <span>{issuer.zip} {issuer.city} {issuer.province ? `(${issuer.province})` : ''}</span>
                              </div>
                              {/* Fallback to old address struct if available & no detailed set */}
                              {!issuer.street_name && issuer.address && (
                                <div className="flex items-center gap-1 text-xs text-[#666] ml-4">
                                  <span>{issuer.address}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              {issuer.email && (
                                <div className="flex items-center gap-1 text-[10px] text-[#888]">
                                  <Mail className="w-3 h-3" />
                                  <span>{issuer.email}</span>
                                </div>
                              )}
                              {issuer.phone && (
                                <div className="flex items-center gap-1 text-[10px] text-[#888]">
                                  <Phone className="w-3 h-3" />
                                  <span>{issuer.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setEditingIssuerId(issuer.id); setEditingIssuerData(issuer); }} className="text-[#444] hover:text-[#FAF8F5] transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteIssuer(issuer.id)} className="text-[#444] hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
