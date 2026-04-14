import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { InvoiceIssuer, InvoiceIssuerInsert } from '../types/invoice';

export const useIssuers = () => {
  const [issuers, setIssuers] = useState<InvoiceIssuer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssuers = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_issuers')
        .select('*')
        .order('name', { ascending: true });
      
      if (!error && data) {
        setIssuers(data as InvoiceIssuer[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuers();
  }, []);

  const createIssuer = async (issuer: InvoiceIssuerInsert) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    if (issuer.is_default) {
      // Unset other defaults if this is the new default
      await supabase
        .from('invoice_issuers')
        .update({ is_default: false })
        .eq('user_id', userData.user.id);
    }

    const { data, error } = await supabase
      .from('invoice_issuers')
      .insert({ ...issuer, user_id: userData.user.id })
      .select()
      .single();

    if (error) throw error;
    await fetchIssuers();
    return data as InvoiceIssuer;
  };

  const updateIssuer = async (id: string, issuer: Partial<InvoiceIssuerInsert>) => {
    const { error } = await supabase
      .from('invoice_issuers')
      .update(issuer)
      .eq('id', id);

    if (error) throw error;
    await fetchIssuers();
  };

  const deleteIssuer = async (id: string) => {
    const { error } = await supabase
      .from('invoice_issuers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchIssuers();
  };

  return { issuers, loading, createIssuer, updateIssuer, deleteIssuer, refetch: fetchIssuers };
};
