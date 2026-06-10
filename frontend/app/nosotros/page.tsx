import Nosotros from '../../src/views/Nosotros';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Gelabert Homes',
  description: 'Conozca a Gelabert Homes, una inmobiliaria boutique y familiar en Málaga comprometida con la excelencia, la transparencia y el servicio al cliente personalizado.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Nosotros />
      </Layout>
    </>
  );
}
