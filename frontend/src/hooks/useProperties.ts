import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Property, PropertyFilters, PropertyInsert, PropertyUpdate, PropertyStatus, CommercialStatus } from '../types/property';
import { applyWatermark } from '../utils/watermark';

// ============================================================
// useProperties — list with optional filters (public: only published)
// ============================================================
export const useProperties = (filters?: PropertyFilters, adminMode = false) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // stringify filters para evitar loops de re-renderizados por referencias de objeto literales
  const filtersString = JSON.stringify(filters);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentFilters = filtersString ? JSON.parse(filtersString) : undefined;
      
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (!adminMode) {
        query = query.eq('status', 'publicada');
      }

      if (currentFilters?.operation) query = query.eq('operation', currentFilters.operation);
      if (currentFilters?.property_type) query = query.eq('property_type', currentFilters.property_type);
      if (currentFilters?.city) query = query.ilike('city', `%${currentFilters.city}%`);
      if (currentFilters?.province) query = query.ilike('province', `%${currentFilters.province}%`);
      if (currentFilters?.min_price) query = query.gte('price', currentFilters.min_price);
      if (currentFilters?.max_price) query = query.lte('price', currentFilters.max_price);
      if (currentFilters?.bedrooms) query = query.gte('bedrooms', currentFilters.bedrooms);
      if (currentFilters?.bathrooms) query = query.gte('bathrooms', currentFilters.bathrooms);
      if (currentFilters?.commercial_status) query = query.eq('commercial_status', currentFilters.commercial_status);
      if (currentFilters?.is_featured !== undefined) query = query.eq('is_featured', currentFilters.is_featured);
      
      const booleanFilters: (keyof PropertyFilters)[] = [
        'has_elevator', 'is_furnished', 'has_terrace', 'has_balcony', 'has_parking',
        'has_storage', 'has_pool', 'heating', 'has_patio', 'is_exterior', 'sea_views', 'pets_allowed'
      ];
      for (const filter of booleanFilters) {
        if (currentFilters?.[filter]) query = query.eq(filter, true);
      }
      
      if (currentFilters?.no_pets_allowed) {
        query = query.eq('pets_allowed', false);
      }

      if (currentFilters?.keyword) {
        query = query.or(
          `title.ilike.%${currentFilters.keyword}%,description.ilike.%${currentFilters.keyword}%,city.ilike.%${currentFilters.keyword}%,zone.ilike.%${currentFilters.keyword}%`
        );
      }

      if (currentFilters?.reference) {
        query = query.ilike('reference', `%${currentFilters.reference}%`);
      }

      if (currentFilters?.saved_ids && currentFilters.saved_ids.length > 0) {
        query = query.in('id', currentFilters.saved_ids);
      } else if (currentFilters?.saved_ids && currentFilters.saved_ids.length === 0) {
        // If filtering by favorites but none saved, return empty
        setProperties([]);
        setLoading(false);
        return;
      }

      if (currentFilters?.limit) query = query.limit(currentFilters.limit);

      const { data, error: supabaseError } = await query;
      if (supabaseError) throw supabaseError;
      setProperties(data as Property[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar propiedades');
    } finally {
      setLoading(false);
    }
  }, [filtersString, adminMode]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, loading, error, refetch: fetchProperties };
};

// ============================================================
// useProperty — single property by id or slug
// ============================================================
export const useProperty = (idOrSlug: string | undefined, adminMode = false) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) { setLoading(false); return; }

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const isUUID = /^[0-9a-f-]{36}$/i.test(idOrSlug);
        let query = supabase.from('properties').select('*');
        
        if (isUUID) {
          query = query.eq('id', idOrSlug);
        } else {
          // Buscar por referencia (vía exact ilike) o por slug
          query = query.or(`reference.ilike.${idOrSlug},slug.ilike.${idOrSlug}`);
        }

        if (!adminMode) {
          query = query.eq('status', 'publicada');
        }

        const { data, error: supabaseError } = await query.maybeSingle();
        if (supabaseError) throw supabaseError;
        setProperty(data as Property | null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar propiedad');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [idOrSlug, adminMode]);

  return { property, loading, error };
};

// ============================================================
// usePropertyMutations — CRUD + status helpers
// ============================================================
export const usePropertyMutations = () => {
  const createProperty = async (data: PropertyInsert): Promise<Property> => {
    const { data: created, error } = await supabase
      .from('properties')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created as Property;
  };

  const updateProperty = async (id: string, data: PropertyUpdate): Promise<Property> => {
    const { data: updated, error } = await supabase
      .from('properties')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated as Property;
  };

  const deleteProperty = async (id: string): Promise<void> => {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
  };

  const changeStatus = async (id: string, status: PropertyStatus): Promise<void> => {
    const { error } = await supabase.from('properties').update({ status }).eq('id', id);
    if (error) throw error;
  };

  const changeCommercialStatus = async (id: string, commercial_status: CommercialStatus): Promise<void> => {
    const { error } = await supabase.from('properties').update({ commercial_status }).eq('id', id);
    if (error) throw error;
  };

  const toggleFeatured = async (id: string, is_featured: boolean): Promise<void> => {
    const { error } = await supabase.from('properties').update({ is_featured }).eq('id', id);
    if (error) throw error;
  };

  return { createProperty, updateProperty, deleteProperty, changeStatus, changeCommercialStatus, toggleFeatured };
};

// ============================================================
// useAdminStats — dashboard numbers
// ============================================================
export const useAdminStats = () => {
  const [stats, setStats] = useState({
    total: 0, publicadas: 0, borradores: 0,
    alquiler: 0, venta: 0, traspaso: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase.from('properties').select('status, operation');
        if (data) {
          setStats({
            total: data.length,
            publicadas: data.filter(p => p.status === 'publicada').length,
            borradores: data.filter(p => p.status === 'borrador').length,
            alquiler: data.filter(p => p.operation === 'alquiler').length,
            venta: data.filter(p => p.operation === 'venta').length,
            traspaso: data.filter(p => p.operation === 'traspaso').length,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { stats, loading };
};

// ============================================================
// uploadPropertyMedia — Storage helper for images, videos, and PDFs
// ============================================================
export const uploadPropertyMedia = async (rawFile: File, folder = 'main'): Promise<string> => {
  // Apply lossless watermark automatically (only affects images, leaves PDFs/Videos intact)
  const file = await applyWatermark(rawFile);
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  
  const { error } = await supabase.storage.from('property-images').upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
  });
  
  if (error) {
    console.error(`[Upload Error] ${error.message}`, error);
    throw error;
  }
  
  const { data } = supabase.storage.from('property-images').getPublicUrl(filename);
  return data.publicUrl;
};
