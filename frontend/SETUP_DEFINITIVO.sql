-- ============================================================
-- GELABERT HOMES — SQL DEFINITIVO DE AISLAMIENTO POR AGENTE
-- ============================================================
-- Qué hace este script:
--   1. Elimina a Juan (agente) — sus datos pasan al Admin
--   2. Crea/confirma el perfil de Yolanda y Yasmarys
--   3. Corrige políticas RLS para que:
--      - Agentes: ven SOLO sus propias cosas
--      - Admin: ve y controla ABSOLUTAMENTE TODO
--   4. Arregla el error "Database error querying schema"
-- ============================================================
-- EJECUTAR en: Supabase → SQL Editor → New Query → Run All
-- ============================================================


-- ==============================================================
-- PASO 1: LOCALIZAR IDs IMPORTANTES
-- ==============================================================

DO 
DECLARE
  v_juan_id   UUID;
  v_admin_id  UUID;
BEGIN
  -- Buscar a Juan por nombre en user_profiles
  SELECT id INTO v_juan_id
    FROM public.user_profiles
   WHERE agent_name ILIKE '%Juan%' AND role = 'agent'
   LIMIT 1;

  -- Buscar al Admin
  SELECT id INTO v_admin_id
    FROM public.user_profiles
   WHERE role = 'admin'
   LIMIT 1;

  RAISE NOTICE 'Juan ID: %, Admin ID: %', v_juan_id, v_admin_id;

  IF v_juan_id IS NOT NULL AND v_admin_id IS NOT NULL THEN

    -- Reasignar todas las propiedades de Juan al Admin
    UPDATE public.properties   SET agent_id = v_admin_id WHERE agent_id = v_juan_id;
    UPDATE public.leads_crm    SET agent_id = v_admin_id WHERE agent_id = v_juan_id;
    UPDATE public.tenants      SET agent_id = v_admin_id WHERE agent_id = v_juan_id;
    UPDATE public.contracts    SET agent_id = v_admin_id WHERE agent_id = v_juan_id;
    UPDATE public.invoices     SET agent_id = v_admin_id WHERE agent_id = v_juan_id;

    -- Eliminar el perfil de Juan (auth.users se borra por CASCADE si existe FK)
    DELETE FROM public.user_profiles WHERE id = v_juan_id;
    DELETE FROM auth.users            WHERE id = v_juan_id;

    RAISE NOTICE 'Juan eliminado. Sus datos fueron transferidos al Admin.';
  ELSE
    RAISE NOTICE 'Juan no encontrado (puede que ya haya sido eliminado). Admin ID: %', v_admin_id;
  END IF;
END ;


-- ==============================================================
-- PASO 2: CREAR / CONFIRMAR EL PERFIL DE YOLANDA Y YASMARYS
-- ==============================================================

INSERT INTO public.user_profiles (id, role, agent_name)
VALUES ('a38b5f3a-18b7-4c74-8d99-7f5b3aabff16', 'agent', 'Yolanda y Yasmarys')
ON CONFLICT (id) DO UPDATE SET
  role       = EXCLUDED.role,
  agent_name = EXCLUDED.agent_name;


-- ==============================================================
-- PASO 3: POLÍTICA RLS DE user_profiles
-- Cualquier usuario autenticado puede VER todos los perfiles
-- (necesario para los filtros del sistema)
-- Solo puedes ACTUALIZAR el tuyo propio
-- Solo el Admin puede INSERTAR o ELIMINAR perfiles
-- ==============================================================

DROP POLICY IF EXISTS "Users can view own profile"                ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can insert profiles"                 ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can delete profiles"                 ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile"              ON public.user_profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin can insert profiles"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admin can delete profiles"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');


-- ==============================================================
-- PASO 4: POLÍTICAS RLS — PROPERTIES
-- Admin: ve y gestiona todo
-- Agente: solo ve y gestiona las suyas (agent_id = su UID)
-- ==============================================================

DROP POLICY IF EXISTS "admin_full_access_properties"              ON public.properties;
DROP POLICY IF EXISTS "agent_own_properties"                      ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can manage all properties" ON public.properties;
DROP POLICY IF EXISTS "allow_admin_manage"                        ON public.properties;

CREATE POLICY "admin_full_access_properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "agent_own_properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'agent' AND agent_id = auth.uid())
  WITH CHECK (public.get_user_role() = 'agent' AND agent_id = auth.uid());


-- ==============================================================
-- PASO 5: POLÍTICAS RLS — LEADS_CRM
-- ==============================================================

ALTER TABLE public.leads_crm ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_leads" ON public.leads_crm;
DROP POLICY IF EXISTS "agent_own_leads"         ON public.leads_crm;

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


-- ==============================================================
-- PASO 6: POLÍTICAS RLS — TENANTS
-- ==============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_tenants" ON public.tenants;
DROP POLICY IF EXISTS "agent_own_tenants"          ON public.tenants;

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


-- ==============================================================
-- PASO 7: POLÍTICAS RLS — CONTRACTS
-- ==============================================================

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_contracts" ON public.contracts;
DROP POLICY IF EXISTS "agent_own_contracts"          ON public.contracts;

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


-- ==============================================================
-- PASO 8: POLÍTICAS RLS — INVOICES
-- ==============================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_full_access_invoices" ON public.invoices;
DROP POLICY IF EXISTS "agent_own_invoices"          ON public.invoices;

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


-- ==============================================================
-- PASO 9: POLÍTICAS RLS — CAPTACIONES (si existe)
-- ==============================================================

DO 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'captaciones') THEN
    EXECUTE 'ALTER TABLE public.captaciones ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "admin_full_access_captaciones" ON public.captaciones';
    EXECUTE 'DROP POLICY IF EXISTS "agent_own_captaciones" ON public.captaciones';
    EXECUTE '
      CREATE POLICY "admin_full_access_captaciones"
        ON public.captaciones FOR ALL TO authenticated
        USING (public.get_user_role() = ''admin'')
        WITH CHECK (public.get_user_role() = ''admin'')
    ';
    EXECUTE '
      CREATE POLICY "agent_own_captaciones"
        ON public.captaciones FOR ALL TO authenticated
        USING (public.get_user_role() = ''agent'' AND agent_id = auth.uid())
        WITH CHECK (public.get_user_role() = ''agent'' AND agent_id = auth.uid())
    ';
    RAISE NOTICE 'Políticas RLS aplicadas a captaciones.';
  ELSE
    RAISE NOTICE 'Tabla captaciones no encontrada, se omite.';
  END IF;
END ;


-- ==============================================================
-- PASO 10: ASEGURAR que el trigger set_reference asigna agent_id
-- ==============================================================

CREATE OR REPLACE FUNCTION public.set_reference()
RETURNS TRIGGER AS 
BEGIN
  -- Auto-generar referencia si viene vacía
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'GH-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  END IF;

  -- Auto-asignar agent_id en INSERT si viene nulo
  IF TG_OP = 'INSERT' AND NEW.agent_id IS NULL THEN
    NEW.agent_id := auth.uid();
  END IF;

  -- Proteger agent_id en UPDATE
  IF TG_OP = 'UPDATE' THEN
    IF public.get_user_role() = 'agent' THEN
      NEW.agent_id := OLD.agent_id;
    ELSIF NEW.agent_id IS NULL THEN
      NEW.agent_id := OLD.agent_id;
    END IF;
  END IF;

  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================
-- VERIFICACIÓN FINAL — ejecuta esta query para confirmar
-- ==============================================================
-- SELECT id, role, agent_name FROM public.user_profiles ORDER BY role;
-- (Deben aparecer solo 2 filas: admin + Yolanda y Yasmarys)

-- ==============================================================
-- FIN DEL SCRIPT
-- Usuarios resultantes:
--   - Admin (José Carlos Delgado): ve y controla TODO
--   - Yolanda y Yasmarys (agente): ve y gestiona SOLO sus cosas
-- ==============================================================
