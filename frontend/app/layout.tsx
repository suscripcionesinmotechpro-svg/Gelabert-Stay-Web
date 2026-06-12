import type { Metadata, Viewport } from 'next';
import '../src/index.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { ScrollToTop } from '../src/components/ScrollToTop';
import { UpdatePrompt } from '../src/components/UpdatePrompt';
import { CustomCursor } from '../src/components/CustomCursor';

export const metadata: Metadata = {
  title: {
    default: 'Gelabert Homes | Real Estate Premium Málaga',
    template: '%s | Gelabert Homes'
  },
  description: 'Inmobiliaria de lujo boutique en Málaga y la Costa del Sol. Especialistas en alquiler de habitaciones premium, venta y gestión inmobiliaria.',
  metadataBase: new URL('https://gelaberthomes.es'),
  alternates: {
    canonical: '/',
    languages: {
      'es': '/',
      'en': '/en'
    }
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark bg-[#121212]">
      <body className="antialiased bg-[#121212] text-[#FAF8F5] min-h-screen flex flex-col font-sans">
        <Providers>
          <Toaster 
            position="top-right" 
            toastOptions={{ 
              duration: 4000, 
              style: { 
                background: '#1A1A1A', 
                color: '#FAF8F5', 
                border: '1px solid #1F1F1F', 
                fontSize: '14px', 
                borderRadius: '4px' 
              } 
            }} 
          />
          <ScrollToTop />
          <UpdatePrompt />
          <CustomCursor />
          {children}
        </Providers>
      </body>
    </html>
  );
}
