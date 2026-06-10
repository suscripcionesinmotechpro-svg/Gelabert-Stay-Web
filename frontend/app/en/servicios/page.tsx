import { Servicios } from '../../../src/views/Servicios';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real Estate Services | Gelabert Homes',
  description: 'Discover our premium property services: asset management, luxury room rentals, purchase/sale brokerage, and financial advisory in Malaga and Costa del Sol.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Servicios />
      </Layout>
    </>
  );
}
