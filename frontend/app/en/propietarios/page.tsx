import { Propietarios } from '../../../src/views/Propietarios';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Owners - Sell or Rent Your Property | Gelabert Homes',
  description: 'Maximize the return on your property in Málaga and the Costa del Sol. Premium comprehensive rental management and property sales.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Propietarios />
      </Layout>
    </>
  );
}
