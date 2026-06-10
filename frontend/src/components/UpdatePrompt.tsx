"use client";

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * UpdatePrompt — Detecta cuando hay una nueva versión del Service Worker disponible
 * y muestra un banner sutil para que el usuario actualice sin necesidad de refrescar
 * manualmente. Utiliza las APIs nativas del navegador para ser compatible tanto con
 * Vite como con Next.js sin depender de importaciones virtuales de empaquetador.
 */
export const UpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Obtener el registro actual
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      setSwRegistration(reg);

      const checkUpdate = () => {
        reg.update().catch((err) => console.log('Error buscando actualizaciones:', err));
      };
      
      // Buscar actualizaciones cada hora
      const interval = setInterval(checkUpdate, 60 * 60 * 1000);

      const handleStateChange = (worker: ServiceWorker) => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          setShowPrompt(true);
        }
      };

      if (reg.waiting) {
        setShowPrompt(true);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => handleStateChange(newWorker));
        }
      });

      return () => clearInterval(interval);
    });
  }, []);

  const handleUpdate = () => {
    setShowPrompt(false);
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 
                 bg-[#0A0A0A] border border-[#C9A962]/40 shadow-[0_0_30px_rgba(201,169,98,0.15)] 
                 rounded-sm max-w-sm w-[calc(100%-2rem)] animate-fade-up"
      role="alert"
    >
      <RefreshCw className="w-4 h-4 text-[#C9A962] shrink-0" />
      <p className="font-primary text-sm text-[#FAF8F5] flex-1">
        Nueva versión disponible
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDismiss}
          className="font-primary text-xs text-[#666666] hover:text-[#888888] transition-colors"
        >
          Ahora no
        </button>
        <button
          onClick={handleUpdate}
          className="font-primary text-xs font-bold text-[#0A0A0A] bg-[#C9A962] hover:bg-[#D4B673] 
                     px-3 py-1.5 transition-colors"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
};
