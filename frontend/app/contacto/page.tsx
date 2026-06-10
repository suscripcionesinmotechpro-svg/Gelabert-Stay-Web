import { Contacto } from '../../src/views/Contacto';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto | Gelabert Homes',
  description: 'Póngase en contacto con el equipo de Gelabert Homes. Estamos a su disposición para resolver cualquier duda sobre venta, alquiler o gestión de propiedades en Málaga.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Contacto />
      </Layout>
    </>
  );
}
