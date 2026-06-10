import { Propiedades } from '../../../src/views/Propiedades';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Properties for Sale and Rent | Gelabert Homes',
  description: 'Explore our exclusive portfolio of luxury properties for sale and rent in Malaga and Costa del Sol. Premium rooms, apartments, and villas.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Suspense fallback={<div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#C9A962] font-primary uppercase tracking-widest">Loading properties...</div>}>
          <Propiedades />
        </Suspense>
      </Layout>
    </>
  );
}
