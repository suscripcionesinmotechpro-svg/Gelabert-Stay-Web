-- 1. Agregar relación autorreferencial para co-inquilinos
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tenants_parent ON public.tenants(parent_tenant_id);

-- 2. Agregar campos de solvencia laboral e ingresos al inquilino
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS employment_status TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS seniority_date DATE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS contract_type TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(10,2);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS annual_income NUMERIC(10,2);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS solvency_score TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ai_analysis_notes TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';

-- 3. Vincular documentos a un inquilino específico (además de al contrato)
ALTER TABLE public.tenant_documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
ALTER TABLE public.tenant_documents ALTER COLUMN contract_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_docs_tenant ON public.tenant_documents(tenant_id);

-- 4. Alterar constraint de tipo de documento en tenant_documents para admitir nuevos formatos financieros
ALTER TABLE public.tenant_documents DROP CONSTRAINT IF EXISTS tenant_documents_document_type_check;
ALTER TABLE public.tenant_documents ADD CONSTRAINT tenant_documents_document_type_check 
  CHECK (document_type IN (
    'dni', 'contrato_arrendamiento', 'documento_reserva', 'encargo_servicios', 
    'ficha_visita', 'recibo_ibi', 'recibo_comunidad', 'factura_electricidad', 
    'factura_agua', 'factura_wifi', 'nota_simple',
    'nomina', 'contrato_trabajo', 'declaracion_renta', 'modelo_autonomo', 'otro',
    'ingresos_trimestrales', 'vida_laboral', 'extracto_bancario', 'foto_perfil'
  ));
