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
const updateSW = registerSW({
  onNeedRefresh() {
    // When a new version is available, reload the page to apply changes
    if (confirm('Nueva versión disponible. ¿Deseas actualizar para ver los últimos cambios?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App lista para uso offline');
  },
});

// Check for updates every hour
setInterval(() => {
  updateSW();
}, 60 * 60 * 1000);

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
