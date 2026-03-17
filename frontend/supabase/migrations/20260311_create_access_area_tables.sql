-- ============================================================
-- GELABERT HOMES — TABLAS PARA EL ÁREA DE ACCESO
-- Migración: 20260311_create_access_area_tables.sql
-- Proyecto Supabase: aumqjpqngmhpbwytpets
-- ============================================================

-- ============================================================
-- 1. FUNCIÓN AUXILIAR: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- 2. TABLA: properties (Propiedades inmobiliarias)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL,

  -- Información principal
  title         text NOT NULL,
  reference     text UNIQUE,
  operation     text NOT NULL CHECK (operation IN ('alquiler', 'venta', 'traspaso')),
  property_type text NOT NULL CHECK (property_type IN ('piso','casa','atico','local','oficina','nave','terreno','negocio','otro')),
  price         numeric(12,2),
  currency      text NOT NULL DEFAULT 'EUR',

  -- Ubicación
  city          text,
  zone          text,
  address       text,
  postal_code   text,
  latitude      double precision,
  longitude     double precision,

  -- Características
  area_m2       numeric(10,2),
  bedrooms      integer NOT NULL DEFAULT 0,
  bathrooms     integer NOT NULL DEFAULT 0,
  floor         text,
  has_elevator  boolean NOT NULL DEFAULT false,
  is_furnished  boolean NOT NULL DEFAULT false,
  has_terrace   boolean NOT NULL DEFAULT false,
  has_balcony   boolean NOT NULL DEFAULT false,
  has_parking   boolean NOT NULL DEFAULT false,
  has_storage   boolean NOT NULL DEFAULT false,
  has_pool      boolean NOT NULL DEFAULT false,
  property_condition text,
  availability  text,

  -- Contenido
  short_description text,
  description   text,
  highlights    text[],
  tags          text[],

  -- Multimedia
  main_image    text,
  gallery       text[],
  video_url     text,
  floor_plan    text,

  -- SEO
  slug          text UNIQUE,
  meta_title    text,
  meta_description text,

  -- Estado
  status        text NOT NULL DEFAULT 'borrador'
    CHECK (status IN ('borrador','publicada','reservada','alquilada','vendida','traspasada','oculta')),
  is_featured   boolean NOT NULL DEFAULT false
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS properties_updated_at ON public.properties;
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_properties_status    ON public.properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_operation ON public.properties (operation);
CREATE INDEX IF NOT EXISTS idx_properties_type      ON public.properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_city      ON public.properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_featured  ON public.properties (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_properties_slug      ON public.properties (slug);

-- RLS (Row Level Security)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver propiedades publicadas
CREATE POLICY "properties_public_read" ON public.properties
  FOR SELECT USING (status = 'publicada');

-- Solo usuarios autenticados (admins) pueden ver todas y gestionar
CREATE POLICY "properties_admin_all" ON public.properties
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- 3. TABLA: profiles (Perfiles de usuarios admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,

  full_name   text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active   boolean NOT NULL DEFAULT true
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Función para crear perfil automáticamente al registrar usuario en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver y editar su propio perfil
CREATE POLICY "profiles_own_read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- ============================================================
-- 4. TABLA: contact_requests (Solicitudes de contacto / Leads)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,

  -- Datos del solicitante
  name          text NOT NULL,
  email         text NOT NULL,
  phone         text,
  message       text NOT NULL,

  -- Referencia a propiedad (opcional)
  property_id   uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  property_ref  text,

  -- Estado del lead
  status        text NOT NULL DEFAULT 'nuevo'
    CHECK (status IN ('nuevo','contactado','descartado')),
  notes         text,
  assigned_to   uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contact_requests_status      ON public.contact_requests (status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_property_id ON public.contact_requests (property_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at  ON public.contact_requests (created_at DESC);

-- RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar (formulario de contacto público)
CREATE POLICY "contact_requests_public_insert" ON public.contact_requests
  FOR INSERT WITH CHECK (true);

-- Solo admins autenticados pueden ver y gestionar
CREATE POLICY "contact_requests_admin_all" ON public.contact_requests
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- 5. TABLA: property_views (Analítica de visitas — opcional)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_views (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now() NOT NULL,

  property_id   uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  session_id    text,
  ip_hash       text,
  referrer      text,
  user_agent    text
);

CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON public.property_views (property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_created_at  ON public.property_views (created_at DESC);

-- RLS
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar visitas
CREATE POLICY "property_views_public_insert" ON public.property_views
  FOR INSERT WITH CHECK (true);

-- Solo admins pueden ver analítica
CREATE POLICY "property_views_admin_read" ON public.property_views
  FOR SELECT USING (auth.role() = 'authenticated');
