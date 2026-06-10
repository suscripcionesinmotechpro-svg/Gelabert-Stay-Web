import { NotFound } from '../src/views/NotFound';
import { Layout } from '../src/components/Layout';
import { LanguageInitializer } from '../src/components/LanguageInitializer';

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <NotFound />
      </Layout>
    </>
  );
}
