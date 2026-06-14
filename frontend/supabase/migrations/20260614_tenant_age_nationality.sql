-- Add age and nationality columns to the tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS nationality TEXT;
