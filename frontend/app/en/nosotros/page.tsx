import Nosotros from '../../../src/views/Nosotros';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Gelabert Homes',
  description: 'Meet Gelabert Homes, a family-owned boutique real estate agency in Malaga, committed to transparency, excellence, and personalized client relationships.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Nosotros />
      </Layout>
    </>
  );
}
