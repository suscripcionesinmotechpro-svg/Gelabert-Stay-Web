import { Reviews } from '../../src/views/Reviews';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reseñas y Opiniones de Clientes | Gelabert Homes',
  description: 'Descubra las opiniones e historias de éxito de nuestros clientes. La satisfacción y confianza es nuestra prioridad en Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Reviews />
      </Layout>
    </>
  );
}
