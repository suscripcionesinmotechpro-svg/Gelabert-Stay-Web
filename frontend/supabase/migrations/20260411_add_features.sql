-- Migración para añadir armarios empotrados y chimenea
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS has_wardrobes boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_fireplace boolean DEFAULT false;
