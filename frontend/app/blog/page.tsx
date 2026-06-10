import { BlogList } from '../../src/views/BlogList';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Inmobiliario | Gelabert Homes',
  description: 'Lea los últimos artículos, análisis y guías sobre el mercado inmobiliario premium de Málaga y la Costa del Sol. Consejos de inversión y estilo de vida.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <BlogList />
      </Layout>
    </>
  );
}
