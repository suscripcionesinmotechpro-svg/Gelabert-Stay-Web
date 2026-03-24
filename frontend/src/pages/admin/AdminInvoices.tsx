import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoiceSummary, useInvoices, useInvoiceMutations } from '../../hooks/useInvoices';
import { STATUS_COLORS, STATUS_LABELS, type InvoiceStatus } from '../../types/invoice';
import { PlusCircle, Download, TrendingUp, Clock, AlertCircle, Euro, ChevronDown, Trash2, Edit, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const AdminInvoices = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { summary, loading: loadingSummary } = useInvoiceSummary(selectedYear);
  const { invoices, loading, refetch } = useInvoices({
    year: selectedYear,
    month: selectedMonth,
    status: selectedStatus,
  });
  const { updateStatus, deleteInvoice } = useInvoiceMutations();

  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta factura? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      await deleteInvoice(id);
      refetch();
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus(id, status);
    refetch();
  };

  // Bar chart max
  const maxBarValue = Math.max(...summary.byMonth.map(m => m.total), 1);

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">Facturación</h1>
          <p className="font-primary text-[#666666] text-sm mt-1">Control de ingresos y facturas</p>
        </div>
        <Link
          to="/admin/facturas/nueva"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva Factura
        </Link>
      </div>

      {/* Year selector */}
      <div className="flex gap-2">
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: `Total ${selectedYear}`,
            value: loadingSummary ? '—' : formatCurrency(summary.totalYear),
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-[#C9A962]',
          },
          {
            label: 'Este mes',
            value: loadingSummary ? '—' : formatCurrency(summary.totalMonth),
            icon: <Euro className="w-5 h-5" />,
            color: 'text-green-400',
          },
          {
            label: 'IVA acumulado',
            value: loadingSummary ? '—' : formatCurrency(summary.taxYear),
            icon: <FileText className="w-5 h-5" />,
            color: 'text-blue-400',
          },
          {
            label: 'Pendientes',
            value: loadingSummary ? '—' : `${summary.pendingCount} (${formatCurrency(summary.pendingAmount)})`,
            icon: summary.pendingCount > 0 ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />,
            color: summary.pendingCount > 0 ? 'text-yellow-400' : 'text-[#888888]',
          },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-col gap-2">
            <div className={`flex items-center gap-2 ${stat.color}`}>
              {stat.icon}
              <span className="font-primary text-[10px] uppercase tracking-wider text-[#666666]">{stat.label}</span>
            </div>
            <p className={`font-secondary text-2xl leading-tight ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Bar Chart */}
      {summary.byMonth.length > 0 && (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6">
          <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider mb-6">
            Ingresos por Mes — {selectedYear}
          </h2>
          <div className="flex items-end gap-2 h-32">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
              const entry = summary.byMonth.find(b => b.month === m);
              const val = entry?.total || 0;
              const heightPct = (val / maxBarValue) * 100;
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
                    <div
                      className="w-full bg-[#C9A962]/20 hover:bg-[#C9A962]/40 transition-colors rounded-t-sm relative group-hover:bg-[#C9A962]/50"
                      style={{ height: `${Math.max(heightPct, val > 0 ? 4 : 0)}%` }}
                    >
                      {val > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-primary text-[9px] text-[#C9A962] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatCurrency(val)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-primary text-[10px] text-[#666666]">{MONTHS[m - 1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={selectedMonth ?? ''}
          onChange={e => setSelectedMonth(e.target.value ? parseInt(e.target.value) : undefined)}
          className="h-9 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
        >
          <option value="">Todos los meses</option>
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="h-9 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
        >
          <option value="todos">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <span className="font-primary text-[#666666] text-xs ml-auto">
          {invoices.length} factura{invoices.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <FileText className="w-12 h-12 text-[#333333]" />
            <p className="font-primary text-[#666666] text-sm">No hay facturas para los filtros seleccionados</p>
            <Link to="/admin/facturas/nueva" className="font-primary text-[#C9A962] text-sm hover:underline">
              + Crear primera factura
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F1F1F]">
                {['Nº Factura', 'Cliente', 'Concepto', 'Fecha', 'Base', 'IVA', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-primary text-[10px] uppercase tracking-wider text-[#666666]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-[#111111] transition-colors">
                  <td className="px-4 py-3 font-primary text-[#FAF8F5] text-sm font-bold">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-primary text-[#888888] text-sm max-w-[120px] truncate">{inv.client_name}</td>
                  <td className="px-4 py-3 font-primary text-[#888888] text-sm max-w-[150px] truncate">{inv.concept}</td>
                  <td className="px-4 py-3 font-primary text-[#888888] text-xs whitespace-nowrap">
                    {new Date(inv.invoice_date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 font-primary text-[#FAF8F5] text-sm whitespace-nowrap">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-4 py-3 font-primary text-[#888888] text-sm">{inv.tax_rate}%</td>
                  <td className="px-4 py-3 font-secondary text-[#C9A962] text-sm font-bold whitespace-nowrap">
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
                      <div className="absolute z-10 top-full left-0 mt-1 bg-[#111111] border border-[#1F1F1F] hidden group-hover:block">
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => handleStatusChange(inv.id, val)}
                            className="block w-full px-4 py-2 font-primary text-xs text-left hover:bg-[#1F1F1F] text-[#888888] hover:text-[#FAF8F5]"
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
                        <a
                          href={inv.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Descargar PDF"
                          className="p-1.5 text-[#888888] hover:text-[#C9A962] transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        to={`/admin/facturas/${inv.id}/editar`}
                        title="Editar"
                        className="p-1.5 text-[#888888] hover:text-[#FAF8F5] transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        disabled={deletingId === inv.id}
                        title="Eliminar"
                        className="p-1.5 text-[#888888] hover:text-red-400 transition-colors disabled:opacity-40"
                      >
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
  );
};
