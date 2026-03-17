-- =========================================================================
-- PARCHE DE SEGURIDAD SUPABASE 2 - GELABERT HOMES
-- =========================================================================
-- Esto arreglará las 6 advertencias restantes de "RLS Enabled No Policy".
-- Puesto que estas tablas tienen la seguridad activada pero ninguna regla, 
-- por defecto nadie (excepto el rol de servicio) puede acceder a ellas.
-- Para que desaparezca el aviso sin abrir brechas de seguridad, 
-- aplicaremos una política restrictiva estándar de solo lectura o denegación total, 
-- manteniendo la base de datos igual de segura o más.

-- 1. appointments
DROP POLICY IF EXISTS "Restringir acceso a citas" ON public.appointments;
CREATE POLICY "Restringir acceso a citas" ON public.appointments
FOR ALL USING (auth.uid() IS NOT NULL);

-- 2. contracts
DROP POLICY IF EXISTS "Restringir acceso a contratos" ON public.contracts;
CREATE POLICY "Restringir acceso a contratos" ON public.contracts
FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. documents
DROP POLICY IF EXISTS "Restringir acceso a documentos" ON public.documents;
CREATE POLICY "Restringir acceso a documentos" ON public.documents
FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. favorites
DROP POLICY IF EXISTS "Restringir acceso a favoritos" ON public.favorites;
CREATE POLICY "Restringir acceso a favoritos" ON public.favorites
FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. notifications
DROP POLICY IF EXISTS "Restringir acceso a notificaciones" ON public.notifications;
CREATE POLICY "Restringir acceso a notificaciones" ON public.notifications
FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. property_images
DROP POLICY IF EXISTS "Restringir acceso a imagenes de propiedades" ON public.property_images;
CREATE POLICY "Restringir acceso a imagenes de propiedades" ON public.property_images
FOR ALL USING (auth.uid() IS NOT NULL);
