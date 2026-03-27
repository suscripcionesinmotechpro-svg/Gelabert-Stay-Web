-- ═══════════════════════════════════════════════════════════════
--  GELABERT HOMES — Mejora de RLS (Valores por defecto de user_id)
--  Pega esto en el SQL Editor de Supabase y pulsa Run
-- ═══════════════════════════════════════════════════════════════

-- 1. Añadir default auth.uid() a tenants (si no lo tiene)
ALTER TABLE public.tenants 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Añadir default auth.uid() a contracts (si no lo tiene)
ALTER TABLE public.contracts 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. Añadir default auth.uid() a tenant_documents (si no lo tiene)
ALTER TABLE public.tenant_documents 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. Opcional: Recargar schema de postgREST
NOTIFY pgrst, 'reload schema';
