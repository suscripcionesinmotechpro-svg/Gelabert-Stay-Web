-- Add indexes for commonly accessed foreign keys to improve performance
-- as suggested by Supabase Pro Linter

CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON public.contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_property_id ON public.invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issuer_id ON public.invoices(issuer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_fixed_expense_id ON public.invoices(fixed_expense_id);
CREATE INDEX IF NOT EXISTS idx_invoices_variable_category_id ON public.invoices(variable_category_id);

CREATE INDEX IF NOT EXISTS idx_appointments_agent_id ON public.appointments(agent_id);

CREATE INDEX IF NOT EXISTS idx_documents_property_id ON public.documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_inquiries_agent_id ON public.inquiries(agent_id);

CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON public.properties(agent_id);

CREATE INDEX IF NOT EXISTS idx_tenant_documents_user_id ON public.tenant_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON public.tenants(user_id);

CREATE INDEX IF NOT EXISTS idx_accounting_fixed_expenses_user_id ON public.accounting_fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_accounting_variable_categories_user_id ON public.accounting_variable_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_accounting_variable_monthly_user_id ON public.accounting_variable_monthly(user_id);
