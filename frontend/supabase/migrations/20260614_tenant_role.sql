-- Migration: Add tenant_type column to tenants table
-- Created at: 2026-06-14

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS tenant_type TEXT DEFAULT 'titular' CHECK (tenant_type IN ('titular', 'avalista'));
