import { Cookies } from '../../../src/views/legal/Cookies';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookies Policy | Gelabert Homes',
  description: 'Detailed information about the use of cookies on the Gelabert Homes website.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Cookies />
      </Layout>
    </>
  );
}
