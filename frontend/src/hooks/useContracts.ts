import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Contract, ContractInsert } from '../types/tenant';

// ─── LIST ALL (with tenant join) ─────────────────────────────────────────────
export const useContracts = (tenantId?: string) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('contracts')
        .select(`*, tenant:tenants(id, first_name, last_name, dni, email, phone)`)
        .order('end_date', { ascending: true });

      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data, error: err } = await query;
      if (err) throw err;
      setContracts(data as Contract[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  return { contracts, loading, error, refetch: fetchContracts };
};

// ─── EXPIRING WITHIN N DAYS ──────────────────────────────────────────────────
export const useExpiringContracts = (days = 60) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);

    const todayStr = today.toISOString().split('T')[0];
    const futureStr = future.toISOString().split('T')[0];

    supabase
      .from('contracts')
      .select(`*, tenant:tenants(id, first_name, last_name)`)
      .eq('status', 'active')
      .gte('end_date', todayStr)
      .lte('end_date', futureStr)
      .order('end_date', { ascending: true })
      .then(({ data }) => {
        setContracts((data || []) as Contract[]);
        setLoading(false);
      });
  }, [days]);

  return { contracts, loading };
};


// ─── SINGLE ──────────────────────────────────────────────────────────────────
export const useContract = (id?: string) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    supabase
      .from('contracts')
      .select(`*, tenant:tenants(*)`)
      .eq('id', id)
      .single()
      .then(({ data }) => { setContract(data as Contract | null); setLoading(false); });
  }, [id]);

  return { contract, loading };
};


// ─── MUTATIONS ───────────────────────────────────────────────────────────────
export const useContractMutations = () => {
  const createContract = async (data: ContractInsert): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const payload = { ...data, user_id: user.id };

    const { data: inserted, error } = await supabase
      .from('contracts')
      .insert([payload])
      .select('id')
      .single();
    if (error) throw error;
    return inserted.id;
  };

  const updateContract = async (id: string, data: Partial<ContractInsert>) => {
    const { error } = await supabase.from('contracts').update(data).eq('id', id);
    if (error) throw error;
  };

  const deleteContract = async (id: string) => {
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (error) throw error;
  };

  return { createContract, updateContract, deleteContract };
};
