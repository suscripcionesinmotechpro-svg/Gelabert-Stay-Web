-- ═══════════════════════════════════════════════════════════════
--  GELABERT HOMES — Tenant Management Module
--  Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TENANTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Personal data
  first_name   text NOT NULL,
  last_name    text NOT NULL,
  dni          text,
  email        text,
  phone        text,
  address      text,
  zip_code     text,
  city         text,
  country      text DEFAULT 'España',
  notes        text,

  -- Computed / cached for listing
  avatar_color text DEFAULT '#C9A962'
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_owner" ON public.tenants
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── 2. CONTRACTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contracts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id     uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  property_label  text, -- cached name in case property is deleted

  -- Contract period
  start_date      date NOT NULL,
  end_date        date NOT NULL,

  -- Financials
  monthly_rent    numeric(10, 2),
  deposit         numeric(10, 2),
  currency        text DEFAULT 'EUR',

  -- Metadata
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'expired', 'cancelled')),
  notes           text
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_owner" ON public.contracts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── 3. TENANT DOCUMENTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_at    timestamptz NOT NULL DEFAULT now(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  contract_id    uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,

  document_type  text NOT NULL
                   CHECK (document_type IN (
                     'dni',
                     'contrato_arrendamiento',
                     'documento_reserva',
                     'encargo_servicios',
                     'ficha_visita',
                     'otro'
                   )),

  file_name      text NOT NULL,
  file_url       text NOT NULL,
  file_path      text NOT NULL  -- for storage deletion
);

ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_docs_owner" ON public.tenant_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── 4. STORAGE BUCKET ──────────────────────────────────────────────────────
-- Run this only if the bucket does not already exist.
-- Alternatively, create it manually in Storage → New Bucket → "tenant-docs" (private)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-docs',
  'tenant-docs',
  false,
  52428800,  -- 50 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: only the authenticated owner can access their own files
CREATE POLICY "tenant_docs_storage_owner"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'tenant-docs'
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'tenant-docs'
    AND auth.uid() IS NOT NULL
  );


-- ─── 5. INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contracts_tenant  ON public.contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_end     ON public.contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_status  ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_docs_contract     ON public.tenant_documents(contract_id);
