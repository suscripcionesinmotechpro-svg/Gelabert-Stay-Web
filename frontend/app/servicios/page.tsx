import { Servicios } from '../../src/views/Servicios';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Servicios Inmobiliarios | Gelabert Homes',
  description: 'Descubra nuestros servicios exclusivos de gestión de patrimonio, alquiler de habitaciones premium, intermediación de compraventa y asesoramiento financiero.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Servicios />
      </Layout>
    </>
  );
}
