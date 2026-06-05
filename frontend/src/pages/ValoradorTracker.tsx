import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

// URL de fallback por si la base de datos no está disponible o el ID no existe
const FALLBACK_URL = "https://statefox.com/mites/v/6093dc70f21ebc61f637b472";

export const ValoradorTracker = () => {
  const { qrId } = useParams<{ qrId: string }>();

  useEffect(() => {
    const trackAndRedirect = async () => {
      const activeId = qrId || 'cta-valorador';
      let targetUrl = FALLBACK_URL;

      try {
        // 1. Obtener la URL de destino de la base de datos
        const { data, error } = await supabase
          .from('redirects')
          .select('target_url')
          .eq('id', activeId)
          .single();

        if (error) {
          console.warn(`[Tracker] No se encontró la redirección para el ID "${activeId}". Usando fallback.`, error);
        } else if (data && data.target_url) {
          targetUrl = data.target_url;
        }

        // 2. Registrar el log de visitas en Supabase de forma asíncrona
        supabase.from('redirect_logs').insert({
          redirect_id: activeId,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null
        }).then(({ error: logError }) => {
          if (logError) {
            console.error('[Tracker] Error al guardar el log de visitas:', logError);
          }
        });

        // 3. Registrar el evento en Google Analytics si está disponible en la ventana
        try {
          const isQROrigin = activeId !== 'cta-valorador';
          const gaEvent = isQROrigin ? 'qr_scan' : 'cta_click';
          
          // Compatibilidad con gtag.js (Google Analytics 4)
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', gaEvent, {
              'event_category': 'Engagement',
              'event_label': activeId,
              'campaign': 'valorador',
              'source': isQROrigin ? 'qr' : 'web',
              'medium': isQROrigin ? 'offline' : 'cta',
              'placement': isQROrigin ? 'storefront' : 'website'
            });
          }
          
          // Compatibilidad con DataLayer de Google Tag Manager
          if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({
              'event': gaEvent,
              'qr_id': activeId,
              'campaign': 'valorador',
              'source': isQROrigin ? 'qr' : 'web',
              'medium': isQROrigin ? 'offline' : 'cta'
            });
          }
        } catch (analyticsError) {
          console.warn('[Tracker] Error al disparar eventos de analítica:', analyticsError);
        }

      } catch (err) {
        console.error('[Tracker] Excepción durante el proceso de redirección:', err);
      } finally {
        // 4. Construir la URL final agregando los parámetros UTM dinámicos
        try {
          const parsedUrl = new URL(targetUrl);
          
          // Detectar si el origen es un código QR o un botón CTA de la web
          const isQROrigin = activeId !== 'cta-valorador';
          
          parsedUrl.searchParams.set("utm_source", isQROrigin ? "qr" : "web");
          parsedUrl.searchParams.set("utm_medium", isQROrigin ? "offline" : "cta");
          parsedUrl.searchParams.set("utm_campaign", activeId);

          // Redirección definitiva
          window.location.replace(parsedUrl.toString());
        } catch (urlError) {
          console.error('[Tracker] Error al parsear la URL de destino. Redirección simple.', urlError);
          // Fallback a redirección simple
          window.location.replace(targetUrl);
        }
      }
    };

    trackAndRedirect();
  }, [qrId]);

  return (
    <div className="w-full min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-[#FAF8F5]">
      <div className="flex flex-col items-center gap-4 max-w-md px-6 text-center">
        <Loader2 className="w-10 h-10 text-[#C9A962] animate-spin" />
        <h2 className="font-primary uppercase tracking-widest text-lg mt-2">
          Redirigiendo al Valorador...
        </h2>
        <p className="font-secondary text-sm text-white/40 leading-relaxed">
          Estamos registrando tu visita de forma segura y conectándote con nuestra herramienta de valoración. Un momento por favor.
        </p>
      </div>
    </div>
  );
};
