// ═══════════════════════════════════════════════
//  Captaciones Module Types — Gelabert Homes
// ═══════════════════════════════════════════════

export type CaptacionStatus = 'captado' | 'visita_planificada' | 'rechazado' | 'seguimiento' | 'pendiente_contacto';

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
  
  // Listing/Acquisition details
  status: CaptacionStatus;
  contact_date: string; // YYYY-MM-DD
  
  // Management
  agent_id: string | null;
  notes: string | null;
  visit_date: string | null;
}

export type CaptacionInsert = Omit<Captacion, 'id' | 'created_at' | 'updated_at'>;

export const CAPTACION_STATUS_LABELS: Record<CaptacionStatus, string> = {
  pendiente_contacto: 'Pendiente de Contacto',
  seguimiento: 'Seguimiento',
  visita_planificada: 'Visita Planificada',
  captado: 'Captado',
  rechazado: 'Rechazado',
};

export const CAPTACION_STATUS_COLORS: Record<CaptacionStatus, string> = {
  pendiente_contacto: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  seguimiento: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  visita_planificada: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  captado: 'text-[#C9A962] bg-[#C9A962]/10 border-[#C9A962]/30',
  rechazado: 'text-red-400 bg-red-400/10 border-red-400/30',
};
