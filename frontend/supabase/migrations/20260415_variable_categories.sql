-- Migración para soportar categorías de gasto variable puntuales

-- Crear tabla de categorías de gasto variable
CREATE TABLE IF NOT EXISTS public.accounting_variable_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    default_amount NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME zone DEFAULT now(),
    updated_at TIMESTAMP WITH TIME zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.accounting_variable_categories ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuarios pueden ver sus propias categorías variables"
    ON public.accounting_variable_categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias categorías variables"
    ON public.accounting_variable_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias categorías variables"
    ON public.accounting_variable_categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias categorías variables"
    ON public.accounting_variable_categories FOR DELETE
    USING (auth.uid() = user_id);

-- Añadir relación en la tabla de facturas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'variable_category_id') THEN
        ALTER TABLE public.invoices ADD COLUMN variable_category_id UUID REFERENCES public.accounting_variable_categories(id);
    END IF;
END $$;

-- Comentarios
COMMENT ON TABLE public.accounting_variable_categories IS 'Categorías para gastos variables puntuales (compras, materiales, etc.)';
COMMENT ON COLUMN public.invoices.variable_category_id IS 'Vincula la factura a una categoría de gasto variable específica.';
