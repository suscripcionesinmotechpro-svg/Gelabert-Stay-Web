"use client";

import '../src/i18n';
import { AuthProvider } from '../src/hooks/useAuth';
import { ServiceCartProvider } from '../src/context/ServiceCartContext';
import { HelmetProvider } from 'react-helmet-async';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ServiceCartProvider>
          {children}
        </ServiceCartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
