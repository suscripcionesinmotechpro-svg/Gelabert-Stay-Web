import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { FixedExpense, FixedExpenseInsert, VariableCategory, VariableCategoryInsert } from '../types/invoice';

export const useAccounting = () => {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [variableCategories, setVariableCategories] = useState<VariableCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      const { data: fixed, error: fixedErr } = await supabase
        .from('accounting_fixed_expenses')
        .select('*')
        .order('name');
      
      if (fixedErr) throw fixedErr;
      setFixedExpenses(fixed || []);

      const { data: variable, error: variableErr } = await supabase
        .from('accounting_variable_categories')
        .select('*')
        .order('name');
      
      if (variableErr) throw variableErr;
      setVariableCategories(variable || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addFixedExpense = async (expense: FixedExpenseInsert) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user session found');

    const { error: err } = await supabase
      .from('accounting_fixed_expenses')
      .insert([{ 
        ...expense, 
        user_id: user.id,
        frequency: expense.frequency || 'monthly',
        is_variable: expense.is_variable ?? false
      }]);
    
    if (err) throw err;
    await fetchAccountingData();
  };

  const updateFixedExpense = async (id: string, expense: Partial<FixedExpenseInsert>) => {
    const { error: err } = await supabase
      .from('accounting_fixed_expenses')
      .update(expense)
      .eq('id', id);
    
    if (err) throw err;
    await fetchAccountingData();
  };

  const deleteFixedExpense = async (id: string) => {
    const { error: err } = await supabase
      .from('accounting_fixed_expenses')
      .delete()
      .eq('id', id);
    
    if (err) throw err;
    await fetchAccountingData();
  };

  const addVariableCategory = async (category: VariableCategoryInsert) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user session found');

    const { error: err } = await supabase
      .from('accounting_variable_categories')
      .insert([{ 
        ...category, 
        user_id: user.id
      }]);
    
    if (err) throw err;
    await fetchAccountingData();
  };

  const updateVariableCategory = async (id: string, category: Partial<VariableCategoryInsert>) => {
    const { error: err } = await supabase
      .from('accounting_variable_categories')
      .update(category)
      .eq('id', id);
    
    if (err) throw err;
    await fetchAccountingData();
  };

  const deleteVariableCategory = async (id: string) => {
    const { error: err } = await supabase
      .from('accounting_variable_categories')
      .delete()
      .eq('id', id);
    
    if (err) throw err;
    await fetchAccountingData();
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  return {
    fixedExpenses,
    variableCategories,
    loading,
    error,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    addVariableCategory,
    updateVariableCategory,
    deleteVariableCategory,
    refetch: fetchAccountingData
  };
};
