import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoiceSummary, useInvoices, useInvoiceMutations } from '../../hooks/useInvoices';
import { useAccounting } from '../../hooks/useAccounting';
import { STATUS_COLORS, STATUS_LABELS, type InvoiceStatus } from '../../types/invoice';
import { 
  PlusCircle, Download, TrendingUp, 
  ChevronDown, Trash2, Edit, FileText, ArrowUpRight, 
  ArrowDownRight, Calculator, Check, X, Building2, Mail, Phone, MapPin
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
  const [periodType, setPeriodType] = useState<PeriodType>('year');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  const [isAddingFixed, setIsAddingFixed] = useState(false);
  const [newFixedExpense, setNewFixedExpense] = useState({
    name: '',
    amount: 0,
    category: 'General',
    day_of_month: 1,
    is_active: true
  });

  const { fixedExpenses, addFixedExpense, updateFixedExpense, deleteFixedExpense } = useAccounting();

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
  
  const { invoices, loading, refetch } = useInvoices({
    startDate: dateRange.start,
    endDate: dateRange.end,
    status: selectedStatus,
  });

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'invoices') return inv.type === 'income' || !inv.type;
    if (activeTab === 'variable_expenses') return inv.type === 'expense';
    return true;
  });

  const { updateStatus, deleteInvoice } = useInvoiceMutations();

  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

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

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus(id, status);
    refetch();
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
    setNewFixedExpense({ name: '', amount: 0, category: 'General', day_of_month: 1, is_active: true });
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
        {[
          {
            label: `Balance Periodo`,
            value: loadingSummary ? '—' : formatCurrency(summary.totalPeriod),
            subValue: `En ${dateRange.label} ${selectedYear}`,
            icon: <Calculator className="w-5 h-5" />,
            color: summary.totalPeriod >= 0 ? 'text-[#C9A962] border-[#C9A962]/50 bg-[#C9A962]/5' : 'text-red-400 border-red-400/30 bg-red-400/5',
          },
          {
            label: `Ingresos`,
            value: loadingSummary ? '—' : formatCurrency(summary.income || 0),
            icon: <ArrowUpRight className="w-5 h-5" />,
            color: 'text-green-400',
          },
          {
            label: 'Total Gastos',
            value: loadingSummary ? '—' : formatCurrency(summary.totalExpenses || 0),
            icon: <ArrowDownRight className="w-5 h-5" />,
            color: 'text-red-400',
          },
          {
            label: 'IVA Acumulado',
            value: loadingSummary ? '—' : formatCurrency(summary.taxPeriod),
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-blue-400',
          },
          {
            label: 'IRPF Acumulado',
            value: loadingSummary ? '—' : formatCurrency(summary.irpfPeriod),
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-purple-400',
          },
        ].map((stat, i) => (
          <div key={i} className={cn(cardClass, stat.color && !stat.color.includes('bg-') ? '' : stat.color)}>
            <div className={cn("flex items-center gap-2", stat.color && !stat.color.includes('bg-') ? stat.color : "")}>
              {stat.icon}
              <span className="font-primary text-[10px] uppercase tracking-wider text-[#666666]">{stat.label}</span>
            </div>
            <p className={cn("font-secondary text-2xl leading-tight", stat.color && !stat.color.includes('bg-') ? stat.color : "")}>{stat.value}</p>
            {stat.subValue && <p className="text-[10px] text-[#555] font-primary uppercase tracking-tighter mt-1">{stat.subValue}</p>}
          </div>
        ))}
      </div>

      {activeTab === 'invoices' || activeTab === 'variable_expenses' ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center bg-[#0A0A0A] border border-[#1F1F1F] p-3">
              {availableYears.map(y => (
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
            </div>

            <Link
              to="/admin/facturas/nueva"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva Factura
            </Link>
          </div>

          <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <FileText className="w-12 h-12 text-[#333333]" />
                <p className="font-primary text-[#666666] text-sm">No hay facturas para esta sección</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1F1F1F]">
                    {['Nº Factura', 'Cliente', 'Serie', 'Fecha', 'Base', 'IVA', 'IRPF', 'Total', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-primary text-[10px] uppercase tracking-wider text-[#666666]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-[#111111] transition-colors">
                      <td className="px-4 py-3 font-primary text-[#FAF8F5] text-sm font-bold">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-primary text-[#888888] text-sm max-w-[150px] truncate">{inv.client_name}</td>
                      <td className="px-4 py-3 font-primary text-[#888888] text-sm">{inv.series || 'A'}</td>
                      <td className="px-4 py-3 font-primary text-[#888888] text-xs">
                        {new Date(inv.invoice_date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 font-primary text-[#FAF8F5] text-sm">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-4 py-3 font-primary text-[#888888] text-sm">{inv.tax_rate}%</td>
                      <td className="px-4 py-3 font-primary text-[#888888] text-sm">{inv.irpf_rate}%</td>
                      <td className="px-4 py-3 font-secondary text-[#C9A962] text-sm font-bold">
                        {formatCurrency(inv.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group">
                          <button className={cn(
                            'flex items-center gap-1 px-2 py-1 border text-[10px] font-primary uppercase font-bold rounded-sm',
                            STATUS_COLORS[inv.status as InvoiceStatus]
                          )}>
                            {STATUS_LABELS[inv.status as InvoiceStatus]}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <div className="absolute z-10 top-full left-0 mt-1 bg-[#111111] border border-[#1F1F1F] hidden group-hover:block w-32 shadow-xl shadow-black">
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <button
                                key={val}
                                onClick={() => handleStatusChange(inv.id, val)}
                                className="block w-full px-4 py-2 font-primary text-[10px] text-left hover:bg-[#1F1F1F] text-[#888888] hover:text-[#FAF8F5] uppercase font-bold tracking-widest"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {inv.file_url && (
                            <a href={inv.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-[#444] hover:text-[#C9A962] transition-colors">
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <Link to={`/admin/facturas/${inv.id}/editar`} className="p-1.5 text-[#444] hover:text-[#FAF8F5] transition-colors">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-[#444] hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
                  <th className="px-6 py-4 font-primary text-[9px] text-[#666666] uppercase tracking-[0.2em] text-center">Día Pago</th>
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
                      <input type="number" min="1" max="31" className={cn(inputClass, "w-16 mx-auto text-center")} value={newFixedExpense.day_of_month} onChange={e => setNewFixedExpense({...newFixedExpense, day_of_month: parseInt(e.target.value) || 1})} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input type="number" step="0.01" className={cn(inputClass, "w-24 ml-auto text-right")} value={newFixedExpense.amount} onChange={e => setNewFixedExpense({...newFixedExpense, amount: parseFloat(e.target.value) || 0})} />
                    </td>
                    <td className="px-6 py-4 text-center"><span className="text-[10px] font-bold text-[#C9A962] uppercase tracking-wider">Nuevo</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-[#C9A962]">
                        <button onClick={handleSaveFixedExpense}><Check className="w-5 h-5" /></button>
                        <button onClick={() => setIsAddingFixed(false)} className="text-[#444]"><X className="w-5 h-5" /></button>
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
                            <input 
                              type="number" 
                              className={cn(inputClass, "w-16 mx-auto text-center")} 
                              value={editingFixedData?.day_of_month || 1} 
                              onChange={e => setEditingFixedData({ ...editingFixedData, day_of_month: parseInt(e.target.value) || 1 })} 
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
                          <td className="px-6 py-4 font-primary text-xs text-[#888] text-center">{expense.day_of_month || '-'}</td>
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
