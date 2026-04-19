// ═══════════════════════════════════════════════
//  Tenant Module Types — Gelabert Homes
// ═══════════════════════════════════════════════

export type ContractStatus = 'active' | 'expired' | 'cancelled';

export type DocumentType =
  | 'dni'
  | 'contrato_arrendamiento'
  | 'documento_reserva'
  | 'encargo_servicios'
  | 'ficha_visita'
  | 'nota_simple'
  | 'factura_electricidad'
  | 'factura_agua'
  | 'factura_wifi'
  | 'recibo_ibi'
  | 'recibo_comunidad'
  | 'otro';

// ─── TENANT ─────────────────────────────────────
export interface Tenant {
  id: string;
  created_at: string;
  user_id: string;
  first_name: string;
  last_name: string;
  dni: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  zip_code: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  avatar_color: string | null;
}

export type TenantInsert = Omit<Tenant, 'id' | 'created_at' | 'user_id'>;

// ─── CONTRACT ───────────────────────────────────
export interface Contract {
  id: string;
  created_at: string;
  user_id: string;
  tenant_id: string;
  property_id: string | null;
  property_label: string | null;
  room_id: string | null;
  start_date: string;   // ISO date
  end_date: string;     // ISO date
  monthly_rent: number | null;
  deposit: number | null;
  currency: string;
  address: string | null;
  status: ContractStatus;
  notes: string | null;
  
  // Datos del Propietario (Landlord)
  landlord_name: string | null;
  landlord_dni: string | null;
  landlord_phone: string | null;
  landlord_email: string | null;
  landlord_address: string | null;

  // Joined relations
  tenant?: Tenant;
}

export type ContractInsert = Omit<Contract, 'id' | 'created_at' | 'user_id' | 'tenant'>;

// ─── DOCUMENT ───────────────────────────────────
export type DocumentCategory = 'tenant' | 'owner';

export interface TenantDocument {
  id: string;
  uploaded_at: string;
  user_id: string;
  contract_id: string;
  document_type: DocumentType;
  category: DocumentCategory;
  file_name: string;
  file_url: string;
  file_path: string;
}

// ─── LABEL MAPS ─────────────────────────────────
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  active: 'Activo',
  expired: 'Expirado',
  cancelled: 'Cancelado',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  active: 'text-green-400 bg-green-400/10 border-green-400/30',
  expired: 'text-red-400 bg-red-400/10 border-red-400/30',
  cancelled: 'text-[#666] bg-[#1F1F1F] border-[#333]',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  dni: 'DNI / NIE',
  contrato_arrendamiento: 'Contrato de Arrendamiento',
  documento_reserva: 'Documento de Reserva',
  encargo_servicios: 'Encargo de Servicios',
  ficha_visita: 'Ficha de Visita',
  nota_simple: 'Nota Simple',
  factura_electricidad: 'Última Factura Electricidad',
  factura_agua: 'Última Factura Agua',
  factura_wifi: 'Última Factura WIFI',
  recibo_ibi: 'Recibo Último Pago IBI',
  recibo_comunidad: 'Recibo Último Pago Comunidad',
  otro: 'Otro Documento',
};

// Helper: days until contract ends (negative = already expired)
export const daysUntilExpiry = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};
