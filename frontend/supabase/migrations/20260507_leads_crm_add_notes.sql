-- Add notes column to leads_crm for GelaBot to store conversation summary
ALTER TABLE leads_crm ADD COLUMN IF NOT EXISTS notes TEXT;
