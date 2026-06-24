import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface LeadCRM {
  id: string;
  created_at: string;
  updated_at: string;
  intent: 'alquilar' | 'comprar' | 'vender' | 'alquilar_propietario';
  status: 'nuevo' | 'contactado' | 'cualificado' | 'cerrado' | 'descartado' | 'incompleto';
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
  privacy_accepted_at?: string;
  agent_notes?: string;
  assigned_agent_id?: string;
  agent_id?: string | null;
  // Leads Form Specific
  occupants?: any[];
  property_ad_url?: string;
  property_features?: string;
  rental_price?: string;
  // Omnicanal Columns
  source?: string;
  target_property_id?: string;
  target_property_ref?: string;
  target_property?: {
    main_image?: string;
    reference: string;
    price: number;
    zone: string;
    property_type: string;
    slug: string;
    is_room_rental?: boolean;
  };
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

// ─── SAVE OR UPDATE LEAD FROM CHATBOT ───────────────────────────────────────
export const saveLeadFromBot = async (
  leadData: Partial<LeadInsert> & { id?: string },
  searchProfile?: Partial<LeadSearchProfile>
): Promise<{ id: string } | null> => {
  try {
    let leadId = leadData.id;
    
    if (leadId) {
      const { id: _, ...updateData } = leadData;
      const { error } = await supabase
        .from('leads_crm')
        .update(updateData)
        .eq('id', leadId);
      if (error) throw error;
    } else {
      leadId = crypto.randomUUID();
      const { error } = await supabase
        .from('leads_crm')
        .insert([{ ...leadData, id: leadId }]);
      if (error) throw error;
    }

    if (searchProfile && leadId) {
      const { data: existingProfile } = await supabase
        .from('leads_search_profiles')
        .select('id')
        .eq('lead_id', leadId)
        .maybeSingle();
        
      if (existingProfile) {
        await supabase
          .from('leads_search_profiles')
          .update(searchProfile)
          .eq('id', existingProfile.id);
      } else {
        await supabase
          .from('leads_search_profiles')
          .insert([{ ...searchProfile, lead_id: leadId, intent: leadData.intent || '' }]);
      }
    }
    return leadId ? { id: leadId } : null;
  } catch (err) {
    console.error('Error saving lead from bot:', err);
    return null;
  }
};

// ─── CREATE LEAD WITH PROPERTY CLONE ────────────────────────────────────────
export const createLeadWithPropertyClone = async (
  leadData: Partial<LeadInsert> & { intent: 'alquilar' | 'comprar'; name: string; phone: string },
  propertyRef?: string,
  searchProfileFields?: Partial<LeadSearchProfile>
): Promise<{ id: string } | null> => {
  try {
    const leadId = crypto.randomUUID();
    let targetPropertyId: string | null = null;
    let targetPropertyRefVal: string | null = propertyRef || null;
    let clonedProfile: Partial<LeadSearchProfile> = { ...searchProfileFields };

    if (propertyRef) {
      const { data: property, error: pError } = await supabase
        .from('properties')
        .select('id, reference, price, zone, bedrooms, has_pool, has_parking, has_terrace, has_elevator, is_furnished, air_conditioning, pets_allowed, garden, property_type')
        .eq('reference', propertyRef)
        .maybeSingle();

      if (pError) console.error('Error fetching property by ref:', pError);

      if (property) {
        targetPropertyId = property.id;
        targetPropertyRefVal = property.reference;

        const margin = 0.10;
        const maxPrice = property.price ? Math.round(property.price * (1 + margin)) : undefined;

        clonedProfile = {
          ...clonedProfile,
          preferred_zones: property.zone ? [property.zone] : clonedProfile.preferred_zones || [],
          min_bedrooms: property.bedrooms || clonedProfile.min_bedrooms || undefined,
          max_price: maxPrice || clonedProfile.max_price || undefined,
          wants_pool: property.has_pool || clonedProfile.wants_pool || undefined,
          wants_parking: property.has_parking || clonedProfile.wants_parking || undefined,
          wants_terrace: property.has_terrace || clonedProfile.wants_terrace || undefined,
          wants_elevator: property.has_elevator || clonedProfile.wants_elevator || undefined,
          wants_furnished: property.is_furnished || clonedProfile.wants_furnished || undefined,
          wants_air_conditioning: property.air_conditioning || clonedProfile.wants_air_conditioning || undefined,
          pets_needed: property.pets_allowed || clonedProfile.pets_needed || undefined,
          wants_garden: property.garden || clonedProfile.wants_garden || undefined,
          property_types: property.property_type ? [property.property_type] : clonedProfile.property_types || [],
          is_active: true
        };

        if (leadData.intent === 'alquilar') {
          leadData.max_rent = maxPrice;
        } else if (leadData.intent === 'comprar') {
          leadData.max_buy_price = maxPrice;
        }
      }
    }

    const { error: insertError } = await supabase
      .from('leads_crm')
      .insert([{
        ...leadData,
        id: leadId,
        status: 'nuevo',
        source: leadData.source || 'manual',
        target_property_id: targetPropertyId,
        target_property_ref: targetPropertyRefVal
      }]);

    if (insertError) throw insertError;

    const { error: profileError } = await supabase
      .from('leads_search_profiles')
      .insert([{
        ...clonedProfile,
        lead_id: leadId,
        intent: leadData.intent
      }]);

    if (profileError) {
      console.error('Error creating search profile:', profileError);
    }

    return { id: leadId };
  } catch (err) {
    console.error('Error creating lead with property clone:', err);
    return null;
  }
};

// ─── SAVE OR UPDATE LEAD FROM FORM (DUPLICATES CHECK) ────────────────────────
export const saveOrUpdateLeadFromForm = async (
  leadData: { name: string; email: string; phone?: string; intent: string; source: string; privacy_accepted: boolean; privacy_accepted_at: string },
  propertyInfo?: { id: string; reference: string; price?: number; zone?: string; bedrooms?: number; has_pool?: boolean; has_parking?: boolean; has_terrace?: boolean; has_elevator?: boolean; is_furnished?: boolean; air_conditioning?: boolean; pets_allowed?: boolean; garden?: boolean; property_type?: string }
): Promise<{ id: string } | null> => {
  try {
    let existingLead: LeadCRM | null = null;

    if (leadData.email || leadData.phone) {
      let query = supabase.from('leads_crm').select('*, search_profile:leads_search_profiles(*)');
      
      if (leadData.email && leadData.phone) {
        query = query.or(`email.eq.${leadData.email},phone.eq.${leadData.phone}`);
      } else if (leadData.email) {
        query = query.eq('email', leadData.email);
      } else if (leadData.phone) {
        query = query.eq('phone', leadData.phone);
      }

      const { data } = await query.limit(1).maybeSingle();
      if (data) {
        existingLead = {
          ...data,
          search_profile: Array.isArray(data.search_profile) ? data.search_profile[0] : data.search_profile
        } as LeadCRM;
      }
    }

    let leadId = existingLead?.id;
    let clonedProfile: Partial<LeadSearchProfile> = {};
    let targetPropertyId: string | null = propertyInfo?.id || null;
    let targetPropertyRefVal: string | null = propertyInfo?.reference || null;

    if (propertyInfo) {
      const margin = 0.10;
      const maxPrice = propertyInfo.price ? Math.round(propertyInfo.price * (1 + margin)) : undefined;

      clonedProfile = {
        preferred_zones: propertyInfo.zone ? [propertyInfo.zone] : [],
        min_bedrooms: propertyInfo.bedrooms || undefined,
        max_price: maxPrice,
        wants_pool: propertyInfo.has_pool || undefined,
        wants_parking: propertyInfo.has_parking || undefined,
        wants_terrace: propertyInfo.has_terrace || undefined,
        wants_elevator: propertyInfo.has_elevator || undefined,
        wants_furnished: propertyInfo.is_furnished || undefined,
        wants_air_conditioning: propertyInfo.air_conditioning || undefined,
        pets_needed: propertyInfo.pets_allowed || undefined,
        wants_garden: propertyInfo.garden || undefined,
        property_types: propertyInfo.property_type ? [propertyInfo.property_type] : [],
        is_active: true
      };
    }

    if (existingLead && leadId) {
      const updateData: any = {
        status: 'nuevo',
        updated_at: new Date().toISOString()
      };
      if (targetPropertyId) updateData.target_property_id = targetPropertyId;
      if (targetPropertyRefVal) updateData.target_property_ref = targetPropertyRefVal;

      if (propertyInfo?.price) {
        const margin = 0.10;
        const maxPrice = Math.round(propertyInfo.price * (1 + margin));
        if (existingLead.intent === 'alquilar') {
          updateData.max_rent = maxPrice;
        } else if (existingLead.intent === 'comprar') {
          updateData.max_buy_price = maxPrice;
        }
      }

      await supabase
        .from('leads_crm')
        .update(updateData)
        .eq('id', leadId);

      if (existingLead.search_profile) {
        const profileId = existingLead.search_profile.id;
        
        const mergedZones = [...(existingLead.search_profile.preferred_zones || [])];
        if (propertyInfo?.zone && !mergedZones.includes(propertyInfo.zone)) {
          mergedZones.push(propertyInfo.zone);
        }

        const mergedTypes = [...(existingLead.search_profile.property_types || [])];
        if (propertyInfo?.property_type && !mergedTypes.includes(propertyInfo.property_type)) {
          mergedTypes.push(propertyInfo.property_type);
        }

        const currentMaxPrice = existingLead.search_profile.max_price || 0;
        const newMaxPrice = clonedProfile.max_price || 0;
        const mergedMaxPrice = Math.max(currentMaxPrice, newMaxPrice) || undefined;

        const updatedProfile = {
          ...clonedProfile,
          preferred_zones: mergedZones.length > 0 ? mergedZones : clonedProfile.preferred_zones,
          property_types: mergedTypes.length > 0 ? mergedTypes : clonedProfile.property_types,
          max_price: mergedMaxPrice
        };

        await supabase
          .from('leads_search_profiles')
          .update(updatedProfile)
          .eq('id', profileId);
      } else {
        await supabase
          .from('leads_search_profiles')
          .insert([{
            ...clonedProfile,
            lead_id: leadId,
            intent: existingLead.intent
          }]);
      }
    } else {
      leadId = crypto.randomUUID();
      const newLeadData: any = {
        ...leadData,
        id: leadId,
        status: 'nuevo',
        target_property_id: targetPropertyId,
        target_property_ref: targetPropertyRefVal
      };

      if (propertyInfo?.price) {
        const margin = 0.10;
        const maxPrice = Math.round(propertyInfo.price * (1 + margin));
        if (leadData.intent === 'alquilar') {
          newLeadData.max_rent = maxPrice;
        } else if (leadData.intent === 'comprar') {
          newLeadData.max_buy_price = maxPrice;
        }
      }

      const { error } = await supabase
        .from('leads_crm')
        .insert([newLeadData]);

      if (error) throw error;

      await supabase
        .from('leads_search_profiles')
        .insert([{
          ...clonedProfile,
          lead_id: leadId,
          intent: leadData.intent
        }]);
    }

    return { id: leadId };
  } catch (err) {
    console.error('Error saving or updating lead from form:', err);
    return null;
  }
};




// ─── LIST LEADS (ADMIN) ─────────────────────────────────────────────────────
export interface LeadFilters {
  intent?: string;
  status?: string;
  search?: string;
  agentId?: string;
  year?: string | number;
  month?: string | number;
  propertyRef?: string;
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
          search_profile:leads_search_profiles(*),
          target_property:properties(main_image, reference, price, zone, property_type, slug, is_room_rental)
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
      if (filters?.agentId) {
        query = query.eq('agent_id', filters.agentId);
      }
      if (filters?.propertyRef) {
        query = query.ilike('target_property_ref', `%${filters.propertyRef}%`);
      }
      if (filters?.year && filters.year !== 'todos') {
        const yearVal = parseInt(filters.year.toString(), 10);
        if (filters?.month && filters.month !== 'todos') {
          const monthVal = parseInt(filters.month.toString(), 10);
          const startDate = new Date(yearVal, monthVal - 1, 1).toISOString();
          const endDate = new Date(yearVal, monthVal, 1).toISOString();
          query = query.gte('created_at', startDate).lt('created_at', endDate);
        } else {
          const startDate = new Date(yearVal, 0, 1).toISOString();
          const endDate = new Date(yearVal + 1, 0, 1).toISOString();
          query = query.gte('created_at', startDate).lt('created_at', endDate);
        }
      }

      const { data, error: err } = await query;
      if (err) throw err;

      // search_profile and target_property safety check
      const processed = (data || []).map((l: any) => ({
        ...l,
        search_profile: Array.isArray(l.search_profile) ? l.search_profile[0] : l.search_profile,
        target_property: Array.isArray(l.target_property) ? l.target_property[0] : l.target_property,
      }));

      setLeads(processed as LeadCRM[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [
    filters?.intent,
    filters?.status,
    filters?.search,
    filters?.agentId,
    filters?.year,
    filters?.month,
    filters?.propertyRef
  ]);

  useEffect(() => { 
    fetchLeads(); 

    // Subscribe to realtime changes for instant updates
    const channel = supabase
      .channel('leads_crm_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leads_crm' 
      }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads]);

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
export const updateLeadNotes = async (id: string, agent_notes: string) => {
  const { error } = await supabase
    .from('leads_crm')
    .update({ agent_notes })
    .eq('id', id);

  if (error) {
    console.error('Error updating lead notes:', error);
    throw error;
  }
};

// ─── DELETE LEAD (ADMIN) ────────────────────────────────────────────────────
export const deleteLead = async (id: string) => {
  const { error } = await supabase
    .from('leads_crm')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
};

// ─── TRIGGER EMAIL NOTIFICATIONS ────────────────────────────────────────────
export const sendLeadEmail = async (leadData: any, matches: ScoredProperty[], type: string) => {
  try {
    await supabase.functions.invoke('notify-lead-matches', {
      body: { leadData, matches, type }
    });
  } catch (err) {
    console.error('Error sending lead emails via Edge Function:', err);
  }
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
