'use client';

import { useEffect } from 'react';

/**
 * Mide los clics que abren una conversación de WhatsApp.
 *
 * Todo el negocio de CYMARQ ocurre por WhatsApp, pero Analytics sólo recibía
 * los eventos automáticos de GA4: `page_view`, `scroll`, `click`… El evento
 * `click` sí registra los enlaces salientes, pero mete en el mismo saco
 * WhatsApp, Instagram, Facebook y los enlaces a las curadurías, así que no
 * había forma de saber qué página genera contactos. El panel mostraba cero
 * conversiones.
 *
 * Se resuelve con un único listener delegado en lugar de tocar los quince
 * enlaces repartidos por el sitio: así quedan cubiertos todos los actuales y
 * también los que se añadan después sin acordarse de instrumentarlos.
 */

/** Réplica exacta de lo que hace `gtag`: empujar `arguments` a dataLayer. */
function enviarEvento() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments);
}

/**
 * De dónde salió el clic dentro de la página.
 * Primero un `data-cta` explícito; si no, la sección que lo contiene.
 */
function ubicacionDe(enlace) {
  const marcado = enlace.closest('[data-cta]');
  if (marcado) return marcado.dataset.cta;

  const seccion = enlace.closest('section[id]');
  if (seccion) return seccion.id;

  return 'sin-clasificar';
}

export default function AnalyticsWhatsApp() {
  useEffect(() => {
    function alHacerClic(e) {
      const enlace = e.target.closest?.('a[href*="wa.me/"]');
      if (!enlace) return;

      // El botón flotante es sólo un icono: su texto está en el aria-label.
      const etiqueta =
        enlace.textContent.trim() || enlace.getAttribute('aria-label') || 'sin etiqueta';

      enviarEvento('event', 'contacto_whatsapp', {
        origen: window.location.pathname,
        ubicacion: ubicacionDe(enlace),
        etiqueta: etiqueta.slice(0, 100),
      });
    }

    // En la fase de captura, para que el evento salga aunque algo más
    // detenga la propagación del clic.
    document.addEventListener('click', alHacerClic, { capture: true });
    return () => document.removeEventListener('click', alHacerClic, { capture: true });
  }, []);

  return null;
}
