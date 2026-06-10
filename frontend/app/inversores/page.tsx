import Inversores from '../../src/views/Inversores';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inversores - Inversión Inmobiliaria Premium | Gelabert Homes',
  description: 'Invierta en el mercado inmobiliario más dinámico de España. Oportunidades exclusivas de inversión de alta rentabilidad en Málaga y la Costa del Sol.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Inversores />
      </Layout>
    </>
  );
}
