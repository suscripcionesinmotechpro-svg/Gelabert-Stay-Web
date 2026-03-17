-- =========================================================================
-- PARCHE DE SEGURIDAD SUPABASE - GELABERT HOMES
-- =========================================================================
-- Esto arreglará las advertencias del "Security Advisor".
-- Cópialo y pégalo en el SQL Editor de tu panel de Supabase y dale a RUN.

-- 1. Arreglar "Function Search Path Mutable" en set_reference
ALTER FUNCTION public.set_reference() SET search_path = public;

-- 2. Arreglar "RLS Policy Always True" en la tabla inquiries (Para Authenticated)
DROP POLICY IF EXISTS "Allow authenticated insert to inquiries" ON public.inquiries;
CREATE POLICY "Allow authenticated insert to inquiries" ON public.inquiries
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- 3. Arreglar "RLS Policy Always True" en la tabla inquiries (Para usuarios públicos / Anon)
DROP POLICY IF EXISTS "Allow public insert to inquiries" ON public.inquiries;
CREATE POLICY "Allow public insert to inquiries" ON public.inquiries
FOR INSERT TO anon
WITH CHECK (auth.role() = 'anon');

-- 4. Arreglar "RLS Policy Always True" en la tabla properties (Para administradores / Authenticated)
DROP POLICY IF EXISTS "allow_admin_manage" ON public.properties;
CREATE POLICY "allow_admin_manage" ON public.properties
FOR ALL TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
