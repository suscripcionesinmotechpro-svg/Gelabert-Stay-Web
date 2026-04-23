-- Add tracking columns for properties, rooms and tenants to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id),
ADD COLUMN IF NOT EXISTS room_id uuid,
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

COMMENT ON COLUMN public.invoices.property_id IS 'Vincula la factura a una propiedad específica.';
COMMENT ON COLUMN public.invoices.room_id IS 'Vincula la factura a una habitación específica (si aplica).';
COMMENT ON COLUMN public.invoices.tenant_id IS 'Vincula la factura a un inquilino específico.';
