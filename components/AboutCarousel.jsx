'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Carrusel automático (crossfade) de proyectos reales de CYMARQ.
 * Reutiliza imágenes ya existentes en /public/projects.
 * La primera diapositiva se renderiza visible en el HTML: no depende de JavaScript.
 */
const slides = [
  {
    src: '/projects/casa-con-patio-interior-en-tibu/patio-interior.webp',
    alt: 'Patio interior de doble altura con jardín vertical y escalera helicoidal — Casa con Patio Interior en Tibú, proyecto de CYMARQ',
  },
  {
    src: '/projects/edificio-cyma/edificio-cyma.webp',
    alt: 'Fachada del Edificio CYMA, edificación de uso mixto de cuatro niveles diseñada por CYMARQ',
  },
  {
    src: '/projects/casa-moderna-con-patio-cubierto/patio-interno.webp',
    alt: 'Patio cubierto con jardín vertical y cubierta traslúcida — Casa Moderna con Patio Cubierto, proyecto de CYMARQ',
  },
  {
    src: '/projects/edificacion-de-uso-mixto/fachada.webp',
    alt: 'Fachada iluminada con locales comerciales y vivienda superior — Edificación de Uso Mixto, proyecto de CYMARQ',
  },
  {
    src: '/projects/vivienda-unifamiliar/1.webp',
    alt: 'Sala social con muro en piedra y escalera hacia el jardín interior — Vivienda Unifamiliar en Cúcuta, proyecto de CYMARQ',
  },
];

const INTERVAL = 5000;
const FADE = '1.2s cubic-bezier(0.22, 1, 0.36, 1)';

export default function AboutCarousel() {
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    // Respeta la preferencia del sistema: sin cambio automático de imagen.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = containerRef.current;
    if (!el) return;

    let timer = null;
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        setIndex((i) => (i + 1) % slides.length);
      }, INTERVAL);
    };

    // Solo avanza mientras la sección está visible (ahorra trabajo y ancho de banda).
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.2 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  return (
    <div ref={containerRef} className="img-zoom relative aspect-[4/5] w-full overflow-hidden">
      {slides.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: i === index ? 1 : 0,
            transition: `opacity ${FADE}, transform ${FADE}`,
          }}
          loading={i === 0 ? 'eager' : 'lazy'}
          fetchPriority="low"
          decoding="async"
          draggable={false}
          aria-hidden={i === index ? undefined : true}
        />
      ))}
    </div>
  );
}
