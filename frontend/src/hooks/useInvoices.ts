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
    vatIncome: 0,
    vatExpenses: 0,
    vatEstimated: 0,
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

    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*')
      .gte('invoice_date', filters.startDate)
      .lte('invoice_date', filters.endDate);

    const { data: fixedData } = await supabase
      .from('accounting_fixed_expenses')
      .select('*')
      .eq('is_active', true);

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

    const byMonthMap: Record<string, any> = {};
    let estVat = 0;
    let estIrpf = 0;
    
    const months: Date[] = [];
    let d = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    while (d <= end) {
      months.push(new Date(d));
      d.setMonth(d.getMonth() + 1);
    }

    months.forEach(m => {
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      byMonthMap[key] = { month: m.getMonth() + 1, year: m.getFullYear(), total: 0, expenses: 0, income: 0, fixedExp: 0, variableExp: 0, invoiceExp: 0 };
    });

    months.forEach((monthDate) => {
      const year = monthDate.getFullYear();
      const monthNum = monthDate.getMonth() + 1;
      const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;

      const expenseInvs = allInvoices.filter(i => {
        const d = new Date(i.invoice_date);
        return d.getFullYear() === year && (d.getMonth() + 1) === monthNum && i.type === 'expense';
      });

      const incomeInvs = allInvoices.filter(i => {
        const d = new Date(i.invoice_date);
        return d.getFullYear() === year && (d.getMonth() + 1) === monthNum && i.type === 'income';
      });

      byMonthMap[monthKey].income = incomeInvs.reduce((s, i) => s + (i.total_amount || 0), 0);

      const standaloneExpInvs = expenseInvs.filter(i => !i.fixed_expense_id && !i.variable_category_id);
      byMonthMap[monthKey].invoiceExp = standaloneExpInvs.reduce((s, i) => s + (i.total_amount || 0), 0);

      allFixed.forEach(fe => {
        const freq = fe.frequency || 'monthly';
        const appliesThisMonth =
          freq === 'monthly' ? true :
          freq === 'quarterly' ? monthNum % 3 === 1 :
          freq === 'semiannual' ? (monthNum === 1 || monthNum === 7) :
          freq === 'annual' ? monthNum === 1 :
          true;

        if (!appliesThisMonth) return;

        const linkedInvsForThisFE = expenseInvs.filter(i => i.fixed_expense_id === fe.id);
        
        if (linkedInvsForThisFE.length > 0) {
          const invAmount = linkedInvsForThisFE.reduce((s, i) => s + (i.total_amount || 0), 0);
          if (fe.is_variable) {
            byMonthMap[monthKey].variableExp += invAmount;
          } else {
            byMonthMap[monthKey].fixedExp += invAmount;
          }
        } else {
          const feAmount = Number(fe.amount) || 0;
          const feTaxRate = Number(fe.tax_rate) || 0;
          const feIrpfRate = Number(fe.irpf_rate) || 0;

          const multiplier = (1 + (feTaxRate / 100) - (feIrpfRate / 100));
          const estBase = multiplier > 0 ? feAmount / multiplier : feAmount;
          const estVatAmt = estBase * (feTaxRate / 100);
          const estIrpfAmt = estBase * (feIrpfRate / 100);

          estVat += estVatAmt;
          estIrpf += estIrpfAmt;

          if (fe.is_variable) {
            const monthlyEntry = allMonthly.find(
              m => m.fixed_expense_id === fe.id && m.year === year && m.month === monthNum
            );
            byMonthMap[monthKey].variableExp += monthlyEntry
              ? (monthlyEntry.actual_amount || 0)
              : feAmount;
          } else {
            byMonthMap[monthKey].fixedExp += feAmount;
          }
        }
      });
      
      const categoryInvs = expenseInvs.filter(i => i.variable_category_id);
      byMonthMap[monthKey].variableExp += categoryInvs.reduce((s, i) => s + (i.total_amount || 0), 0);
    });

    const totalIncome = Object.values(byMonthMap).reduce((s, m) => s + m.income, 0);
    const totalFixed = Object.values(byMonthMap).reduce((s, m) => s + m.fixedExp, 0);
    const totalVariable = Object.values(byMonthMap).reduce((s, m) => s + m.variableExp, 0);
    const totalInvoiceExp = Object.values(byMonthMap).reduce((s, m) => s + m.invoiceExp, 0);
    const totalExpenses = totalFixed + totalVariable + totalInvoiceExp;

    let vatIncome = 0;
    let vatExpenses = 0;

    allInvoices.forEach(i => {
      const netBase = (Number(i.amount) || 0) - (Number(i.discount_amount) || 0);
      const vat = (Number(i.total_amount) || 0) + (Number(i.irpf_amount) || 0) - netBase;
      
      if (i.type === 'expense') {
        vatExpenses += vat;
      } else {
        vatIncome += vat;
      }
    });

    const taxPeriod = vatIncome - vatExpenses - estVat;

    const realIrpfBalance = allInvoices.reduce((s, i) => {
      const irpf = i.irpf_amount || 0;
      return s + (i.type === 'expense' ? irpf : -irpf);
    }, 0);

    const irpfPeriod = realIrpfBalance + estIrpf;
    
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
      vatIncome,
      vatExpenses,
      vatEstimated: estVat,
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
    const originalBase = Number(data.amount) || 0;
    const discount = Number(data.discount_amount) || 0;
    const base = originalBase - discount;
    const ivaPct = Number(data.tax_rate) || 0;
    const irpfPct = Number(data.irpf_rate) || 0;

    const ivaAmt = base * (ivaPct / 100);
    const irpfAmt = base * (irpfPct / 100);
    const total = base + ivaAmt - irpfAmt;

    return { total_amount: total, irpf_amount: irpfAmt };
  };

  type NullableUUIDField =
    | 'issuer_id'
    | 'fixed_expense_id'
    | 'variable_category_id'
    | 'property_id'
    | 'room_id'
    | 'tenant_id';

  const sanitizeInvoiceData = (data: Partial<InvoiceInsert>) => {
    const sanitized = { ...data };
    
    // UUID fields that should be null instead of empty string
    const uuidFields: NullableUUIDField[] = [
      'issuer_id',
      'fixed_expense_id',
      'variable_category_id',
      'property_id',
      'room_id',
      'tenant_id'
    ];

    uuidFields.forEach(field => {
      if ((sanitized as Record<NullableUUIDField, string | null | undefined>)[field] === '') {
        (sanitized as Record<NullableUUIDField, string | null | undefined>)[field] = null;
      }
    });

    return sanitized;
  };

  const createInvoice = async (data: InvoiceInsert) => {
    const sanitizedData = sanitizeInvoiceData(data);
    const totals = calculateTotals(sanitizedData);
    const { error } = await supabase.from('invoices').insert([{ ...sanitizedData, ...totals }]);
    if (error) throw error;
  };

  const updateInvoice = async (id: string, data: Partial<InvoiceInsert>) => {
    const sanitizedData = sanitizeInvoiceData(data);
    const updates: any = { ...sanitizedData };
    
    if (data.amount !== undefined || data.discount_amount !== undefined || data.tax_rate !== undefined || data.irpf_rate !== undefined) {
      const totals = calculateTotals({ ...sanitizedData });
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
