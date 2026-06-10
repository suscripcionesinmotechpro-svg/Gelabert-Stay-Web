import { AvisoLegal } from '../../src/views/legal/AvisoLegal';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso Legal | Gelabert Homes',
  description: 'Términos y condiciones legales de uso del sitio web de Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <AvisoLegal />
      </Layout>
    </>
  );
}
