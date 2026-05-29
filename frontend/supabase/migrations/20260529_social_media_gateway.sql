-- Migration: Social Media Gateway (Facebook & Instagram)
-- Date: 2026-05-29
-- Adds columns to track publication state, post IDs, and sync status for FB/IG.
-- Also creates a unique identifier to prevent duplicates.

-- ── 1. Add Social Media columns ──────────────────────────────────────────────

ALTER TABLE public.properties
  -- Facebook
  ADD COLUMN IF NOT EXISTS facebook_post_id     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS facebook_status      VARCHAR(50)  DEFAULT 'not_published',
  ADD COLUMN IF NOT EXISTS facebook_error_log   TEXT,
  ADD COLUMN IF NOT EXISTS facebook_last_sync   TIMESTAMPTZ,
  -- Instagram
  ADD COLUMN IF NOT EXISTS instagram_post_id    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS instagram_status     VARCHAR(50)  DEFAULT 'not_published',
  ADD COLUMN IF NOT EXISTS instagram_error_log  TEXT,
  ADD COLUMN IF NOT EXISTS instagram_last_sync  TIMESTAMPTZ,
  -- Unique social identifier (used to detect duplicates across platforms)
  ADD COLUMN IF NOT EXISTS social_unique_id     VARCHAR(100);

-- Generate unique social_unique_id for existing rows that don't have one
UPDATE public.properties
SET social_unique_id = 'GH-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE social_unique_id IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.properties.facebook_post_id    IS 'ID del post en la página de Facebook. Usado para actualizar o borrar el anuncio.';
COMMENT ON COLUMN public.properties.facebook_status     IS 'Estado de publicación en Facebook: not_published | pending | published | error';
COMMENT ON COLUMN public.properties.facebook_error_log  IS 'Último error devuelto por la API de Facebook Graph.';
COMMENT ON COLUMN public.properties.facebook_last_sync  IS 'Fecha y hora de la última sincronización con Facebook.';
COMMENT ON COLUMN public.properties.instagram_post_id   IS 'ID del post en Instagram. Usado para actualizar o borrar el anuncio.';
COMMENT ON COLUMN public.properties.instagram_status    IS 'Estado de publicación en Instagram: not_published | pending | published | error';
COMMENT ON COLUMN public.properties.instagram_error_log IS 'Último error devuelto por la API de Instagram Graph.';
COMMENT ON COLUMN public.properties.instagram_last_sync IS 'Fecha y hora de la última sincronización con Instagram.';
COMMENT ON COLUMN public.properties.social_unique_id    IS 'Identificador único para redes sociales con formato GH-XXXXXXXX. Previene publicaciones duplicadas.';

-- ── 2. Create trigger function that fires on ANY commercial status change ──────

CREATE OR REPLACE FUNCTION public.on_social_media_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act on commercial_status changes (or new publications)
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.commercial_status IS DISTINCT FROM NEW.commercial_status) THEN
    -- Ensure the social_unique_id is set on new records
    IF NEW.social_unique_id IS NULL THEN
      NEW.social_unique_id := 'GH-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS tr_social_media_sync ON public.properties;

-- Create the trigger
CREATE TRIGGER tr_social_media_sync
  BEFORE INSERT OR UPDATE OF commercial_status, status
  ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.on_social_media_sync();

-- ── 3. Add index for efficient lookups ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_properties_facebook_status
  ON public.properties(facebook_status)
  WHERE facebook_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_instagram_status
  ON public.properties(instagram_status)
  WHERE instagram_status IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_social_unique_id
  ON public.properties(social_unique_id)
  WHERE social_unique_id IS NOT NULL;
