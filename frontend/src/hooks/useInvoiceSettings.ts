import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { InvoiceSettings } from '../types/invoice';

export const useInvoiceSettings = () => {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();
      
      if (!error && data) {
        setSettings(data as InvoiceSettings);
      } else if (error && error.code === 'PGRST116') { // not found
        // Create default empty profile
        const { data: newData, error: insertError } = await supabase
          .from('invoice_settings')
          .insert({ user_id: userData.user.id })
          .select()
          .single();
        if (!insertError && newData) setSettings(newData as InvoiceSettings);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (updates: Partial<InvoiceSettings>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('invoice_settings')
      .update(updates)
      .eq('user_id', userData.user.id);

    if (error) throw error;
    await fetchSettings();
  };

  return { settings, loading, updateSettings };
};
