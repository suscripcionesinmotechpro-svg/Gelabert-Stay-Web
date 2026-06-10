import { Propietarios } from '../../src/views/Propietarios';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Propietarios - Venda o Alquile su Propiedad | Gelabert Homes',
  description: 'Maximice la rentabilidad de su propiedad en Málaga y la Costa del Sol. Gestión integral premium de alquileres y venta de propiedades.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Propietarios />
      </Layout>
    </>
  );
}
