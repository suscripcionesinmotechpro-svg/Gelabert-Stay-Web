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

  // Alquiler por habitaciones
  is_room_rental: boolean;
  rooms: PropertyRoom[] | null;

  // SEO
  slug: string | null;
  meta_title: string | null;
  meta_description: string | null;

  // Estado
  status: PropertyStatus;
  commercial_status: CommercialStatus;
  is_featured: boolean;
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
}

export const OPERATION_LABELS: Record<PropertyOperation, string> = {
  venta: 'property.labels.operation.venta',
  alquiler: 'property.labels.operation.alquiler',
  traspaso: 'property.labels.operation.traspaso',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  piso: 'property.labels.type.piso',
  casa: 'property.labels.type.casa',
  atico: 'property.labels.type.atico',
  estudio: 'property.labels.type.estudio',
  loft: 'property.labels.type.loft',
  local: 'property.labels.type.local',
  oficina: 'property.labels.type.oficina',
  nave: 'property.labels.type.nave',
  terreno: 'property.labels.type.terreno',
  negocio: 'property.labels.type.negocio',
  otro: 'property.labels.type.otro',
};

export const RENT_TYPE_LABELS: Record<RentType, string> = {
  temporal: 'search.rent_type.temporal',
  habitual: 'search.rent_type.habitual',
  vacacional: 'search.rent_type.vacacional',
  habitaciones: 'search.rent_type.habitaciones',
  otros: 'search.rent_type.otros',
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  borrador: 'property.labels.status.borrador',
  publicada: 'property.labels.status.publicada',
  oculta: 'property.labels.status.oculta',
};

export const COMMERCIAL_STATUS_LABELS: Record<CommercialStatus, string> = {
  disponible: 'property.labels.commercial_status.disponible',
  reservado: 'property.labels.commercial_status.reservado',
  alquilado: 'property.labels.commercial_status.alquilado',
  vendido: 'property.labels.commercial_status.vendido',
  traspasado: 'property.labels.commercial_status.traspasado',
};

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  borrador: 'text-yellow-400 bg-yellow-400/10',
  publicada: 'text-green-400 bg-green-400/10',
  oculta: 'text-gray-400 bg-gray-400/10',
};

export const COMMERCIAL_STATUS_COLORS: Record<CommercialStatus, string> = {
  disponible: 'text-green-400 bg-green-400/10',
  reservado: 'text-orange-400 bg-orange-400/10',
  alquilado: 'text-purple-400 bg-purple-400/10',
  vendido: 'text-red-400 bg-red-400/10',
  traspasado: 'text-blue-400 bg-blue-400/10',
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
];
