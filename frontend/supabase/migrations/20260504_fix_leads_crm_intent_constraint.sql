-- Fix leads_crm intent constraint to allow 'alquilar_propietario' and 'indefinido'
ALTER TABLE leads_crm DROP CONSTRAINT IF EXISTS leads_crm_intent_check;
ALTER TABLE leads_crm ADD CONSTRAINT leads_crm_intent_check CHECK (intent = ANY (ARRAY['alquilar'::text, 'comprar'::text, 'vender'::text, 'alquilar_propietario'::text, 'indefinido'::text]));
