-- Migration: Add solvency_accepted column to inquiries table
-- Date: 2026-06-16

ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS solvency_accepted BOOLEAN;
