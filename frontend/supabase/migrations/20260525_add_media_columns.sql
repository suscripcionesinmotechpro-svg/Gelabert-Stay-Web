-- ============================================================
-- GELABERT HOMES — AÑADIR COLUMNAS MULTIMEDIA A PROPERTIES
-- Migración: 20260525_add_media_columns.sql
-- ============================================================
-- Añade soporte para:
--   · Múltiples planos (floor_plans[])
--   · Tour virtual 360° (virtual_tour_url)
--   · Múltiples vídeos con metadatos (videos[], videos_metadata[])
--   · Columnas SEO en inglés
--   · Otros campos multimedia y de contenido
-- Usa IF NOT EXISTS para que sea idempotente (seguro relanzar).
-- ============================================================

ALTER TABLE public.properties
  -- Multimedia: planos
  ADD COLUMN IF NOT EXISTS floor_plans       text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS virtual_tour_url  text,

  -- Multimedia: vídeos
  ADD COLUMN IF NOT EXISTS videos            text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS videos_metadata   jsonb[]  DEFAULT '{}',

  -- Contenido adicional
  ADD COLUMN IF NOT EXISTS short_description     text,
  ADD COLUMN IF NOT EXISTS highlights_en         text[],
  ADD COLUMN IF NOT EXISTS short_description_en  text,
  ADD COLUMN IF NOT EXISTS description_en        text,
  ADD COLUMN IF NOT EXISTS title_en              text,

  -- SEO en inglés
  ADD COLUMN IF NOT EXISTS meta_title_en        text,
  ADD COLUMN IF NOT EXISTS meta_description_en  text,
  ADD COLUMN IF NOT EXISTS title_en_set         boolean DEFAULT false,

  -- Campos extra de ubicación
  ADD COLUMN IF NOT EXISTS street_number  text,
  ADD COLUMN IF NOT EXISTS door_number    text,

  -- Campos de alquiler por habitaciones
  ADD COLUMN IF NOT EXISTS rent_type     text,
  ADD COLUMN IF NOT EXISTS is_room_rental boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rooms         jsonb   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS common_areas  jsonb   DEFAULT '[]',

  -- Referencia al agente
  ADD COLUMN IF NOT EXISTS agent_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Índice en agent_id para filtros por agente
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON public.properties (agent_id);

-- Índice de texto en virtual_tour_url para saber cuáles tienen tour
CREATE INDEX IF NOT EXISTS idx_properties_has_virtual_tour
  ON public.properties (id)
  WHERE virtual_tour_url IS NOT NULL AND virtual_tour_url <> '';

-- Fin de migración
