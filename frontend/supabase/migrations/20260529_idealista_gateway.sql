-- Migration: Add Idealista integration columns to properties table
-- Date: 2026-05-29

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS idealista_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS idealista_status VARCHAR(50) DEFAULT 'not_published',
ADD COLUMN IF NOT EXISTS idealista_error_log TEXT,
ADD COLUMN IF NOT EXISTS idealista_last_sync TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN public.properties.idealista_id IS 'Identificador único devuelto por la API de Idealista para este anuncio.';
COMMENT ON COLUMN public.properties.idealista_status IS 'Estado de la publicación en Idealista (not_published, pending, published, error).';
COMMENT ON COLUMN public.properties.idealista_error_log IS 'Log del último error devuelto por la API de Idealista.';
COMMENT ON COLUMN public.properties.idealista_last_sync IS 'Fecha y hora de la última sincronización con la API de Idealista.';
