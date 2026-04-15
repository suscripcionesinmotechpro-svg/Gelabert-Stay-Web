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
    fixedExpenses: 0,
    variableExpenses: 0,
    invoiceExpenses: 0,
    totalExpenses: 0,
    byMonth: []
  });
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);

    // 1. Fetch all invoices in period
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .gte('invoice_date', filters.startDate)
      .lte('invoice_date', filters.endDate);

    // 2. Fetch all active fixed expenses
    const { data: fixedData } = await supabase
      .from('accounting_fixed_expenses')
      .select('*')
      .eq('is_active', true);

    // 3. Fetch variable monthly entries for the entire period
    const startYear = parseInt(filters.startDate.substring(0, 4));
    const endYear = parseInt(filters.endDate.substring(0, 4));
    const { data: monthlyData } = await supabase
      .from('accounting_variable_monthly')
      .select('*')
      .gte('year', startYear)
      .lte('year', endYear);

    if (!invoiceData) { setLoading(false); return; }

    const allInvoices = invoiceData as any[];
    const allFixed = fixedData || [];
    const allMonthly = monthlyData || [];

    // Build month range
    const byMonthMap: Record<string, { income: number; fixedExp: number; variableExp: number; invoiceExp: number }> = {};
    let curr = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    while (curr <= endDate) {
      const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
      byMonthMap[key] = { income: 0, fixedExp: 0, variableExp: 0, invoiceExp: 0 };
      curr.setMonth(curr.getMonth() + 1);
    }

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Process each month
    Object.keys(byMonthMap).forEach(monthKey => {
      // Only count past or current months (not future projections in KPIs)
      if (monthKey > currentMonthKey) return;

      const [yStr, mStr] = monthKey.split('-');
      const year = parseInt(yStr);
      const monthNum = parseInt(mStr);

      // Invoices this month
      const invThisMonth = allInvoices.filter(i => i.invoice_date?.startsWith(monthKey));
      const incomeInvs = invThisMonth.filter(i => i.type === 'income' || !i.type);
      const expenseInvs = invThisMonth.filter(i => i.type === 'expense');

      // Income
      byMonthMap[monthKey].income = incomeInvs.reduce((s, i) => s + (i.total_amount || 0), 0);

      // IDs of fixed expenses that have a linked invoice this month
      const linkedFixedIds = new Set(
        expenseInvs.map(i => i.fixed_expense_id).filter(Boolean)
      );

      // Standalone expense invoices (no linked fixed expense)
      const standaloneExpInvs = expenseInvs.filter(i => !i.fixed_expense_id);
      byMonthMap[monthKey].invoiceExp = standaloneExpInvs.reduce((s, i) => s + (i.total_amount || 0), 0);

      // Process each fixed expense
      allFixed.forEach(fe => {
        const freq = fe.frequency || 'monthly';
        const appliesThisMonth =
          freq === 'monthly' ? true :
          freq === 'quarterly' ? monthNum % 3 === 1 : // Jan, Apr, Jul, Oct
          freq === 'semiannual' ? (monthNum === 1 || monthNum === 7) :
          freq === 'annual' ? monthNum === 1 :
          true;

        if (!appliesThisMonth) return;
        // Skip months before 2026 to avoid retroactive accounting
        if (monthKey < '2026-01') return;

        if (linkedFixedIds.has(fe.id)) {
          // This expense has a real invoice → use invoice amount, not the fixed amount
          const linkedInv = expenseInvs.find(i => i.fixed_expense_id === fe.id);
          const invAmount = linkedInv ? (linkedInv.total_amount || 0) : 0;
          if (fe.is_variable) {
            byMonthMap[monthKey].variableExp += invAmount;
          } else {
            byMonthMap[monthKey].fixedExp += invAmount;
          }
        } else if (fe.is_variable) {
          // Variable expense without invoice → check monthly entry
          const monthlyEntry = allMonthly.find(
            m => m.fixed_expense_id === fe.id && m.year === year && m.month === monthNum
          );
          byMonthMap[monthKey].variableExp += monthlyEntry
            ? (monthlyEntry.actual_amount || 0)
            : (Number(fe.amount) || 0); // fallback to estimate
        } else {
          // Fixed expense without invoice → use fixed amount
          byMonthMap[monthKey].fixedExp += Number(fe.amount) || 0;
        }
      });
    });

    // Aggregate totals
    const totalIncome = Object.values(byMonthMap).reduce((s, m) => s + m.income, 0);
    const totalFixed = Object.values(byMonthMap).reduce((s, m) => s + m.fixedExp, 0);
    const totalVariable = Object.values(byMonthMap).reduce((s, m) => s + m.variableExp, 0);
    const totalInvoiceExp = Object.values(byMonthMap).reduce((s, m) => s + m.invoiceExp, 0);
    const totalExpenses = totalFixed + totalVariable + totalInvoiceExp;

    const taxPeriod = allInvoices.reduce((s, i) => s + ((i.total_amount || 0) + (i.irpf_amount || 0) - (i.amount || 0)), 0);
    const irpfPeriod = allInvoices.reduce((s, i) => s + (i.irpf_amount || 0), 0);
    
    const pending = allInvoices.filter(i => (i.type === 'income' || !i.type) && i.status === 'pendiente');
    const pendingAmount = pending.reduce((s, i) => s + (i.total_amount || 0), 0);

    const byMonth = Object.entries(byMonthMap).map(([key, vals]) => {
      const [year, month] = key.split('-').map(Number);
      const totalMonthExp = vals.fixedExp + vals.variableExp + vals.invoiceExp;
      return {
        month,
        year,
        total: vals.income - totalMonthExp,
        income: vals.income,
        expenses: totalMonthExp
      };
    }).sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));

    setSummary({
      totalPeriod: totalIncome - totalExpenses,
      pendingCount: pending.length,
      pendingAmount,
      taxPeriod,
      irpfPeriod,
      income: totalIncome,
      fixedExpenses: totalFixed,
      variableExpenses: totalVariable,
      invoiceExpenses: totalInvoiceExp,
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
