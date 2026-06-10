import OwnerSaleLeadForm from '../../src/views/leads/OwnerSaleLeadForm';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vender Propiedad | Gelabert Homes',
  description: 'Formulario de registro para propietarios interesados en vender su inmueble con Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <OwnerSaleLeadForm />
      </Layout>
    </>
  );
}
