import { Cookies } from '../../src/views/legal/Cookies';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies | Gelabert Homes',
  description: 'Información detallada sobre el uso de cookies en el sitio web de Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Cookies />
      </Layout>
    </>
  );
}
