-- ============================================================
-- REFORZAR UNICIDAD EN REFERENCIAS DE PROPIEDADES
-- Migración: 20260331_enforce_unique_reference.sql
-- ============================================================

-- 1. Eliminar cualquier duplicado accidental (ya se hizo manualmente para GEL-102, 
-- pero esto previene fallos si la migración se corre en otro entorno)
-- Nota: En un entorno real, aquí se decidiría qué registro borrar.

-- 2. Asegurar que la restricción UNIQUE existe y es efectiva
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'properties_reference_key'
    ) THEN
        ALTER TABLE public.properties ADD CONSTRAINT properties_reference_key UNIQUE (reference);
    END IF;
END $$;
