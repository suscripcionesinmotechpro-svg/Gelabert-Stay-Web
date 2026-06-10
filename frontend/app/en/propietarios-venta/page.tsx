import OwnerSaleLeadForm from '../../../src/views/leads/OwnerSaleLeadForm';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell Property | Gelabert Homes',
  description: 'Registration form for property owners interested in selling with Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <OwnerSaleLeadForm />
      </Layout>
    </>
  );
}
