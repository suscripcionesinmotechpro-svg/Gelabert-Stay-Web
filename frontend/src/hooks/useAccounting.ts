import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { FixedExpense, FixedExpenseInsert } from '../types/invoice';

export const useAccounting = () => {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFixedExpenses = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('accounting_fixed_expenses')
        .select('*')
        .order('name');
      
      if (err) throw err;
      setFixedExpenses(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addFixedExpense = async (expense: FixedExpenseInsert) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user sessionFound');

    const { error: err } = await supabase
      .from('accounting_fixed_expenses')
      .insert([{ ...expense, user_id: user.id }]);
    
    if (err) throw err;
    await fetchFixedExpenses();
  };

  const updateFixedExpense = async (id: string, expense: Partial<FixedExpenseInsert>) => {
    const { error: err } = await supabase
      .from('accounting_fixed_expenses')
      .update(expense)
      .eq('id', id);
    
    if (err) throw err;
    await fetchFixedExpenses();
  };

  const deleteFixedExpense = async (id: string) => {
    const { error: err } = await supabase
      .from('accounting_fixed_expenses')
      .delete()
      .eq('id', id);
    
    if (err) throw err;
    await fetchFixedExpenses();
  };

  useEffect(() => {
    fetchFixedExpenses();
  }, []);

  return {
    fixedExpenses,
    loading,
    error,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    refetch: fetchFixedExpenses
  };
};
