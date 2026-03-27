-- =========================================================================
-- GELABERT HOMES — AÑADIR COLUMNAS FALTANTES A PROPERTIES
-- =========================================================================
-- Copia y pega esto en el SQL Editor de tu panel de Supabase y dale a RUN.
-- Esto solucionará el error al publicar propiedades.

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS title_en text,
ADD COLUMN IF NOT EXISTS description_en text,
ADD COLUMN IF NOT EXISTS heating boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS has_patio boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_exterior boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sea_views boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS pets_allowed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS air_conditioning boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS garden boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS energy_rating text,
ADD COLUMN IF NOT EXISTS energy_consumption numeric,
ADD COLUMN IF NOT EXISTS emissions_rating text,
ADD COLUMN IF NOT EXISTS emissions_value numeric,
ADD COLUMN IF NOT EXISTS conservation_state text,
ADD COLUMN IF NOT EXISTS community_fees numeric,
ADD COLUMN IF NOT EXISTS ibi numeric,
ADD COLUMN IF NOT EXISTS orientation text,
ADD COLUMN IF NOT EXISTS parking_included boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS parking_price numeric,
ADD COLUMN IF NOT EXISTS commercial_status text NOT NULL DEFAULT 'disponible' 
  CHECK (commercial_status IN ('disponible', 'reservado', 'alquilado', 'vendido', 'traspasado'));

-- Nota: Si algunas columnas ya existen, IF NOT EXISTS evitará errores.
-- Después de ejecutar esto, intenta publicar la propiedad de nuevo.
