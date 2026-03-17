-- =======================================================
-- GELABERT HOMES — MASTER SUPABASE DATABASE SCHEMA
-- This file is 100% synchronized with the Cloud Database
-- =======================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core Data
  title TEXT NOT NULL,
  title_en TEXT,
  slug TEXT UNIQUE,
  reference TEXT UNIQUE,
  status TEXT DEFAULT 'borrador',
  commercial_status TEXT DEFAULT 'disponible',
  
  -- Characteristics
  operation TEXT NOT NULL CHECK (operation IN ('alquiler', 'venta', 'traspaso')),
  property_type TEXT NOT NULL CHECK (property_type IN ('piso', 'casa', 'atico', 'loft', 'estudio', 'local', 'oficina', 'nave', 'terreno', 'negocio', 'otro')),
  price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  
  -- Dimensions & Rooms
  area_m2 NUMERIC,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  floor TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  zone TEXT,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  street_number TEXT,
  door_number TEXT,
  block_staircase TEXT,
  urbanization TEXT,
  
  -- Descriptions (Multilingual)
  short_description TEXT,
  description TEXT,
  highlights TEXT[],
  short_description_en TEXT,
  description_en TEXT,
  highlights_en TEXT[],
  
  -- Technical & Conservation
  orientation TEXT,
  conservation_state TEXT,
  parking_included BOOLEAN DEFAULT false,
  parking_price NUMERIC,
  energy_rating TEXT,
  energy_consumption NUMERIC,
  emissions_rating TEXT,
  emissions_value NUMERIC,
  
  -- Fees
  community_fees NUMERIC,
  ibi NUMERIC,
  
  -- Multimedia
  main_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  virtual_tour_url TEXT,
  video_url TEXT,
  
  -- SEO & Meta
  meta_title TEXT,
  meta_description TEXT,
  meta_title_en TEXT,
  meta_description_en TEXT,
  
  -- Management
  featured BOOLEAN DEFAULT false,
  agent_id UUID REFERENCES auth.users(id),
  external_id TEXT
);

-- RLS & Policies
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published properties" ON public.properties;
CREATE POLICY "Public can view published properties"
  ON public.properties FOR SELECT
  USING (status = 'publicada');

DROP POLICY IF EXISTS "Authenticated users can manage all properties" ON public.properties;
CREATE POLICY "Authenticated users can manage all properties"
  ON public.properties FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Triggers
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

-- Auto-Reference Generation
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
