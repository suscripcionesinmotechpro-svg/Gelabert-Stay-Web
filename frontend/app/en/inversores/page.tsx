import Inversores from '../../../src/views/Inversores';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Investors - Premium Real Estate Investment | Gelabert Homes',
  description: 'Invest in the most dynamic real estate market in Spain. Exclusive high-yield investment opportunities in Málaga and the Costa del Sol.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Inversores />
      </Layout>
    </>
  );
}
