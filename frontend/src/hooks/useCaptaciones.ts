import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Captacion, CaptacionInsert } from '../types/captacion';

export const useCaptaciones = (agentId?: string) => {
  const [captaciones, setCaptaciones] = useState<Captacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCaptaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('captaciones')
        .select('*')
        .order('contact_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setCaptaciones(data as Captacion[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchCaptaciones();

    // Subscribe to realtime changes on the captaciones table
    const channel = supabase
      .channel('captaciones_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'captaciones',
        },
        () => {
          fetchCaptaciones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCaptaciones]);

  return { captaciones, loading, error, refetch: fetchCaptaciones };
};

export const useCaptacion = (id?: string) => {
  const [captacion, setCaptacion] = useState<Captacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    supabase
      .from('captaciones')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setCaptacion(data as Captacion | null);
        setLoading(false);
      });
  }, [id]);

  return { captacion, loading };
};

export const useCaptacionesMutations = () => {
  const createCaptacion = async (data: CaptacionInsert): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Default to the current logged-in user if agent_id is null
    const payload = { ...data, agent_id: data.agent_id || user.id };

    const { data: inserted, error } = await supabase
      .from('captaciones')
      .insert([payload])
      .select('id')
      .single();
    if (error) throw error;
    return inserted.id;
  };

  const updateCaptacion = async (id: string, data: Partial<CaptacionInsert>) => {
    const { error } = await supabase.from('captaciones').update(data).eq('id', id);
    if (error) throw error;
  };

  const deleteCaptacion = async (id: string) => {
    const { error } = await supabase.from('captaciones').delete().eq('id', id);
    if (error) throw error;
  };

  return { createCaptacion, updateCaptacion, deleteCaptacion };
};
