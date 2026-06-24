-- Migration: Add source, target_property_id, and target_property_ref columns to leads_crm table
ALTER TABLE leads_crm
  ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS target_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_property_ref VARCHAR;
