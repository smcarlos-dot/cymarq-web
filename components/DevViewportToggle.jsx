'use client';

import { useEffect, useState } from 'react';

/**
 * Conmutador de vista escritorio / móvil para revisar el sitio en local.
 *
 * SOLO existe en desarrollo y sólo en localhost: `process.env.NODE_ENV` se
 * sustituye por 'production' al compilar, así que en cymarq.com.co este
 * componente no pinta nada.
 *
 * La vista móvil carga la misma página dentro de un iframe de 390 px. Es la
 * única forma de que se apliquen de verdad los breakpoints de móvil: cambiar
 * el ancho del contenedor no engañaría a las media queries.
 */
const PHONE = { width: 390, height: 844 };

export default function DevViewportToggle() {
  const [enabled, setEnabled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const { hostname, pathname, search, hash } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
    // Dentro del propio iframe no debe aparecer el botón.
    const inFrame = window.self !== window.top;

    setEnabled(isLocal && !inFrame);
    setSrc(`${pathname}${search}${hash}`);
  }, []);

  // Bloquea el scroll de la página de fondo mientras se ve el móvil.
  useEffect(() => {
    if (!mobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMobile(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobile]);

  if (!enabled) return null;

  return (
    <>
      <button
        onClick={() => setMobile((v) => !v)}
        className="fixed bottom-6 left-6 z-[70] flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-ink shadow-xl shadow-black/25 backdrop-blur transition-transform duration-300 hover:scale-105"
        title="Sólo visible en localhost"
      >
        <span aria-hidden="true">{mobile ? '🖥️' : '📱'}</span>
        {mobile ? 'Ver en escritorio' : 'Ver en móvil'}
      </button>

      {mobile && (
        <div className="fixed inset-0 z-[65] flex flex-col items-center justify-center gap-4 bg-ink/95 p-6 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-widest2 text-white/50">
            Vista móvil · {PHONE.width} × {PHONE.height} · sólo en local
          </p>

          <div
            className="overflow-hidden rounded-[2rem] border-[10px] border-neutral-800 bg-white shadow-2xl"
            // content-box para que el ancho sea el del viewport real del
            // iframe (390 px) y no lo coma el marco del "teléfono".
            style={{
              boxSizing: 'content-box',
              width: PHONE.width,
              height: PHONE.height,
              maxWidth: 'calc(100vw - 5rem)',
              maxHeight: 'calc(100vh - 9rem)',
            }}
          >
            {/* key={src} fuerza recarga si cambia la ruta al abrirlo */}
            <iframe
              key={src}
              src={src}
              title="Vista móvil"
              className="h-full w-full border-0"
            />
          </div>

          <button
            onClick={() => setMobile(false)}
            className="text-[11px] uppercase tracking-widest2 text-white/60 transition-colors hover:text-white"
          >
            Cerrar (Esc)
          </button>
        </div>
      )}
    </>
  );
}
