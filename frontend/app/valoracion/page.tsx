import { Valoracion } from '../../src/views/Valoracion';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Valora tu Inmueble | Gelabert Homes',
  description: 'Descubre el valor real de tu propiedad en Málaga y la Costa del Sol. Valoración gratuita, online y en minutos impulsada por Big Data.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Valoracion />
      </Layout>
    </>
  );
}
