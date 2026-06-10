import { Propiedades } from '../../src/views/Propiedades';
import { Layout } from '../../src/components/Layout';
import { LanguageInitializer } from '../../src/components/LanguageInitializer';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Propiedades en Venta y Alquiler | Gelabert Homes',
  description: 'Explore nuestro catálogo exclusivo de propiedades de lujo en venta y alquiler en Málaga y la Costa del Sol. Habitaciones premium, pisos y villas.',
};

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <Suspense fallback={<div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#C9A962] font-primary uppercase tracking-widest">Cargando propiedades...</div>}>
          <Propiedades />
        </Suspense>
      </Layout>
    </>
  );
}
