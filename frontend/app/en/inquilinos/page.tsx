import TenantLeadForm from '../../../src/views/leads/TenantLeadForm';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tenant Registration | Gelabert Homes',
  description: 'Registration form for tenants looking for their next premium home with Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <TenantLeadForm />
      </Layout>
    </>
  );
}
