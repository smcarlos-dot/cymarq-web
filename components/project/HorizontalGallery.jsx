'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useIsoLayoutEffect from '@/lib/useIsoLayoutEffect';

/**
 * Galería horizontal cinematográfica.
 * En escritorio: sección fijada (pin) y desplazamiento horizontal con GSAP ScrollTrigger.
 * En móvil: carrusel nativo con scroll-snap.
 *
 * Nota: el <div> exterior existe para que el pin-spacer que GSAP inserta
 * quede DENTRO de un contenedor propiedad de React. Junto con
 * useIsoLayoutEffect (limpieza síncrona), esto evita el error
 * "removeChild on Node" al navegar entre proyectos.
 */
export default function HorizontalGallery({ images, name }) {
  const wrapperRef = useRef(null);
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useIsoLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      const track = trackRef.current;
      const getDistance = () => track.scrollWidth - window.innerWidth;

      gsap.to(track, {
        x: () => -getDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${getDistance()}`,
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    });

    ScrollTrigger.refresh();

    return () => {
      // revert síncrono: restaura el DOM (elimina el pin-spacer)
      // antes de que React desmonte la página
      mm.revert();
    };
  }, [images]);

  return (
    <div ref={wrapperRef}>
      <section ref={sectionRef} className="overflow-hidden bg-ink py-10 md:h-screen md:py-0">
        <div className="flex h-full items-center">
          <div
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 md:snap-none md:gap-8 md:overflow-visible md:px-16"
          >
            {images.map((src, i) => (
              <figure
                key={src}
                className="relative h-[60vh] w-[85vw] flex-shrink-0 snap-center overflow-hidden md:h-[72vh] md:w-[70vw] lg:w-[55vw]"
              >
                <img
                  src={src}
                  alt={`${name} — imagen ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading={i < 2 ? 'eager' : 'lazy'}
                />
                <figcaption className="absolute bottom-4 left-4 bg-ink/60 px-3 py-1 text-[11px] uppercase tracking-widest2 text-white backdrop-blur-sm">
                  {String(i + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
