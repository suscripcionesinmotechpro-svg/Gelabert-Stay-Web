// ═══════════════════════════════════════════════
//  Captaciones Module Types — Gelabert Homes
// ═══════════════════════════════════════════════

export type CaptacionStatus =
  | 'pendiente_contacto'
  | 'seguimiento'
  | 'visita_planificada'
  | 'captado'
  | 'contrato_en_proceso'
  | 'rechazado';

export type CaptacionPriority = 'alta' | 'media' | 'baja';
export type CaptacionOperation = 'venta' | 'alquiler' | 'traspaso';

export interface Captacion {
  id: string;
  created_at: string;
  updated_at: string;

  // Owner Details
  owner_name: string;
  owner_email: string | null;
  owner_phone: string | null;

  // Property Details
  property_address: string;
  property_features: string | null;
  property_ad_url: string | null;
  operation: CaptacionOperation | null;
  estimated_price: number | null;

  // Listing/Acquisition details
  status: CaptacionStatus;
  priority: CaptacionPriority;
  contact_date: string; // YYYY-MM-DD

  // Management
  agent_id: string | null;
  notes: string | null;
  visit_date: string | null;       // ISO datetime for scheduled visit
  follow_up_date: string | null;   // YYYY-MM-DD for scheduled follow-up call
}

export type CaptacionInsert = Omit<Captacion, 'id' | 'created_at' | 'updated_at'>;

// ─── Activity History ───────────────────────────────────────
export type CaptacionHistoryAction =
  | 'created'
  | 'status_changed'
  | 'note_added'
  | 'follow_up_set'
  | 'visit_scheduled'
  | 'agent_assigned'
  | 'field_updated';

export interface CaptacionHistory {
  id: string;
  captacion_id: string;
  agent_name: string | null;
  action: CaptacionHistoryAction;
  old_value: string | null;
  new_value: string | null;
  description: string;
  created_at: string;
}

// ─── Status Labels & Colors ─────────────────────────────────
export const CAPTACION_STATUS_LABELS: Record<CaptacionStatus, string> = {
  pendiente_contacto: 'Pendiente de Contacto',
  seguimiento: 'Seguimiento',
  visita_planificada: 'Visita Planificada',
  captado: 'Captado',
  contrato_en_proceso: 'Contrato en Proceso',
  rechazado: 'Rechazado',
};

export const CAPTACION_STATUS_COLORS: Record<CaptacionStatus, string> = {
  pendiente_contacto: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  seguimiento:        'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  visita_planificada: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  captado:            'text-[#C9A962] bg-[#C9A962]/10 border-[#C9A962]/30',
  contrato_en_proceso:'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  rechazado:          'text-red-400 bg-red-400/10 border-red-400/30',
};

export const CAPTACION_PRIORITY_LABELS: Record<CaptacionPriority, string> = {
  alta:  '🔴 Alta',
  media: '🟡 Media',
  baja:  '🟢 Baja',
};

export const CAPTACION_OPERATION_LABELS: Record<CaptacionOperation, string> = {
  venta:    'Venta',
  alquiler: 'Alquiler',
  traspaso: 'Traspaso',
};

// ─── Pipeline order for Kanban ──────────────────────────────
export const CAPTACION_STATUS_ORDER: CaptacionStatus[] = [
  'pendiente_contacto',
  'seguimiento',
  'visita_planificada',
  'captado',
  'contrato_en_proceso',
  'rechazado',
];
