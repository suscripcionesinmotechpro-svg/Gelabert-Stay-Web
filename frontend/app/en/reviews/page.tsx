import { Reviews } from '../../../src/views/Reviews';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Reviews and Testimonials | Gelabert Homes',
  description: 'Read the reviews and success stories of our clients. Client satisfaction and trust is our top priority at Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Reviews />
      </Layout>
    </>
  );
}
