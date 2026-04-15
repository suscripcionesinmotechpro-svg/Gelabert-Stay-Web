export type InvoiceStatus = 'pendiente' | 'pagado' | 'vencido';
export type PaymentMethod = 'transferencia' | 'bizum' | 'paypal' | 'efectivo' | '';

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  created_at: string;
  user_id: string;

  series: string;
  invoice_number: string;
  
  // Client
  client_name: string;
  client_nif: string | null;
  client_street_type: string | null;
  client_street_name: string | null;
  client_street_number: string | null;
  client_floor_door: string | null;
  client_address: string | null; // Keep for retro-compatibility / old data
  client_zip: string | null;
  client_city: string | null;
  client_province: string | null;
  client_email: string | null;
  client_phone: string | null;

  concept: string; // Keep concept for retro-compatibility / quick mode
  items: InvoiceItem[];

  amount: number; // Base imponible
  tax_rate: number; // % IVA
  irpf_rate: number; // % IRPF
  irpf_amount: number; // IRPF amount
  total_amount: number; // Base + IVA - IRPF

  invoice_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  
  payment_method: PaymentMethod;
  payment_details: string | null;

  file_url: string | null;
  notes: string | null;
  type: 'income' | 'expense';
  issuer_id: string | null;
  fixed_expense_id: string | null;
  variable_category_id: string | null;
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'user_id' | 'total_amount' | 'irpf_amount'>;

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

export interface InvoiceSettings {
  id: string;
  user_id: string;
  issuer_name: string | null;
  issuer_nif: string | null;
  issuer_address: string | null;
  issuer_zip: string | null;
  issuer_city: string | null;
  issuer_email: string | null;
  issuer_phone: string | null;
  default_iban: string | null;
  default_bizum: string | null;
  default_paypal: string | null;
  logo_url: string | null;
}

// Summary for dashboard stats
export interface InvoiceSummary {
  totalPeriod: number;
  taxPeriod: number;
  irpfPeriod: number;
  pendingCount: number;
  pendingAmount: number;
  income: number;
  variableExpenses: number;
  fixedExpenses: number;
  totalExpenses: number;
  byMonth: { month: number; year: number; total: number; expenses: number; income: number }[];
}

export interface FixedExpense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string | null;
  day_of_month: number | null;
  day_of_month_end: number | null;
  frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  is_variable: boolean;
  is_active: boolean;
  created_at: string;
}

export type FixedExpenseInsert = Omit<FixedExpense, 'id' | 'user_id' | 'created_at'>;

export interface InvoiceIssuer {
  id: string;
  user_id: string;
  name: string;
  nif: string | null;
  street_type: string | null;
  street_name: string | null;
  street_number: string | null;
  floor_door: string | null;
  address: string | null; // Keep for retro-compatibility
  zip: string | null;
  city: string | null;
  province: string | null;
  email: string | null;
  phone: string | null;
  is_default: boolean;
  created_at: string;
}

export type InvoiceIssuerInsert = Omit<InvoiceIssuer, 'id' | 'user_id' | 'created_at'>;

export interface VariableCategory {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  default_amount: number;
  is_active: boolean;
  created_at: string;
}

export type VariableCategoryInsert = Omit<VariableCategory, 'id' | 'user_id' | 'created_at'>;
