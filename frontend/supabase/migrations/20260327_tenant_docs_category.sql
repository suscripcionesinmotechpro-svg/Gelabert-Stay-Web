-- ═══════════════════════════════════════════════════════════════
--  GELABERT HOMES — Separar Documentación Inquilino / Propietario
-- ═══════════════════════════════════════════════════════════════

-- 1. Añadir columna category a tenant_documents
ALTER TABLE public.tenant_documents 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'tenant' 
CHECK (category IN ('tenant', 'owner'));

-- 2. Actualizar tipos de documentos existentes (opcional pero recomendado)
-- Por ahora los tipos existentes (dni, contrato, etc) se quedan en 'tenant' por defecto.

-- 3. Recargar schema de postgREST
NOTIFY pgrst, 'reload schema';
