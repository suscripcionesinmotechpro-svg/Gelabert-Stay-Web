import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface LeadCRM {
  id: string;
  created_at: string;
  updated_at: string;
  intent: 'alquilar' | 'comprar' | 'vender';
  status: 'nuevo' | 'contactado' | 'cualificado' | 'cerrado' | 'descartado';
  name: string;
  email: string;
  phone?: string;
  age?: number;
  nationality?: string;
  city_origin?: string;
  occupation?: string;
  monthly_income?: number;
  income_provable?: boolean;
  employment_seniority?: string;
  num_people?: number;
  has_pets?: boolean;
  // Alquilar
  max_rent?: number;
  move_in_date?: string;
  min_lease_months?: number;
  // Compra
  max_buy_price?: number;
  mortgage_approved?: boolean;
  needs_mortgage_service?: boolean;
  buy_deadline?: string;
  // Venta
  sell_property_address?: string;
  sell_property_type?: string;
  sell_num_bedrooms?: number;
  sell_num_bathrooms?: number;
  sell_has_terrace?: boolean;
  sell_has_parking?: boolean;
  sell_has_pool?: boolean;
  sell_has_elevator?: boolean;
  sell_is_furnished?: boolean;
  sell_is_reformed?: boolean;
  sell_has_garden?: boolean;
  sell_has_balcony?: boolean;
  sell_area_m2?: number;
  sell_floor?: string;
  sell_orientation?: string;
  sell_property_condition?: string;
  sell_estimated_price?: number;
  sell_purchase_price?: number;
  sell_additional_info?: string;
  // Meta
  chat_transcript?: any[];
  source_page?: string;
  privacy_accepted?: boolean;
  agent_notes?: string;
  assigned_agent_id?: string;
  // Joined
  search_profile?: LeadSearchProfile;
}

export interface LeadSearchProfile {
  id: string;
  lead_id: string;
  intent: string;
  preferred_zones?: string[];
  preferred_cities?: string[];
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  min_bathrooms?: number;
  min_area_m2?: number;
  property_types?: string[];
  wants_terrace?: boolean;
  wants_parking?: boolean;
  wants_pool?: boolean;
  wants_elevator?: boolean;
  wants_furnished?: boolean;
  wants_air_conditioning?: boolean;
  pets_needed?: boolean;
  wants_garden?: boolean;
  wants_balcony?: boolean;
  preferred_orientation?: string[];
  search_keywords?: string;
  last_matched_at?: string;
  matched_property_ids?: string[];
  is_active?: boolean;
}

export interface LeadInsert extends Omit<LeadCRM, 'id' | 'created_at' | 'updated_at' | 'search_profile'> {}

// ─── SAVE LEAD FROM CHATBOT ─────────────────────────────────────────────────
export const saveLeadFromBot = async (
  leadData: Partial<LeadInsert>,
  searchProfile?: Partial<LeadSearchProfile>
): Promise<{ id: string } | null> => {
  const { data, error } = await supabase
    .from('leads_crm')
    .insert([leadData])
    .select('id')
    .single();

  if (error) {
    console.error('Error saving lead:', error);
    throw error;
  }

  if (data?.id && searchProfile) {
    const { error: spError } = await supabase
      .from('leads_search_profiles')
      .insert([{ ...searchProfile, lead_id: data.id }]);
    if (spError) console.error('Error saving search profile:', spError);
  }

  return data;
};

// ─── LIST LEADS (ADMIN) ─────────────────────────────────────────────────────
export interface LeadFilters {
  intent?: string;
  status?: string;
  search?: string;
}

export const useLeadsCRM = (filters?: LeadFilters) => {
  const [leads, setLeads] = useState<LeadCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('leads_crm')
        .select(`
          *,
          search_profile:leads_search_profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.intent && filters.intent !== 'todos') {
        query = query.eq('intent', filters.intent);
      }
      if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      // search_profile comes as array (one-to-many join), pick first
      const processed = (data || []).map((l: any) => ({
        ...l,
        search_profile: Array.isArray(l.search_profile) ? l.search_profile[0] : l.search_profile,
      }));

      setLeads(processed as LeadCRM[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters?.intent, filters?.status, filters?.search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
};

// ─── UPDATE LEAD STATUS (ADMIN) ─────────────────────────────────────────────
export const updateLeadStatus = async (id: string, status: LeadCRM['status']) => {
  const { error } = await supabase
    .from('leads_crm')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
};

// ─── UPDATE LEAD NOTES (ADMIN) ──────────────────────────────────────────────
export const updateLeadNotes = async (id: string, notes: string) => {
  const { error } = await supabase
    .from('leads_crm')
    .update({ agent_notes: notes })
    .eq('id', id);
  if (error) throw error;
};

// ─── SEARCH PROPERTIES FOR BOT ──────────────────────────────────────────────
export interface PropertySearchParams {
  operation: 'alquilar' | 'comprar' | 'vender';
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  min_bathrooms?: number;
  zones?: string[];
  wants_terrace?: boolean;
  wants_parking?: boolean;
  wants_pool?: boolean;
  wants_elevator?: boolean;
  wants_furnished?: boolean;
  wants_air_conditioning?: boolean;
  pets_needed?: boolean;
  wants_garden?: boolean;
  property_types?: string[];
  keywords?: string;
}

export interface ScoredProperty {
  id: string;
  title: string;
  price: number;
  city: string;
  zone: string;
  area_m2: number;
  bedrooms: number;
  bathrooms: number;
  operation: string;
  main_image: string;
  reference: string;
  slug: string;
  has_terrace: boolean;
  has_parking: boolean;
  has_pool: boolean;
  has_elevator: boolean;
  is_furnished: boolean;
  air_conditioning: boolean;
  pets_allowed: boolean;
  garden: boolean;
  orientation: string[];
  short_description: string;
  description: string;
  score: number;
  matchReasons: string[];
}

export const searchPropertiesForBot = async (params: PropertySearchParams): Promise<ScoredProperty[]> => {
  const opMap: Record<string, string> = {
    alquilar: 'alquiler',
    comprar: 'venta',
    vender: 'venta',
  };

  const { data, error } = await supabase
    .from('properties')
    .select(`
      id, title, short_description, description, price, city, zone,
      area_m2, bedrooms, bathrooms, operation, main_image, reference, slug,
      has_terrace, has_parking, has_pool, has_elevator, is_furnished,
      air_conditioning, pets_allowed, garden, orientation, commercial_status,
      property_type, highlights, tags
    `)
    .eq('operation', opMap[params.operation] || params.operation)
    .eq('commercial_status', 'disponible')
    .limit(100);

  if (error || !data) return [];

  // Score each property
  const scored: ScoredProperty[] = data.map((p: any) => {
    let score = 0;
    const reasons: string[] = [];
    const totalCriteria = Object.keys(params).filter(k => params[k as keyof PropertySearchParams] !== undefined).length;

    // Price match
    if (params.max_price && p.price <= params.max_price) {
      score += 25;
      reasons.push('Precio dentro de tu presupuesto');
    } else if (params.max_price && p.price > params.max_price) {
      score -= 15;
    }
    if (params.min_price && p.price >= params.min_price) score += 5;

    // Bedrooms
    if (params.min_bedrooms && p.bedrooms >= params.min_bedrooms) {
      score += 20;
      reasons.push(`${p.bedrooms} habitación(es)`);
    }

    // Bathrooms
    if (params.min_bathrooms && p.bathrooms >= params.min_bathrooms) {
      score += 10;
      reasons.push(`${p.bathrooms} baño(s)`);
    }

    // Zone/city match
    if (params.zones && params.zones.length > 0) {
      const zoneMatch = params.zones.some(z =>
        p.zone?.toLowerCase().includes(z.toLowerCase()) ||
        p.city?.toLowerCase().includes(z.toLowerCase())
      );
      if (zoneMatch) {
        score += 20;
        reasons.push('Zona deseada');
      }
    }

    // Amenidades
    if (params.wants_terrace && p.has_terrace) { score += 8; reasons.push('Terraza'); }
    if (params.wants_parking && p.has_parking) { score += 8; reasons.push('Parking'); }
    if (params.wants_pool && p.has_pool) { score += 8; reasons.push('Piscina'); }
    if (params.wants_elevator && p.has_elevator) { score += 5; reasons.push('Ascensor'); }
    if (params.wants_furnished && p.is_furnished) { score += 5; reasons.push('Amueblado'); }
    if (params.wants_air_conditioning && p.air_conditioning) { score += 5; reasons.push('Aire acondicionado'); }
    if (params.pets_needed && p.pets_allowed) { score += 10; reasons.push('Acepta mascotas'); }
    if (params.wants_garden && p.garden) { score += 6; reasons.push('Jardín'); }

    // Property type match
    if (params.property_types && params.property_types.length > 0) {
      if (params.property_types.includes(p.property_type)) {
        score += 10;
        reasons.push(`Tipo: ${p.property_type}`);
      }
    }

    // Keyword match in description/title/highlights
    if (params.keywords) {
      const kws = params.keywords.toLowerCase().split(' ').filter(k => k.length > 2);
      const searchText = `${p.title} ${p.description || ''} ${p.short_description || ''} ${(p.highlights || []).join(' ')} ${(p.tags || []).join(' ')}`.toLowerCase();
      const kwMatches = kws.filter(kw => searchText.includes(kw));
      if (kwMatches.length > 0) {
        score += kwMatches.length * 5;
        reasons.push('Coincide con tu descripción');
      }
    }

    // Normalize to 0-100
    const normalizedScore = Math.min(100, Math.max(0, score));

    return {
      ...p,
      score: normalizedScore,
      matchReasons: reasons,
    };
  });

  // Filter >= 70% and sort by score
  return scored
    .filter(p => p.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
};
