-- Update property_type check constraint to include 'habitacion'
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_property_type_check;

ALTER TABLE public.properties 
ADD CONSTRAINT properties_property_type_check 
CHECK (property_type IN ('piso', 'casa', 'habitacion', 'estudio', 'duplex', 'atico', 'loft', 'planta_baja', 'local', 'oficina', 'nave', 'garaje', 'trastero', 'terreno', 'edificio', 'negocio', 'otro'));

-- Add common_areas column for granular media management in room rentals
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS common_areas JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.properties.common_areas IS 'Detailed media and info for common areas in individual room rentals (habitacion type)';
