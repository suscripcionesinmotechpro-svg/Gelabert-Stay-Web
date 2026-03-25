import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Tenant, TenantInsert } from '../types/tenant';

// ─── LIST ────────────────────────────────────────────────────────────────────
export const useTenants = (search?: string) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('tenants')
        .select('*')
        .order('last_name', { ascending: true });

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`first_name.ilike.${term},last_name.ilike.${term},dni.ilike.${term},email.ilike.${term}`);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setTenants(data as Tenant[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  return { tenants, loading, error, refetch: fetchTenants };
};

// ─── SINGLE ──────────────────────────────────────────────────────────────────
export const useTenant = (id?: string) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => { setTenant(data as Tenant | null); setLoading(false); });
  }, [id]);

  return { tenant, loading };
};

// ─── MUTATIONS ───────────────────────────────────────────────────────────────
export const useTenantMutations = () => {
  const createTenant = async (data: TenantInsert): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const payload = { ...data, user_id: user.id };
    const { data: inserted, error } = await supabase
      .from('tenants')
      .insert([payload])
      .select('id')
      .single();
    if (error) throw error;
    return inserted.id;
  };

  const updateTenant = async (id: string, data: Partial<TenantInsert>) => {
    const { error } = await supabase.from('tenants').update(data).eq('id', id);
    if (error) throw error;
  };

  const deleteTenant = async (id: string) => {
    const { error } = await supabase.from('tenants').delete().eq('id', id);
    if (error) throw error;
  };

  return { createTenant, updateTenant, deleteTenant };
};
