export type InvoiceStatus = 'pendiente' | 'pagado' | 'vencido';

export interface Invoice {
  id: string;
  created_at: string;
  invoice_number: string;
  client_name: string;
  concept: string;
  amount: number; // Base imponible
  tax_rate: number; // % IVA
  total_amount: number; // amount + taxes
  invoice_date: string; // ISO date YYYY-MM-DD
  due_date: string | null;
  status: InvoiceStatus;
  file_url: string | null; // PDF URL in Supabase Storage
  notes: string | null;
  user_id: string;
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'user_id' | 'total_amount'>;

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  vencido: 'Vencido',
};

export const STATUS_COLORS: Record<InvoiceStatus, string> = {
  pendiente: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  pagado: 'text-green-400 bg-green-400/10 border-green-400/30',
  vencido: 'text-red-400 bg-red-400/10 border-red-400/30',
};

// Summary for dashboard stats
export interface InvoiceSummary {
  totalYear: number;
  totalMonth: number;
  pendingCount: number;
  pendingAmount: number;
  taxYear: number;
  byMonth: { month: number; year: number; total: number }[];
}
