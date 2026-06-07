-- Añadir columna de servicios a la tabla de propiedades
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS services jsonb NOT NULL DEFAULT '{}'::jsonb;
