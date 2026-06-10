import { Valoracion } from '../../../src/views/Valoracion';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Value Your Property | Gelabert Homes',
  description: 'Discover the real value of your property in Málaga and the Costa del Sol. Free, online valuation in minutes powered by Big Data.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Valoracion />
      </Layout>
    </>
  );
}
