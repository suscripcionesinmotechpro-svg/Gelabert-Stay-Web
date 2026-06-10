import OwnerRentLeadForm from '../../src/views/leads/OwnerRentLeadForm';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alquilar Propiedad | Gelabert Homes',
  description: 'Formulario de registro para propietarios interesados en alquilar su inmueble con Gelabert Homes.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <OwnerRentLeadForm />
      </Layout>
    </>
  );
}
