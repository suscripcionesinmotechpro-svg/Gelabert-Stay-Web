import { Privacidad } from '../../../src/views/legal/Privacidad';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Gelabert Homes',
  description: 'Personal data protection and privacy policy of Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Privacidad />
      </Layout>
    </>
  );
}
