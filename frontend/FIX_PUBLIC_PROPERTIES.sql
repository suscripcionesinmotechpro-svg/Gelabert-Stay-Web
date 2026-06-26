-- ============================================================
-- FIX URGENTE: Restaurar acceso público a propiedades
-- El script anterior eliminó la política que permite a
-- visitantes no autenticados ver las propiedades publicadas.
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run All
-- ============================================================

-- Restaurar la política pública: visitantes ven propiedades publicadas
DROP POLICY IF EXISTS "Public can view published properties" ON public.properties;
DROP POLICY IF EXISTS "public_read_published_properties"    ON public.properties;

CREATE POLICY "Public can view published properties"
  ON public.properties FOR SELECT
  TO anon
  USING (status = 'publicada');

-- Las políticas de admin y agente ya existen del script anterior.
-- Solo se añade el acceso anónimo que faltaba.

-- Verificar las 3 políticas activas en properties:
-- SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'properties';
-- Deben aparecer:
--   1. Public can view published properties  → anon,    SELECT
--   2. admin_full_access_properties          → authenticated, ALL
--   3. agent_own_properties                  → authenticated, ALL
