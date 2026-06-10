import OwnerRentLeadForm from '../../../src/views/leads/OwnerRentLeadForm';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rent Out Property | Gelabert Homes',
  description: 'Registration form for property owners interested in renting out their property with Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <OwnerRentLeadForm />
      </Layout>
    </>
  );
}
