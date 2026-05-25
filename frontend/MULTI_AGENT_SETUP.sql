-- =============================================================================
-- GELABERT HOMES — MULTI-AGENT SETUP
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run
-- IMPORTANTE: Solo añade datos, nunca borra nada existente.
-- =============================================================================

-- 1. Tabla de perfiles de usuario (roles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  agent_name TEXT NOT NULL DEFAULT 'Agente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================================================
-- 2. Función helper para obtener el rol del usuario actual
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 3. Asegurarse de que la tabla invoices tenga agent_id
-- =============================================================================
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id);

-- =============================================================================
-- 4. Asegurarse de que tenants y contracts tengan agent_id
-- =============================================================================
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id);

-- =============================================================================
-- 5. Asegurarse de que leads_crm tenga agent_id
-- =============================================================================
ALTER TABLE public.leads_crm ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id);

-- =============================================================================
-- 6. Actualizar políticas RLS en properties
--    Admin: ve todo | Agent: solo las suyas
-- =============================================================================
DROP POLICY IF EXISTS "Authenticated users can manage all properties" ON public.properties;
DROP POLICY IF EXISTS "allow_admin_manage" ON public.properties;

-- Admin ve y gestiona todo
CREATE POLICY "admin_full_access_properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Agente solo ve y gestiona sus propias propiedades
CREATE POLICY "agent_own_properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'agent' AND agent_id = auth.uid())
  WITH CHECK (public.get_user_role() = 'agent' AND agent_id = auth.uid());

-- =============================================================================
-- 7. Actualizar políticas RLS en invoices
-- =============================================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access_invoices" ON public.invoices;
DROP POLICY IF EXISTS "agent_own_invoices" ON public.invoices;

CREATE POLICY "admin_full_access_invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "agent_own_invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'agent' AND agent_id = auth.uid())
  WITH CHECK (public.get_user_role() = 'agent' AND agent_id = auth.uid());

-- =============================================================================
-- 8. Actualizar políticas RLS en tenants
-- =============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access_tenants" ON public.tenants;
DROP POLICY IF EXISTS "agent_own_tenants" ON public.tenants;

CREATE POLICY "admin_full_access_tenants"
  ON public.tenants FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "agent_own_tenants"
  ON public.tenants FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'agent' AND agent_id = auth.uid())
  WITH CHECK (public.get_user_role() = 'agent' AND agent_id = auth.uid());

-- =============================================================================
-- 9. Actualizar políticas RLS en contracts
-- =============================================================================
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access_contracts" ON public.contracts;
DROP POLICY IF EXISTS "agent_own_contracts" ON public.contracts;

CREATE POLICY "admin_full_access_contracts"
  ON public.contracts FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "agent_own_contracts"
  ON public.contracts FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'agent' AND agent_id = auth.uid())
  WITH CHECK (public.get_user_role() = 'agent' AND agent_id = auth.uid());

-- =============================================================================
-- 10. Actualizar políticas RLS en leads_crm
-- =============================================================================
ALTER TABLE public.leads_crm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_full_access_leads" ON public.leads_crm;
DROP POLICY IF EXISTS "agent_own_leads" ON public.leads_crm;

CREATE POLICY "admin_full_access_leads"
  ON public.leads_crm FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "agent_own_leads"
  ON public.leads_crm FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'agent' AND agent_id = auth.uid())
  WITH CHECK (public.get_user_role() = 'agent' AND agent_id = auth.uid());

-- =============================================================================
-- 11. INSTRUCCIONES FINALES — EJECUTAR DESPUÉS DEL SQL
-- =============================================================================
-- PASO A: Crear el usuario de Juan en Supabase:
--   Dashboard → Authentication → Users → Add User
--   Email: juan@gelaberthomes.com
--   Password: JuanGH@2025
--   (Copiar el UUID que genera Supabase para Juan)
--
-- PASO B: Insertar los perfiles de usuario:
--   Reemplaza 'UUID-DEL-ADMIN' y 'UUID-DE-JUAN' con los UUIDs reales de cada usuario.
--
-- INSERT INTO public.user_profiles (id, role, agent_name) VALUES
--   ('UUID-DEL-ADMIN', 'admin', 'Admin Principal'),
--   ('UUID-DE-JUAN',   'agent', 'Juan');
--
-- PASO C: Asignar propiedades/registros existentes al admin:
--   UPDATE public.properties SET agent_id = 'UUID-DEL-ADMIN' WHERE agent_id IS NULL;
--   UPDATE public.invoices   SET agent_id = 'UUID-DEL-ADMIN' WHERE agent_id IS NULL;
--   UPDATE public.tenants    SET agent_id = 'UUID-DEL-ADMIN' WHERE agent_id IS NULL;
--   UPDATE public.contracts  SET agent_id = 'UUID-DEL-ADMIN' WHERE agent_id IS NULL;
--   UPDATE public.leads_crm  SET agent_id = 'UUID-DEL-ADMIN' WHERE agent_id IS NULL;
-- =============================================================================
