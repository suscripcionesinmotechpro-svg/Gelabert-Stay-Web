import TenantLeadForm from '../../src/views/leads/TenantLeadForm';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registro de Inquilinos | Gelabert Homes',
  description: 'Formulario de registro para inquilinos que buscan su próximo hogar premium con Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <TenantLeadForm />
      </Layout>
    </>
  );
}
