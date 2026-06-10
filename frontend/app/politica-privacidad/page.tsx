import { Privacidad } from '../../src/views/legal/Privacidad';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Gelabert Homes',
  description: 'Política de protección de datos personales y privacidad de Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Privacidad />
      </Layout>
    </>
  );
}
