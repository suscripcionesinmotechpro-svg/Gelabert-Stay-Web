import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Landlord, LandlordInsert } from '../types/tenant';

export const useLandlords = () => {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLandlords = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('landlords')
        .select('*')
        .order('name', { ascending: true });

      if (err) throw err;
      setLandlords(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandlords();
  }, []);

  return { landlords, loading, error, refetch: fetchLandlords };
};

export const useLandlordMutations = () => {
  const createLandlord = async (data: LandlordInsert): Promise<Landlord> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('No authenticated user');

    const { data: createdData, error } = await supabase
      .from('landlords')
      .insert([{ ...data, user_id: userData.user.id }])
      .select()
      .single();

    if (error) throw error;
    return createdData;
  };

  const updateLandlord = async (id: string, data: Partial<LandlordInsert>) => {
    const { error } = await supabase
      .from('landlords')
      .update(data)
      .eq('id', id);

    if (error) throw error;
  };

  const deleteLandlord = async (id: string) => {
    const { error } = await supabase
      .from('landlords')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  return { createLandlord, updateLandlord, deleteLandlord };
};
