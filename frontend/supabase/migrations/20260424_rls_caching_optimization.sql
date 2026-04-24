-- Optimización RLS según las recomendaciones de Supabase Pro Advisor.
-- Reemplaza auth.uid() por (select auth.uid()) para permitir el cacheo en el Initial Plan.

-- profiles
DROP POLICY IF EXISTS "Profiles access" ON public.profiles;
CREATE POLICY "Profiles access" ON public.profiles FOR ALL TO authenticated USING (
  id = (select auth.uid()) OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
) WITH CHECK (
  id = (select auth.uid()) OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

-- inquiries
DROP POLICY IF EXISTS "Inquiries access" ON public.inquiries;
CREATE POLICY "Inquiries access" ON public.inquiries FOR ALL TO authenticated USING (
  user_id = (select auth.uid()) OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

-- accounting_fixed_expenses
DROP POLICY IF EXISTS "Users can manage their own fixed expenses" ON public.accounting_fixed_expenses;
CREATE POLICY "Users can manage their own fixed expenses" ON public.accounting_fixed_expenses FOR ALL TO public USING (
  user_id = (select auth.uid())
);

-- invoice_settings
DROP POLICY IF EXISTS "settings_select" ON public.invoice_settings;
CREATE POLICY "settings_select" ON public.invoice_settings FOR SELECT TO public USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "settings_insert" ON public.invoice_settings;
CREATE POLICY "settings_insert" ON public.invoice_settings FOR INSERT TO public WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "settings_update" ON public.invoice_settings;
CREATE POLICY "settings_update" ON public.invoice_settings FOR UPDATE TO public USING (user_id = (select auth.uid()));

-- invoice_issuers
DROP POLICY IF EXISTS "Users can view their own issuers" ON public.invoice_issuers;
CREATE POLICY "Users can view their own issuers" ON public.invoice_issuers FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own issuers" ON public.invoice_issuers;
CREATE POLICY "Users can insert their own issuers" ON public.invoice_issuers FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own issuers" ON public.invoice_issuers;
CREATE POLICY "Users can update their own issuers" ON public.invoice_issuers FOR UPDATE TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own issuers" ON public.invoice_issuers;
CREATE POLICY "Users can delete their own issuers" ON public.invoice_issuers FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

-- accounting_variable_categories
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias categorías variables" ON public.accounting_variable_categories;
CREATE POLICY "Usuarios pueden ver sus propias categorías variables" ON public.accounting_variable_categories FOR SELECT TO public USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden crear sus propias categorías variables" ON public.accounting_variable_categories;
CREATE POLICY "Usuarios pueden crear sus propias categorías variables" ON public.accounting_variable_categories FOR INSERT TO public WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias categorías variables" ON public.accounting_variable_categories;
CREATE POLICY "Usuarios pueden actualizar sus propias categorías variables" ON public.accounting_variable_categories FOR UPDATE TO public USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias categorías variables" ON public.accounting_variable_categories;
CREATE POLICY "Usuarios pueden eliminar sus propias categorías variables" ON public.accounting_variable_categories FOR DELETE TO public USING (user_id = (select auth.uid()));

-- accounting_variable_monthly
DROP POLICY IF EXISTS "Users can select own variable monthly entries" ON public.accounting_variable_monthly;
CREATE POLICY "Users can select own variable monthly entries" ON public.accounting_variable_monthly FOR SELECT TO public USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own variable monthly entries" ON public.accounting_variable_monthly;
CREATE POLICY "Users can insert own variable monthly entries" ON public.accounting_variable_monthly FOR INSERT TO public WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own variable monthly entries" ON public.accounting_variable_monthly;
CREATE POLICY "Users can update own variable monthly entries" ON public.accounting_variable_monthly FOR UPDATE TO public USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own variable monthly entries" ON public.accounting_variable_monthly;
CREATE POLICY "Users can delete own variable monthly entries" ON public.accounting_variable_monthly FOR DELETE TO public USING (user_id = (select auth.uid()));

-- tenants
DROP POLICY IF EXISTS "tenants_owner" ON public.tenants;
CREATE POLICY "tenants_owner" ON public.tenants FOR ALL TO public USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- contracts
DROP POLICY IF EXISTS "contracts_owner" ON public.contracts;
CREATE POLICY "contracts_owner" ON public.contracts FOR ALL TO public USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- tenant_documents
DROP POLICY IF EXISTS "tenant_docs_owner" ON public.tenant_documents;
CREATE POLICY "tenant_docs_owner" ON public.tenant_documents FOR ALL TO public USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- appointments
DROP POLICY IF EXISTS "Restringir acceso a citas" ON public.appointments;
CREATE POLICY "Restringir acceso a citas" ON public.appointments FOR ALL TO public USING ((select auth.uid()) IS NOT NULL);

-- documents
DROP POLICY IF EXISTS "Restringir acceso a documentos" ON public.documents;
CREATE POLICY "Restringir acceso a documentos" ON public.documents FOR ALL TO public USING ((select auth.uid()) IS NOT NULL);

-- favorites
DROP POLICY IF EXISTS "Restringir acceso a favoritos" ON public.favorites;
CREATE POLICY "Restringir acceso a favoritos" ON public.favorites FOR ALL TO public USING ((select auth.uid()) IS NOT NULL);

-- notifications
DROP POLICY IF EXISTS "Restringir acceso a notificaciones" ON public.notifications;
CREATE POLICY "Restringir acceso a notificaciones" ON public.notifications FOR ALL TO public USING ((select auth.uid()) IS NOT NULL);

-- property_images
DROP POLICY IF EXISTS "Restringir acceso a imagenes de propiedades" ON public.property_images;
CREATE POLICY "Restringir acceso a imagenes de propiedades" ON public.property_images FOR ALL TO public USING ((select auth.uid()) IS NOT NULL);

-- invoices
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO public USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT TO public WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE TO public USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE TO public USING (user_id = (select auth.uid()));
