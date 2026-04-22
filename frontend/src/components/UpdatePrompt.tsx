import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

/**
 * UpdatePrompt — Detecta cuando hay una nueva versión del Service Worker disponible
 * y muestra un banner sutil para que el usuario actualice sin necesidad de refrescar
 * manualmente. Con skipWaiting=true en vite.config, el SW se activa de inmediato
 * en la siguiente recarga.
 */
export const UpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Comprueba si hay actualizaciones cada 60 segundos mientras la app está abierta
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onNeedRefresh() {
      setShowPrompt(true);
    },
    onOfflineReady() {
      // Silencioso — no molestamos al usuario con "listo para uso offline"
    },
  });

  // Si el SW indica que hay nueva versión, mostramos el banner
  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    setShowPrompt(false);
    // Activa el nuevo SW y recarga la página
    updateServiceWorker(true);
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
