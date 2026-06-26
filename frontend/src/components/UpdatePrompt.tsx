"use client";

import { useEffect } from 'react';

/**
 * UpdatePrompt — Limpia Service Workers antiguos de la versión Vite del sitio.
 * Usa sessionStorage para ejecutarse UNA SOLA VEZ por sesión y evitar bucles de recarga.
 */
export const UpdatePrompt = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Si ya limpiamos en esta sesión, no volvemos a hacerlo
    if (sessionStorage.getItem('sw_cleaned') === '1') return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length === 0) {
        // Nada que limpiar
        sessionStorage.setItem('sw_cleaned', '1');
        return;
      }

      const promises = registrations.map((reg) => reg.unregister());

      Promise.all(promises).then(() => {
        sessionStorage.setItem('sw_cleaned', '1');

        if ('caches' in window) {
          caches.keys().then((keys) => {
            Promise.all(keys.map(key => caches.delete(key))).then(() => {
              window.location.reload();
            });
          });
        } else {
          window.location.reload();
        }
      });
    });
  }, []);

  return null;
};

