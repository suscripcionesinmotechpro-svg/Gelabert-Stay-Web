-- =============================================================================
-- FIX: Error "Database error querying schema" para agentes
-- PROBLEMA: La politica RLS de user_profiles solo permitia ver el propio perfil.
--           Sin embargo, multiples vistas del sistema necesitan listar TODOS los
--           agentes (ej. filtros de propiedades, CRM, contratos, facturas...).
-- SOLUCION: Permitir que cualquier usuario autenticado pueda LEER todos los
--           perfiles (campos no sensibles). Solo el propio usuario puede
--           actualizar su perfil.
-- =============================================================================
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run All
-- =============================================================================

-- 1. REEMPLAZAR la politica SELECT de user_profiles
--    Antes: solo podias ver tu propio perfil (auth.uid() = id)
--    Ahora:  cualquier usuario autenticado puede leer todos los perfiles

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.user_profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- 2. Mantener la politica de UPDATE (solo puedes actualizar el tuyo)
--    (Ya existe: "Users can update own profile" con auth.uid() = id -- no se toca)

-- 3. Anadir politica INSERT para el admin
--    Permite al admin crear perfiles nuevos desde el panel
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.user_profiles;

CREATE POLICY "Admin can insert profiles"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

-- 4. Anadir politica DELETE para el admin
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.user_profiles;

CREATE POLICY "Admin can delete profiles"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- =============================================================================
-- 5. VERIFICAR / INSERTAR el perfil de Yolanda y Yasmarys
--    UUID conocido: a38b5f3a-18b7-4c74-8d99-7f5b3aabff16
-- =============================================================================

INSERT INTO public.user_profiles (id, role, agent_name)
VALUES ('a38b5f3a-18b7-4c74-8d99-7f5b3aabff16', 'agent', 'Yolanda y Yasmarys')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  agent_name = EXCLUDED.agent_name;

-- =============================================================================
-- FIN DEL SCRIPT
-- Despues de ejecutar esto, el login con Yolanda/Yasmarys debe funcionar
-- correctamente y ver solo sus propias propiedades y leads.
-- =============================================================================
