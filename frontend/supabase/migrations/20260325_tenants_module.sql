-- ═══════════════════════════════════════════════════════════════
--  GELABERT HOMES — Tenant Module (CLEAN INSTALL)
--  Pega TODO esto en el SQL Editor de Supabase y pulsa Run
-- ═══════════════════════════════════════════════════════════════

-- ─── LIMPIEZA (elimina cualquier estado parcial del intento anterior) ─────────
DROP TABLE IF EXISTS public.tenant_documents CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- ─── 1. TENANTS ──────────────────────────────────────────────────────────────
CREATE TABLE public.tenants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  avatar_color text DEFAULT '#C9A962'
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_owner ON public.tenants
  FOR ALL
  USING (auth.uid() = tenants.user_id)
  WITH CHECK (auth.uid() = tenants.user_id);

-- ─── 2. CONTRACTS ────────────────────────────────────────────────────────────
CREATE TABLE public.contracts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id     uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  property_label  text,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  monthly_rent    numeric(10, 2),
  deposit         numeric(10, 2),
  currency        text DEFAULT 'EUR',
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'expired', 'cancelled')),
  notes           text
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contracts_owner ON public.contracts
  FOR ALL
  USING (auth.uid() = contracts.user_id)
  WITH CHECK (auth.uid() = contracts.user_id);

-- ─── 3. TENANT DOCUMENTS ─────────────────────────────────────────────────────
CREATE TABLE public.tenant_documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_at    timestamptz NOT NULL DEFAULT now(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id    uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  document_type  text NOT NULL
                   CHECK (document_type IN (
                     'dni', 'contrato_arrendamiento', 'documento_reserva',
                     'encargo_servicios', 'ficha_visita', 'otro'
                   )),
  file_name      text NOT NULL,
  file_url       text NOT NULL,
  file_path      text NOT NULL
);

ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_docs_owner ON public.tenant_documents
  FOR ALL
  USING (auth.uid() = tenant_documents.user_id)
  WITH CHECK (auth.uid() = tenant_documents.user_id);

-- ─── 4. INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX idx_contracts_tenant  ON public.contracts(tenant_id);
CREATE INDEX idx_contracts_end     ON public.contracts(end_date);
CREATE INDEX idx_contracts_status  ON public.contracts(status);
CREATE INDEX idx_docs_contract     ON public.tenant_documents(contract_id);
