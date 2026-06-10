import { BlogList } from '../../../src/views/BlogList';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real Estate Blog | Gelabert Homes',
  description: 'Read the latest news, insights, and analysis about the luxury real estate market in Malaga and Costa del Sol. Investment tips and premium lifestyle guides.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <BlogList />
      </Layout>
    </>
  );
}
