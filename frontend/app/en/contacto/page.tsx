import { Contacto } from '../../../src/views/Contacto';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Gelabert Homes',
  description: 'Get in touch with the Gelabert Homes team. We are here to help you with sale, rental, or property management inquiries in Malaga and Costa del Sol.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Contacto />
      </Layout>
    </>
  );
}
