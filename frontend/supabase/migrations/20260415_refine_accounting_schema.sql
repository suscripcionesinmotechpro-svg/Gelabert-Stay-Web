-- Migración: 20260415_refine_accounting_schema.sql
-- Añadir soporte para frecuencias, rangos de días y marca de gasto variable

ALTER TABLE public.accounting_fixed_expenses 
ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'semiannual', 'annual')),
ADD COLUMN IF NOT EXISTS day_of_month_end integer CHECK (day_of_month_end BETWEEN 1 AND 31),
ADD COLUMN IF NOT EXISTS is_variable boolean DEFAULT false;

-- Comentario para documentación
COMMENT ON COLUMN public.accounting_fixed_expenses.frequency IS 'Frecuencia del gasto: mensual, trimestral, semestral o anual';
COMMENT ON COLUMN public.accounting_fixed_expenses.day_of_month_end IS 'Día final del rango de pago (si es un rango)';
COMMENT ON COLUMN public.accounting_fixed_expenses.is_variable IS 'Identifica si el gasto es de importe variable (ej: suministros)';
