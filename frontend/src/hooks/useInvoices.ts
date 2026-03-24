import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Invoice, InvoiceInsert, InvoiceSummary } from '../types/invoice';

// ─── LIST & FILTER ──────────────────────────────────────────────────
export const useInvoices = (filters?: { year?: number; month?: number; status?: string }) => {
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

      if (filters?.year) {
        query = query
          .gte('invoice_date', `${filters.year}-01-01`)
          .lte('invoice_date', `${filters.year}-12-31`);
      }
      if (filters?.month && filters?.year) {
        const m = String(filters.month).padStart(2, '0');
        const y = filters.year;
        query = query
          .gte('invoice_date', `${y}-${m}-01`)
          .lte('invoice_date', `${y}-${m}-31`);
      }
      if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setInvoices(data as Invoice[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [filters?.year, filters?.month, filters?.status]);

  return { invoices, loading, error, refetch: fetchInvoices };
};

// ─── SUMMARY / STATS ────────────────────────────────────────────────
export const useInvoiceSummary = (year: number) => {
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalYear: 0, totalMonth: 0, pendingCount: 0, pendingAmount: 0, taxYear: 0, byMonth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .gte('invoice_date', `${year}-01-01`)
        .lte('invoice_date', `${year}-12-31`);

      if (!data) { setLoading(false); return; }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;

      const totalYear = data.reduce((s, i) => s + (i.total_amount || 0), 0);
      const taxYear = data.reduce((s, i) => s + ((i.total_amount || 0) - (i.amount || 0)), 0);
      const thisMonthData = data.filter(i => {
        const m = parseInt(i.invoice_date.split('-')[1]);
        return m === currentMonth;
      });
      const totalMonth = thisMonthData.reduce((s, i) => s + (i.total_amount || 0), 0);
      const pending = data.filter(i => i.status === 'pendiente');
      const pendingAmount = pending.reduce((s, i) => s + (i.total_amount || 0), 0);

      // Group by month
      const byMonthMap: Record<number, number> = {};
      data.forEach(i => {
        const m = parseInt(i.invoice_date.split('-')[1]);
        byMonthMap[m] = (byMonthMap[m] || 0) + (i.total_amount || 0);
      });
      const byMonth = Object.entries(byMonthMap).map(([m, total]) => ({
        month: parseInt(m), year, total
      })).sort((a, b) => a.month - b.month);

      setSummary({ totalYear, totalMonth, pendingCount: pending.length, pendingAmount, taxYear, byMonth });
      setLoading(false);
    };
    fetchSummary();
  }, [year]);

  return { summary, loading };
};

// ─── CREATE / UPDATE / DELETE ────────────────────────────────────────
export const useInvoiceMutations = () => {
  const createInvoice = async (data: InvoiceInsert) => {
    const totalAmount = data.amount * (1 + data.tax_rate / 100);
    const { error } = await supabase.from('invoices').insert([{ ...data, total_amount: totalAmount }]);
    if (error) throw error;
  };

  const updateInvoice = async (id: string, data: Partial<InvoiceInsert>) => {
    const updates: any = { ...data };
    if (data.amount !== undefined && data.tax_rate !== undefined) {
      updates.total_amount = data.amount * (1 + data.tax_rate / 100);
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
