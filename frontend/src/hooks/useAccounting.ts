import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { FixedExpense, FixedExpenseInsert, VariableCategory, VariableCategoryInsert, VariableMonthlyEntry } from '../types/invoice';

export const useAccounting = () => {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [variableCategories, setVariableCategories] = useState<VariableCategory[]>([]);
  const [variableMonthlyEntries, setVariableMonthlyEntries] = useState<VariableMonthlyEntry[]>([]);
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

      // Load last 12 months of variable entries
      const { data: monthly, error: monthlyErr } = await supabase
        .from('accounting_variable_monthly')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (monthlyErr) throw monthlyErr;
      setVariableMonthlyEntries(monthly || []);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Fixed Expenses ────────────────────────────────────────────────

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

  // ─── Variable Categories (legacy, kept for compatibility) ──────────

  const addVariableCategory = async (category: VariableCategoryInsert) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user session found');

    const { error: err } = await supabase
      .from('accounting_variable_categories')
      .insert([{ ...category, user_id: user.id }]);
    
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

  // ─── Variable Monthly Entries ──────────────────────────────────────
  // Records the actual cost of a variable expense for a specific month.
  // Uses upsert so editing an existing month entry works seamlessly.

  const upsertVariableMonthlyEntry = async (
    fixedExpenseId: string,
    year: number,
    month: number,
    actualAmount: number,
    notes?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user session found');

    const { error: err } = await supabase
      .from('accounting_variable_monthly')
      .upsert({
        user_id: user.id,
        fixed_expense_id: fixedExpenseId,
        year,
        month,
        actual_amount: actualAmount,
        notes: notes || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'fixed_expense_id,year,month' });
    
    if (err) throw err;
    await fetchAccountingData();
  };

  const deleteVariableMonthlyEntry = async (id: string) => {
    const { error: err } = await supabase
      .from('accounting_variable_monthly')
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
    variableMonthlyEntries,
    loading,
    error,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    addVariableCategory,
    updateVariableCategory,
    deleteVariableCategory,
    upsertVariableMonthlyEntry,
    deleteVariableMonthlyEntry,
    refetch: fetchAccountingData
  };
};
