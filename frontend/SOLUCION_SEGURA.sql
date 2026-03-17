-- =======================================================
-- GELABERT HOMES — SAFE SUPABASE DATABASE SCHEMA
-- This script is IDEMPOTENT (can be run multiple times safely)
-- It will NOT delete any existing properties or data.
-- =======================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure properties table exists with basic structure
-- (If it exists, this will do nothing)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  reference TEXT UNIQUE,
  operation TEXT NOT NULL CHECK (operation IN ('alquiler', 'venta', 'traspaso')),
  property_type TEXT NOT NULL CHECK (property_type IN ('piso', 'casa', 'atico', 'loft', 'estudio', 'local', 'oficina', 'nave', 'terreno', 'negocio', 'otro')),
  price NUMERIC,
  currency TEXT DEFAULT 'EUR'
);

-- 3. Add missing columns safely (if they don't exist)
DO $$ 
BEGIN
  -- Multimedia/SEO
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='slug') THEN
    ALTER TABLE public.properties ADD COLUMN slug TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='status') THEN
    ALTER TABLE public.properties ADD COLUMN status TEXT DEFAULT 'borrador';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='commercial_status') THEN
    ALTER TABLE public.properties ADD COLUMN commercial_status TEXT DEFAULT 'disponible';
  END IF;
  
  -- Multimedia
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='main_image') THEN
    ALTER TABLE public.properties ADD COLUMN main_image TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='gallery') THEN
    ALTER TABLE public.properties ADD COLUMN gallery TEXT[];
  END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 5. Build/Rebuild Policies safely
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can view published properties" ON public.properties;
    CREATE POLICY "Public can view published properties"
      ON public.properties FOR SELECT
      USING (status = 'publicada');

    DROP POLICY IF EXISTS "Authenticated users can manage all properties" ON public.properties;
    CREATE POLICY "Authenticated users can manage all properties"
      ON public.properties FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
END $$;

-- 6. Rebuild Triggers and Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Reference Generation (with GH- prefix)
CREATE OR REPLACE FUNCTION set_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'GH-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_reference_trigger ON public.properties;
CREATE TRIGGER generate_reference_trigger
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION set_reference();

-- 7. Sync existing data to GH- prefix (Only if it was old GS-)
UPDATE public.properties 
SET reference = REPLACE(reference, 'GS-', 'GH-')
WHERE reference LIKE 'GS-%';

-- 8. Storage Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
CREATE POLICY "Public can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Authenticated can upload property images" ON storage.objects;
CREATE POLICY "Authenticated can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- 9. Admin Maintenance (Establish admin@gelaberthomes.es)
-- (We use the user_id loop for safety)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
WHERE email = 'admin@gelaberthomes.es';
