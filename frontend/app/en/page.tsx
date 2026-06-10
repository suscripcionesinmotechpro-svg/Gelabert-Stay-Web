import { Home } from '../../src/views/Home';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <Home />
      </Layout>
    </>
  );
}
