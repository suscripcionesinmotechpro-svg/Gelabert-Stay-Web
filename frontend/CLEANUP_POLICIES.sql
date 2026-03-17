-- =======================================================
-- CLEANUP & REBUILD POLICIES (Resolving "querying schema" error)
-- =======================================================

-- 1. Eliminar absolutamente todas las políticas de properties para limpiar basura
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'properties' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', pol.policyname);
    END LOOP;
END $$;

-- 2. Recrear políticas limpias y únicas
-- Política para el público (LECTURA)
CREATE POLICY "allow_public_view" 
  ON public.properties FOR SELECT 
  USING (status = 'publicada');

-- Política para administradores (TODO)
CREATE POLICY "allow_admin_manage" 
  ON public.properties FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Forzar recarga del caché de API
NOTIFY pgrst, 'reload schema';
