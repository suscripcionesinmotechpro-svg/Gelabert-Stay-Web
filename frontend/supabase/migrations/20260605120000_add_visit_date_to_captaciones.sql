-- Migration: Add visit_date column to captaciones
-- Archivo: 20260605120000_add_visit_date_to_captaciones.sql

ALTER TABLE public.captaciones ADD COLUMN IF NOT EXISTS visit_date TIMESTAMPTZ;
