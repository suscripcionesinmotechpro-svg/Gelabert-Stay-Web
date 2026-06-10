import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Captacion, CaptacionInsert, CaptacionHistory, CaptacionHistoryAction } from '../types/captacion';
import { CAPTACION_STATUS_LABELS } from '../types/captacion';

// ─── useCaptaciones ─────────────────────────────────────────────────────────
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

    const channel = supabase
      .channel('captaciones_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captaciones' }, () => {
        fetchCaptaciones();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchCaptaciones]);

  return { captaciones, loading, error, refetch: fetchCaptaciones };
};

// ─── useCaptacion (single) ──────────────────────────────────────────────────
export const useCaptacion = (id?: string) => {
  const [captacion, setCaptacion] = useState<Captacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
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

// ─── useCaptacionHistory ────────────────────────────────────────────────────
export const useCaptacionHistory = (captacionId: string | null) => {
  const [history, setHistory] = useState<CaptacionHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!captacionId) return;
    setLoading(true);
    const { data } = await supabase
      .from('captaciones_history')
      .select('*')
      .eq('captacion_id', captacionId)
      .order('created_at', { ascending: false });
    setHistory((data as CaptacionHistory[]) || []);
    setLoading(false);
  }, [captacionId]);

  useEffect(() => {
    fetchHistory();

    if (!captacionId) return;
    const channel = supabase
      .channel(`captaciones_history_${captacionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'captaciones_history',
        filter: `captacion_id=eq.${captacionId}`,
      }, () => fetchHistory())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [captacionId, fetchHistory]);

  return { history, loading };
};

// ─── logCaptacionActivity ───────────────────────────────────────────────────
export const logCaptacionActivity = async (
  captacionId: string,
  action: CaptacionHistoryAction,
  description: string,
  agentName?: string,
  oldValue?: string,
  newValue?: string,
) => {
  await supabase.from('captaciones_history').insert({
    captacion_id: captacionId,
    agent_name: agentName || null,
    action,
    description,
    old_value: oldValue || null,
    new_value: newValue || null,
  });
};

// ─── useCaptacionesMutations ────────────────────────────────────────────────
export const useCaptacionesMutations = () => {

  // Helper to get current user's agent name
  const getAgentName = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Sistema';
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agent_name')
      .eq('id', user.id)
      .maybeSingle();
    return profile?.agent_name || user.email || 'Agente';
  };

  const createCaptacion = async (data: CaptacionInsert): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const payload = { ...data, agent_id: data.agent_id || user.id };

    const { data: inserted, error } = await supabase
      .from('captaciones')
      .insert([payload])
      .select('id')
      .single();
    if (error) throw error;

    const agentName = await getAgentName();
    await logCaptacionActivity(
      inserted.id,
      'created',
      `Captación creada por ${agentName}`,
      agentName,
    );

    return inserted.id;
  };

  const updateCaptacion = async (
    id: string,
    data: Partial<CaptacionInsert>,
    currentCaptacion?: Captacion,
  ) => {
    const agentName = await getAgentName();

    const { error } = await supabase.from('captaciones').update(data).eq('id', id);
    if (error) throw error;

    // Log specific actions with meaningful descriptions
    if (data.status !== undefined && currentCaptacion?.status !== data.status) {
      const oldLabel = currentCaptacion ? CAPTACION_STATUS_LABELS[currentCaptacion.status] : '';
      const newLabel = CAPTACION_STATUS_LABELS[data.status as keyof typeof CAPTACION_STATUS_LABELS] || data.status;
      await logCaptacionActivity(id, 'status_changed',
        `Estado cambiado de "${oldLabel}" a "${newLabel}"`,
        agentName, oldLabel, newLabel);
    }

    if (data.follow_up_date !== undefined) {
      await logCaptacionActivity(id, 'follow_up_set',
        data.follow_up_date
          ? `Seguimiento programado para el ${data.follow_up_date}`
          : 'Seguimiento eliminado',
        agentName, currentCaptacion?.follow_up_date || undefined, data.follow_up_date || undefined);
    }

    if (data.visit_date !== undefined && currentCaptacion?.visit_date !== data.visit_date) {
      await logCaptacionActivity(id, 'visit_scheduled',
        data.visit_date
          ? `Visita programada para el ${new Date(data.visit_date).toLocaleString('es-ES')}`
          : 'Visita cancelada',
        agentName);
    }

    if (data.notes !== undefined && currentCaptacion?.notes !== data.notes) {
      await logCaptacionActivity(id, 'note_added',
        'Notas internas actualizadas', agentName);
    }

    if (data.agent_id !== undefined && currentCaptacion?.agent_id !== data.agent_id) {
      await logCaptacionActivity(id, 'agent_assigned',
        `Agente asignado cambiado`, agentName,
        currentCaptacion?.agent_id || undefined, data.agent_id || undefined);
    }
  };

  const deleteCaptacion = async (id: string) => {
    const { error } = await supabase.from('captaciones').delete().eq('id', id);
    if (error) throw error;
  };

  return { createCaptacion, updateCaptacion, deleteCaptacion };
};
