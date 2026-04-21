import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n'
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker with auto-update
registerSW({
  onRegisteredSW(_swUrl, r) {
    r && setInterval(() => {
      r.update();
    }, 60 * 60 * 1000); // Check for updates every hour
  },
  onOfflineReady() {
    console.log('App lista para uso offline');
  },
});

// Force automatic reload when a new service worker takes over
let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('Nueva versión detectada. Actualizando página para mostrar los últimos cambios...');
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
