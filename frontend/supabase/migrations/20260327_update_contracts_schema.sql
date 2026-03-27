-- ═══════════════════════════════════════════════
--  Update Contracts and Tenant Documents Schema
-- ═══════════════════════════════════════════════

-- 1. Add exact address field to contracts
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='address') THEN
    ALTER TABLE public.contracts ADD COLUMN address text;
  END IF;
END $$;

-- 2. Update document_type check constraint to include owner-specific types
-- First, drop the old constraint by name if we know it, or find it
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'public.tenant_documents'::regclass AND contype = 'c' AND conname LIKE '%document_type%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.tenant_documents DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add the new updated constraint
ALTER TABLE public.tenant_documents 
ADD CONSTRAINT tenant_documents_document_type_check 
CHECK (document_type IN (
  'dni', 
  'contrato_arrendamiento', 
  'documento_reserva', 
  'encargo_servicios', 
  'ficha_visita', 
  'nota_simple', 
  'factura_electricidad', 
  'factura_agua', 
  'factura_wifi', 
  'recibo_ibi', 
  'recibo_comunidad', 
  'otro'
));

-- Add comment for clarity
COMMENT ON COLUMN public.contracts.address IS 'Dirección exacta del alquiler para este contrato específico';
