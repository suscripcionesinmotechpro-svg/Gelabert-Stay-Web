-- Migración: 20260416_variable_monthly_entries.sql
-- Tabla para registrar importes reales de gastos variables mes a mes

CREATE TABLE IF NOT EXISTS public.accounting_variable_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fixed_expense_id UUID REFERENCES public.accounting_fixed_expenses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    actual_amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(fixed_expense_id, year, month)
);

-- Habilitar RLS
ALTER TABLE public.accounting_variable_monthly ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (solo el dueño puede ver/modificar sus registros)
CREATE POLICY "Users can select own variable monthly entries"
    ON public.accounting_variable_monthly FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own variable monthly entries"
    ON public.accounting_variable_monthly FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own variable monthly entries"
    ON public.accounting_variable_monthly FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own variable monthly entries"
    ON public.accounting_variable_monthly FOR DELETE
    USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE public.accounting_variable_monthly IS 'Importes reales mes a mes para gastos variables (luz, agua, etc.)';
COMMENT ON COLUMN public.accounting_variable_monthly.actual_amount IS 'Importe real gastado ese mes. Reemplaza el importe estimado del gasto fijo.';
