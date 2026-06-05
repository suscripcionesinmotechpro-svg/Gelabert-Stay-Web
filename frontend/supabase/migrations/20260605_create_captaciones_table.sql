-- Migración: Crear la tabla de captaciones y sus políticas RLS
-- Archivo: 20260605_create_captaciones_table.sql

CREATE TABLE IF NOT EXISTS public.captaciones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Owner Details
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  owner_phone TEXT,
  
  -- Property Details
  property_address TEXT NOT NULL,
  property_features TEXT,
  
  -- Listing/Acquisition details
  status TEXT NOT NULL CHECK (status IN ('captado', 'visita_planificada', 'rechazado', 'seguimiento')) DEFAULT 'seguimiento',
  contact_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Management
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.captaciones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_full_access_captaciones" ON public.captaciones;
DROP POLICY IF EXISTS "agent_own_captaciones" ON public.captaciones;

-- Admin Policy: Full access
CREATE POLICY "admin_full_access_captaciones"
  ON public.captaciones FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Agent Policy: Access only to own records
CREATE POLICY "agent_own_captaciones"
  ON public.captaciones FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'agent' AND (agent_id = auth.uid() OR agent_id IS NULL))
  WITH CHECK (public.get_user_role() = 'agent' AND agent_id = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_captaciones_updated_at ON public.captaciones;
CREATE TRIGGER update_captaciones_updated_at
  BEFORE UPDATE ON public.captaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
