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
    totalPeriod: 0, taxPeriod: 0, irpfPeriod: 0, pendingCount: 0, pendingAmount: 0, income: 0, expenses: 0, byMonth: []
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

    const incomes = data.filter(i => i.type === 'income' || !i.type);
    const expenses = data.filter(i => i.type === 'expense');

    // Fetch Fixed Expenses
    const { data: fixedData } = await supabase
      .from('accounting_fixed_expenses')
      .select('amount')
      .eq('is_active', true);
    
    const monthlyFixedSum = (fixedData || []).reduce((s, f) => s + (Number(f.amount) || 0), 0);
    
    // Simple month calculation between dates
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    const totalFixedForPeriod = monthlyFixedSum * Math.max(1, monthDiff);

    const invoiceIncome = incomes.reduce((s, i) => s + (i.total_amount || 0), 0);
    const invoiceExpenses = expenses.reduce((s, i) => s + (i.total_amount || 0), 0);

    const totalPeriod = invoiceIncome - invoiceExpenses - totalFixedForPeriod;
    const taxPeriod = incomes.reduce((s, i) => s + ((i.total_amount || 0) + (i.irpf_amount || 0) - (i.amount || 0)), 0);
    const irpfPeriod = incomes.reduce((s, i) => s + (i.irpf_amount || 0), 0);
    
    const pending = incomes.filter(i => i.status === 'pendiente');
    const pendingAmount = pending.reduce((s, i) => s + (i.total_amount || 0), 0);

    // Group by month
    const byMonthMap: Record<number, { income: number; expenses: number }> = {};
    
    // Initialize all 12 months for the selected year
    for (let m = 1; m <= 12; m++) {
      byMonthMap[m] = { income: 0, expenses: 0 };
    }

    data.forEach(i => {
      const m = parseInt(i.invoice_date.split('-')[1]);
      if (byMonthMap[m]) {
        const amount = i.total_amount || 0;
        if (i.type === 'expense') {
          byMonthMap[m].expenses += amount;
        } else {
          byMonthMap[m].income += amount;
        }
      }
    });

    const firstYear = parseInt(filters.startDate.split('-')[0]) || new Date().getFullYear();
    const byMonth = Object.entries(byMonthMap).map(([m, vals]) => ({
      month: parseInt(m), 
      year: firstYear, 
      total: vals.income - vals.expenses - monthlyFixedSum, 
      income: vals.income,
      expenses: vals.expenses + monthlyFixedSum
    })).sort((a, b) => a.month - b.month);

    setSummary({ 
      totalPeriod, 
      pendingCount: pending.length, 
      pendingAmount, 
      taxPeriod, 
      irpfPeriod, 
      income: invoiceIncome,
      expenses: invoiceExpenses + totalFixedForPeriod,
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
