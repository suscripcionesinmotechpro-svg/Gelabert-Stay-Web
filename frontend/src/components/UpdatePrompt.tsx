"use client";

import { useEffect } from 'react';

/**
 * UpdatePrompt — Ahora actúa como un limpiador automático de Service Workers antiguos.
 * Como la web migró de Vite a Next.js, los navegadores de los clientes aún conservan
 * el Service Worker de la versión de Vite. Este script los desregistra de inmediato
 * y limpia la caché local para forzar la carga limpia de la versión Next.js.
 */
export const UpdatePrompt = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      let unregisteredAny = false;
      
      const promises = registrations.map((reg) => 
        reg.unregister().then((success) => {
          if (success) {
            console.log('[PWA] Service Worker antiguo desregistrado con éxito.');
            unregisteredAny = true;
          }
        })
      );

      Promise.all(promises).then(() => {
        if (unregisteredAny) {
          // Limpiar caches de la PWA
          if ('caches' in window) {
            caches.keys().then((keys) => {
              Promise.all(keys.map(key => caches.delete(key))).then(() => {
                console.log('[PWA] Caché antigua eliminada. Recargando para aplicar Next.js...');
                window.location.reload();
              });
            });
          } else {
            window.location.reload();
          }
        }
      });
    });
  }, []);

  return null;
};
