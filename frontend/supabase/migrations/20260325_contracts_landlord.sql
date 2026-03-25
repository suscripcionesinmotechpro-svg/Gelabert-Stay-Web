-- ═══════════════════════════════════════════════════════════════
--  GELABERT HOMES — Add Landlord Details to Contracts
--  Pega TODO esto en el SQL Editor de Supabase y pulsa Run
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS landlord_name text,
ADD COLUMN IF NOT EXISTS landlord_dni text,
ADD COLUMN IF NOT EXISTS landlord_email text,
ADD COLUMN IF NOT EXISTS landlord_phone text,
ADD COLUMN IF NOT EXISTS landlord_address text;

-- Notificar a postgREST que recargue el schema
NOTIFY pgrst, 'reload schema';
