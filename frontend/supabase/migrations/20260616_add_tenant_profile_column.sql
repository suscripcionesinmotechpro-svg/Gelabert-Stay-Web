-- Migration: Add tenant_profile column to properties table
-- Date: 2026-06-16

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS tenant_profile text;
