import { AvisoLegal } from '../../../src/views/legal/AvisoLegal';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal Notice | Gelabert Homes',
  description: 'Legal terms and conditions of use of the Gelabert Homes website.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <AvisoLegal />
      </Layout>
    </>
  );
}
