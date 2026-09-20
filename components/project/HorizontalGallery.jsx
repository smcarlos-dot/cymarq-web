'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Galería horizontal del proyecto.
 *
 * El scroll vertical de la página NO se toca: rueda y trackpad suben y bajan
 * como en cualquier otra sección. Para recorrer las imágenes se arrastra con
 * el ratón, se usan las flechas, o se desliza con el dedo en móvil. Antes la
 * sección se fijaba a la pantalla y convertía el scroll en desplazamiento
 * horizontal, de modo que un proyecto con muchas fotos obligaba a girar la
 * rueda decenas de veces sólo para pasar de sección.
 */
export default function HorizontalGallery({ images, name }) {
  const trackRef = useRef(null);
  const drag = useRef({ activo: false, xInicial: 0, scrollInicial: 0 });

  const [progreso, setProgreso] = useState(0);
  const [hayAnterior, setHayAnterior] = useState(false);
  const [haySiguiente, setHaySiguiente] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const actualizarEstado = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const max = t.scrollWidth - t.clientWidth;
    setProgreso(max > 8 ? t.scrollLeft / max : 0);
    setHayAnterior(t.scrollLeft > 8);
    setHaySiguiente(t.scrollLeft < max - 8);
  }, []);

  useEffect(() => {
    actualizarEstado();
    window.addEventListener('resize', actualizarEstado);
    return () => window.removeEventListener('resize', actualizarEstado);
  }, [actualizarEstado, images]);

  /** Avanza o retrocede una imagen completa. */
  const desplazar = (direccion) => {
    const t = trackRef.current;
    if (!t) return;
    const figura = t.querySelector('figure');
    const separacion = parseFloat(getComputedStyle(t).columnGap) || 0;
    const paso = figura ? figura.offsetWidth + separacion : t.clientWidth * 0.8;
    t.style.scrollBehavior = 'smooth';
    t.scrollBy({ left: direccion * paso });
  };

  // Arrastre con ratón o lápiz. En táctil no se interviene: el navegador ya
  // hace el deslizamiento nativo, con su inercia y su scroll-snap.
  const alPulsar = (e) => {
    if (e.pointerType === 'touch') return;
    const t = trackRef.current;
    drag.current = { activo: true, xInicial: e.clientX, scrollInicial: t.scrollLeft };
    setArrastrando(true);
    t.style.scrollBehavior = 'auto';
    t.style.scrollSnapType = 'none';
    try {
      t.setPointerCapture(e.pointerId);
    } catch {
      /* algunos navegadores lo rechazan si el puntero ya se soltó */
    }
  };

  const alMover = (e) => {
    if (!drag.current.activo) return;
    e.preventDefault();
    trackRef.current.scrollLeft =
      drag.current.scrollInicial - (e.clientX - drag.current.xInicial);
  };

  const alSoltar = (e) => {
    if (!drag.current.activo) return;
    drag.current.activo = false;
    setArrastrando(false);
    const t = trackRef.current;
    t.style.scrollSnapType = '';
    try {
      t.releasePointerCapture(e.pointerId);
    } catch {
      /* ya liberado */
    }
  };

  const alTeclear = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      desplazar(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      desplazar(-1);
    }
  };

  const total = images.length;

  return (
    <section className="bg-ink py-12 md:py-16">
      <div className="container-x mb-6 flex items-end justify-between gap-6 md:mb-8">
        <p className="text-[11px] uppercase tracking-widest2 text-white/40">
          {total} {total === 1 ? 'imagen' : 'imágenes'}
          <span className="ml-3 hidden text-white/25 md:inline">
            Arrastra para recorrerlas
          </span>
        </p>

        {/* Controles: en móvil sobran, el dedo ya hace el trabajo. */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => desplazar(-1)}
            disabled={!hayAnterior}
            aria-label="Imagen anterior"
            className="flex h-11 w-11 items-center justify-center border border-white/20 text-white transition-colors duration-300 hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-25"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={() => desplazar(1)}
            disabled={!haySiguiente}
            aria-label="Imagen siguiente"
            className="flex h-11 w-11 items-center justify-center border border-white/20 text-white transition-colors duration-300 hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-25"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        role="group"
        aria-label={`Galería de imágenes de ${name}`}
        tabIndex={0}
        onScroll={actualizarEstado}
        onPointerDown={alPulsar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onKeyDown={alTeclear}
        className={`no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-6 outline-none focus-visible:ring-1 focus-visible:ring-gold md:snap-none md:gap-8 md:px-16 ${
          arrastrando ? 'md:cursor-grabbing md:select-none' : 'md:cursor-grab'
        }`}
      >
        {images.map((src, i) => (
          <figure
            key={src}
            className="relative h-[60vh] w-[85vw] flex-shrink-0 snap-center overflow-hidden md:h-[72vh] md:w-[62vw] lg:w-[48vw]"
          >
            <img
              src={src}
              alt={`${name} — imagen ${i + 1} de ${total}`}
              draggable={false}
              className="pointer-events-none h-full w-full select-none object-cover"
              loading={i < 2 ? 'eager' : 'lazy'}
            />
            <figcaption className="absolute bottom-4 left-4 bg-ink/60 px-3 py-1 text-[11px] uppercase tracking-widest2 text-white backdrop-blur-sm">
              {String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Barra de avance: sustituye al scrollbar oculto para que se vea
          cuánta galería queda por recorrer. */}
      {total > 1 && (
        <div className="container-x mt-6 md:mt-8">
          <div className="h-px w-full bg-white/15">
            <div
              className="h-px bg-gold transition-[width] duration-200 ease-out"
              style={{ width: `${Math.max(8, progreso * 100)}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
