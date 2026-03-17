-- =======================================================
-- GELABERT HOMES — SUPABASE DATABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- =======================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================================
-- PROPERTIES TABLE
-- =======================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Información principal
  title TEXT NOT NULL,
  reference TEXT UNIQUE,
  operation TEXT NOT NULL CHECK (operation IN ('alquiler', 'venta', 'traspaso')),
  property_type TEXT NOT NULL CHECK (property_type IN ('piso', 'casa', 'atico', 'local', 'oficina', 'nave', 'terreno', 'negocio', 'otro')),
  price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  
  -- Ubicación
  city TEXT,
  zone TEXT,
  address TEXT,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- Características
  area_m2 NUMERIC,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  floor TEXT,
  has_elevator BOOLEAN DEFAULT FALSE,
  is_furnished BOOLEAN DEFAULT FALSE,
  has_terrace BOOLEAN DEFAULT FALSE,
  has_balcony BOOLEAN DEFAULT FALSE,
  has_parking BOOLEAN DEFAULT FALSE,
  has_storage BOOLEAN DEFAULT FALSE,
  has_pool BOOLEAN DEFAULT FALSE,
  property_condition TEXT,
  availability TEXT,
  
  -- Contenido
  short_description TEXT,
  description TEXT,
  highlights TEXT[],
  tags TEXT[],
  
  -- Multimedia
  main_image TEXT,
  gallery TEXT[],
  video_url TEXT,
  floor_plan TEXT,
  
  -- SEO
  slug TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  
  -- Estado
  status TEXT DEFAULT 'borrador' CHECK (status IN ('borrador', 'publicada', 'reservada', 'alquilada', 'vendida', 'traspasada', 'oculta')),
  is_featured BOOLEAN DEFAULT FALSE
);

-- =======================================================
-- TRIGGER: Auto-update updated_at
-- =======================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================================================
-- AUTO-GENERATE SLUG FROM TITLE
-- =======================================================
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(
    translate(title, 'áéíóúñüÁÉÍÓÚÑÜ', 'aeiounuAEIOUNU'),
    '[^a-z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.title);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.properties WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_slug_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION set_slug();

-- Auto-generate short reference
CREATE OR REPLACE FUNCTION set_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'GH-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_reference_trigger
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION set_reference();

-- =======================================================
-- INDEXES for fast filtering
-- =======================================================
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_operation ON public.properties(operation);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_properties_featured ON public.properties(is_featured);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_zone ON public.properties(zone);
CREATE INDEX idx_properties_price ON public.properties(price);

-- =======================================================
-- ROW LEVEL SECURITY (RLS)
-- Public can read ONLY published properties
-- Authenticated users (admin) can do everything
-- =======================================================
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Public read policy: only published properties
CREATE POLICY "Public can view published properties"
  ON public.properties FOR SELECT
  USING (status = 'publicada');

-- Admin full access policy
CREATE POLICY "Authenticated users can manage all properties"
  ON public.properties FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =======================================================
-- STORAGE BUCKET for property images
-- =======================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  TRUE,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update property images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete property images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- =======================================================
-- SAMPLE DATA — Optional (Delete if you don't need it)
-- =======================================================
INSERT INTO public.properties (
  title, operation, property_type, price, currency,
  city, zone, area_m2, bedrooms, bathrooms,
  short_description, description, status, is_featured, tags
) VALUES
(
  'Villa Panorámica con Vistas al Mar',
  'venta', 'casa', 1250000, 'EUR',
  'Marbella', 'Sierra Blanca',
  350, 5, 4,
  'Impresionante villa de lujo con vistas panorámicas al Mar Mediterráneo.',
  'Villa de lujo diseñada por arquitecto reconocido, con acabados de primera calidad y vistas espectaculares al mar. Cuenta con salón de doble altura, cocina italiana, piscina infinity y jardines paisajísticos.',
  'publicada', TRUE,
  ARRAY['vistas al mar', 'piscina', 'premium', 'alta rentabilidad']
),
(
  'Ático Dúplex en el Centro',
  'alquiler', 'atico', 4500, 'EUR',
  'Málaga', 'Centro Histórico',
  180, 3, 2,
  'Precioso ático dúplex con terraza panorámica en el corazón de Málaga.',
  'Espectacular ático dúplex completamente reformado y amueblado, con terraza de 60m² con vistas a la ciudad. Acabados de lujo, domótica integrada y plaza de garaje incluida.',
  'publicada', FALSE,
  ARRAY['terraza', 'amueblado', 'reformado']
),
(
  'Local Comercial en Puerto Banús',
  'traspaso', 'local', 85000, 'EUR',
  'Marbella', 'Puerto Banús',
  120, 0, 2,
  'Local comercial en funcionamiento en la zona más exclusiva de la Costa del Sol.',
  'Traspaso de local comercial en pleno funcionamiento ubicado en el paseo marítimo de Puerto Banús. Alta afluencia de turistas, equipamiento completo incluido.',
  'publicada', TRUE,
  ARRAY[]::TEXT[]
);

-- =======================================================
-- ADMIN ACTIVATION (Run this in Supabase SQL Editor)
-- =======================================================
-- Step 1: Force confirm the user if it was already created via script
-- UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = 'admin@gelaberthomes.es';

-- Step 2: Ensure the user metadata is correct for administrative access
-- UPDATE auth.users SET raw_user_meta_data = '{"full_name": "Administrador", "role": "admin"}' WHERE email = 'admin@gelaberthomes.es';

