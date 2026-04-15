import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Invoice, InvoiceInsert, InvoiceSummary } from '../types/invoice';

export interface InvoiceFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}

// ─── LIST & FILTER ──────────────────────────────────────────────────
export const useInvoices = (filters?: InvoiceFilters) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('invoice_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('invoice_date', filters.endDate);
      }
      if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      
      // Auto-calculate missing fields for backward compatibility if needed
      const processedData = (data as any[]).map(inv => ({
        ...inv,
        irpf_rate: inv.irpf_rate || 0,
        irpf_amount: inv.irpf_amount || 0,
        items: inv.items || [],
        series: inv.series || 'A',
        type: inv.type || 'income',
      }));

      setInvoices(processedData as Invoice[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [filters?.startDate, filters?.endDate, filters?.status]);

  return { invoices, loading, error, refetch: fetchInvoices };
};

// ─── SUMMARY / STATS ────────────────────────────────────────────────
export const useInvoiceSummary = (filters: { startDate: string; endDate: string }) => {
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalPeriod: 0, 
    taxPeriod: 0, 
    irpfPeriod: 0, 
    pendingCount: 0, 
    pendingAmount: 0, 
    income: 0, 
    variableExpenses: 0,
    fixedExpenses: 0,
    totalExpenses: 0,
    byMonth: []
  });
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .gte('invoice_date', filters.startDate)
      .lte('invoice_date', filters.endDate);

    if (!data) { setLoading(false); return; }


    // Fetch Fixed Expenses
    const { data: fixedData } = await supabase
      .from('accounting_fixed_expenses')
      .select('id, amount')
      .eq('is_active', true);
    
    const activeFixed = fixedData || [];
    
    // Group by month to handle fixed expense projections vs real invoices
    const byMonthMap: Record<string, { income: number; expenses: number; projectedFixed: number }> = {};
    
    // Initialize months in range
    let curr = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    while (curr <= end) {
      const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
      byMonthMap[key] = { income: 0, expenses: 0, projectedFixed: 0 };
      curr.setMonth(curr.getMonth() + 1);
    }

    // Sort invoices into months
    data.forEach(i => {
      const key = i.invoice_date.substring(0, 7); // "YYYY-MM"
      if (byMonthMap[key]) {
        if (i.type === 'expense') {
          byMonthMap[key].expenses += (i.total_amount || 0);
        } else {
          byMonthMap[key].income += (i.total_amount || 0);
        }
      }
    });

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startMonthKey = filters.startDate.substring(0, 7);
    const isFuturePeriod = startMonthKey > currentMonthKey;

    // Calculate adjusted fixed expenses per month
    // If a month has an invoice linked to Fixed X, we don't add Fixed X to projectedFixed
    Object.keys(byMonthMap).forEach(monthKey => {
      const [_y, _mStr] = monthKey.split('-');
      const monthIndex = parseInt(_mStr);
      
      const invoicesThisMonth = data.filter(i => i.invoice_date.startsWith(monthKey) && i.type === 'expense');
      const linkedFixedIds = invoicesThisMonth.map(i => i.fixed_expense_id).filter(Boolean);
      
      let projected = 0;
      // Sólo aplicar gastos fijos a proyecciones a partir de 2026
      if (monthKey >= '2026-01') {
        projected = activeFixed
          .filter(f => !linkedFixedIds.includes(f.id))
          .filter(f => {
            const freq = f.frequency || 'monthly';
            if (freq === 'monthly') return true;
            if (freq === 'quarterly') return monthIndex % 3 === 0;
            if (freq === 'semiannual') return monthIndex % 6 === 0;
            if (freq === 'annual') return monthIndex === 12;
            return true;
          })
          .reduce((s, f) => s + (Number(f.amount) || 0), 0);
      }
      
      byMonthMap[monthKey].projectedFixed = projected;
    });

    const invoiceIncome = data.filter(i => i.type === 'income' || !i.type).reduce((s, i) => s + (i.total_amount || 0), 0);
    const invoiceVariableExpenses = data.filter(i => i.type === 'expense').reduce((s, i) => s + (i.total_amount || 0), 0);
    
    // Only sum projected fixed expenses for months that have already started/passed
    // unless the entire period is in the future.
    const totalProjectedFixed = Object.entries(byMonthMap).reduce((s, [monthKey, m]) => {
      // Comparison: monthKey (YYYY-MM) <= currentMonthKey (YYYY-MM)
      if (isFuturePeriod || monthKey <= currentMonthKey) {
        return s + m.projectedFixed;
      }
      return s;
    }, 0);

    const totalExpenses = invoiceVariableExpenses + totalProjectedFixed;

    const netBalance = invoiceIncome - totalExpenses;
    const taxPeriod = data.reduce((s, i) => s + ((i.total_amount || 0) + (i.irpf_amount || 0) - (i.amount || 0)), 0);
    const irpfPeriod = data.reduce((s, i) => s + (i.irpf_amount || 0), 0);
    
    const pending = data.filter(i => (i.type === 'income' || !i.type) && i.status === 'pendiente');
    const pendingAmount = pending.reduce((s, i) => s + (i.total_amount || 0), 0);

    const byMonth = Object.entries(byMonthMap).map(([key, vals]) => {
      const [year, month] = key.split('-').map(Number);
      // For chart: only include projections for past/current months
      const isPastOrCurrent = isFuturePeriod || key <= currentMonthKey;
      const effectiveFixed = isPastOrCurrent ? vals.projectedFixed : 0;
      
      return {
        month, 
        year, 
        total: vals.income - (vals.expenses + effectiveFixed), 
        income: vals.income,
        expenses: vals.expenses + effectiveFixed
      };
    }).sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));

    setSummary({ 
      totalPeriod: netBalance, 
      pendingCount: pending.length, 
      pendingAmount, 
      taxPeriod, 
      irpfPeriod, 
      income: invoiceIncome,
      variableExpenses: invoiceVariableExpenses,
      fixedExpenses: totalProjectedFixed,
      totalExpenses,
      byMonth 
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
  }, [filters.startDate, filters.endDate]);

  return { summary, loading, refetch: fetchSummary };
};

// ─── CREATE / UPDATE / DELETE ────────────────────────────────────────
export const useInvoiceMutations = () => {
  const calculateTotals = (data: Partial<InvoiceInsert>) => {
    const base = Number(data.amount) || 0;
    const ivaPct = Number(data.tax_rate) || 0;
    const irpfPct = Number(data.irpf_rate) || 0;

    const ivaAmt = base * (ivaPct / 100);
    const irpfAmt = base * (irpfPct / 100);
    const total = base + ivaAmt - irpfAmt;

    return { total_amount: total, irpf_amount: irpfAmt };
  };

  const createInvoice = async (data: InvoiceInsert) => {
    const totals = calculateTotals(data);
    const { error } = await supabase.from('invoices').insert([{ ...data, ...totals }]);
    if (error) throw error;
  };

  const updateInvoice = async (id: string, data: Partial<InvoiceInsert>) => {
    const updates: any = { ...data };
    if (data.amount !== undefined) {
      const totals = calculateTotals({ ...data });
      updates.total_amount = totals.total_amount;
      updates.irpf_amount = totals.irpf_amount;
    }
    const { error } = await supabase.from('invoices').update(updates).eq('id', id);
    if (error) throw error;
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) throw error;
  };

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
  };

  return { createInvoice, updateInvoice, updateStatus, deleteInvoice };
};

// ─── FILE UPLOAD ────────────────────────────────────────────────────
export const uploadInvoicePDF = async (file: File): Promise<string> => {
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `invoices/${timestamp}_${cleanName}`;

  const { error } = await supabase.storage.from('invoice-files').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('invoice-files').getPublicUrl(path);
  return data.publicUrl;
};
