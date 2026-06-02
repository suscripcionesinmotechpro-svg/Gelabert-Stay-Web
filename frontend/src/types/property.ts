export type PropertyOperation = 'alquiler' | 'venta' | 'traspaso';
export type RentType = 'temporal' | 'habitual' | 'vacacional' | 'habitaciones' | 'otros';


export type PropertyType =
  | 'piso'
  | 'casa'
  | 'atico'
  | 'estudio'
  | 'loft'
  | 'local'
  | 'oficina'
  | 'nave'
  | 'terreno'
  | 'negocio'
  | 'habitacion'
  | 'otro';

export type PropertyStatus =
  | 'borrador'
  | 'publicada'
  | 'oculta';

export type CommercialStatus =
  | 'disponible'
  | 'reservado'
  | 'alquilado'
  | 'vendido'
  | 'traspasado';

export interface PropertyVideo {
  url: string;
  title: string;
}

export interface PropertyRoom {
  id: string;
  name: string;
  images: string[];
  video?: PropertyVideo | null;
  price?: number | null;
  _calculated_status?: 'disponible' | 'reservada' | 'alquilada';
}

export interface PropertyCommonArea {
  id: string;
  type: 'baño' | 'salon' | 'terraza' | 'cocina' | 'patio' | 'trastero' | 'general' | 'otro';
  name?: string;
  images: string[];
  videos?: (string | PropertyVideo)[];
  is_private?: boolean; // Principalmente para baños
}

export interface Property {
  id: string;
  created_at: string;
  updated_at: string;

  // Información principal
  title: string;
  title_en: string | null;
  reference: string | null;
  operation: PropertyOperation;
  property_type: PropertyType;
  price: number | null;
  max_price: number | null;
  price_type: 'exact' | 'from' | 'range';
  currency: string;

  // Ubicación
  city: string | null;
  zone: string | null;
  address: string | null;
  postal_code: string | null;
  street_number: string | null;
  door_number: string | null;
  latitude: number | null;
  longitude: number | null;

  // Características
  area_m2: number | null;
  bedrooms: number;
  bathrooms: number;
  floor: string | null;
  has_elevator: boolean;
  is_furnished: boolean;
  has_terrace: boolean;
  has_balcony: boolean;
  has_parking: boolean;
  parking_included: boolean | null;
  parking_price: number | null;
  has_storage: boolean;
  has_pool: boolean;
  heating: boolean;
  has_patio: boolean;
  is_exterior: boolean;
  sea_views: boolean;
  pets_allowed: boolean;
  air_conditioning: boolean;
  garden: boolean;
  has_wardrobes: boolean;
  has_fireplace: boolean;
  property_condition: string | null;
  availability: string | null;
  rent_type: RentType | null;

  // Nuevos campos
  orientation: string[] | null;
  energy_rating: string | null;
  energy_consumption: number | null;
  emissions_rating: string | null;
  emissions_value: number | null;
  conservation_state: string | null;
  community_fees: number | null;
  ibi: number | null;
  block_staircase: string | null;
  urbanization: string | null;

  // Contenido
  short_description: string | null;
  short_description_en: string | null;
  description: string | null;
  description_en: string | null;
  highlights: string[] | null;
  highlights_en: string[] | null;
  tags: string[] | null;

  // Multimedia
  main_image: string | null;
  gallery: string[] | null;
  video_url: string | null;
  videos: string[] | null;
  videos_metadata: PropertyVideo[] | null;
  floor_plan: string | null;
  floor_plans: string[] | null;
  virtual_tour_url: string | null;

  // Alquiler por habitaciones
  is_room_rental: boolean;
  rooms: PropertyRoom[] | null;
  common_areas: PropertyCommonArea[] | null;

  // SEO
  slug: string | null;
  meta_title: string | null;
  meta_title_en: string | null;
  meta_description: string | null;
  meta_description_en: string | null;

  // Estado
  status: PropertyStatus;
  commercial_status: CommercialStatus;
  is_manual_commercial_status?: boolean;
  is_featured: boolean;
  order_index: number | null;
  agent_id?: string | null;

  // Integración de Idealista
  idealista_id?: string | null;
  idealista_status?: 'not_published' | 'pending' | 'published' | 'error';
  idealista_error_log?: string | null;
  idealista_last_sync?: string | null;

  // Integración de Facebook
  facebook_post_id?: string | null;
  facebook_status?: 'not_published' | 'pending' | 'published' | 'error';
  facebook_error_log?: string | null;
  facebook_last_sync?: string | null;

  // Integración de Instagram
  instagram_post_id?: string | null;
  instagram_status?: 'not_published' | 'pending' | 'published' | 'error';
  instagram_error_log?: string | null;
  instagram_last_sync?: string | null;

  // Identificador único para redes sociales (anti-duplicados)
  social_unique_id?: string | null;
}

export type PropertyInsert = Omit<Property, 'id' | 'created_at' | 'updated_at' | 'reference' | 'slug'> & {
  reference?: string;
  slug?: string;
};

export type PropertyUpdate = Partial<PropertyInsert>;

export interface PropertyFilters {
  operation?: PropertyOperation;
  property_type?: PropertyType;
  city?: string;
  zone?: string;
  province?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  keyword?: string;
  reference?: string;
  saved_ids?: string[];
  is_featured?: boolean;
  status?: PropertyStatus;
  commercial_status?: CommercialStatus;
  limit?: number;

  // Filtros booleanos de características
  has_elevator?: boolean;
  is_furnished?: boolean;
  has_terrace?: boolean;
  has_balcony?: boolean;
  has_parking?: boolean;
  has_storage?: boolean;
  has_pool?: boolean;
  heating?: boolean;
  has_patio?: boolean;
  is_exterior?: boolean;
  sea_views?: boolean;
  pets_allowed?: boolean;
  no_pets_allowed?: boolean;
  air_conditioning?: boolean;
  garden?: boolean;
  has_wardrobes?: boolean;
  has_fireplace?: boolean;
  is_room_rental?: boolean;
}

export const OPERATION_LABELS: Record<PropertyOperation, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  traspaso: 'Traspaso',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  piso: 'Piso',
  casa: 'Casa/Chalet',
  atico: 'Ático',
  estudio: 'Estudio',
  loft: 'Loft',
  local: 'Local Comercial',
  oficina: 'Oficina',
  nave: 'Nave Industrial',
  terreno: 'Terreno/Parcela',
  negocio: 'Negocio',
  habitacion: 'Habitación',
  otro: 'Otro',
};

export const RENT_TYPE_LABELS: Record<RentType, string> = {
  temporal: 'Alquiler Temporal',
  habitual: 'Larga Temporada',
  vacacional: 'Vacacional',
  habitaciones: 'Por Habitaciones',
  otros: 'Otros',
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  borrador: 'Borrador',
  publicada: 'Publicada',
  oculta: 'Oculta',
};

export const COMMERCIAL_STATUS_LABELS: Record<CommercialStatus, string> = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  alquilado: 'Alquilado',
  vendido: 'Vendido',
  traspasado: 'Traspasado',
};

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  borrador: 'bg-[#888888] text-[#FAF8F5]',
  publicada: 'bg-[#4ADE80] text-[#0A0A0A]',
  oculta: 'bg-[#F87171] text-[#FAF8F5]',
};

export const COMMERCIAL_STATUS_COLORS: Record<CommercialStatus, string> = {
  disponible: 'bg-[#4ADE80] text-[#0A0A0A]',
  reservado: 'bg-[#FB923C] text-[#0A0A0A]',
  alquilado: 'bg-[#A78BFA] text-[#0A0A0A]',
  vendido: 'bg-[#F87171] text-[#0A0A0A]',
  traspasado: 'bg-[#60A5FA] text-[#0A0A0A]',
};

export const AVAILABLE_TAGS = [
  'premium',
  'destacada',
  'oportunidad',
  'inversión',
  'reformado',
  'amueblado',
  'vistas al mar',
  'terraza',
  'piscina',
  'local comercial',
  'alta rentabilidad',
  'lujo',
  'centro histórico',
  'cerca de playa',
  'primera línea',
  'obra nueva',
  'estudiantes',
  'familias',
  'mascotas permitidas',
  'larga temporada',
  'vacacional',
  'habitaciones',
  'parking incluido',
  'bajo',
  'ático',
  'dúplex',
  'estudio',
  'sin muebles',
];
