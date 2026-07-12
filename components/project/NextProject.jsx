'use client';

import Link from 'next/link';
import Reveal from '@/components/Reveal';

/**
 * Cambio entre proyectos: al final de cada proyecto se presenta el
 * siguiente con una imagen a pantalla ancha; el scroll invita a continuar.
 */
export default function NextProject({ prev, next }) {
  return (
    <section className="bg-ink text-white">
      <div className="container-x flex items-center justify-between py-8 text-xs uppercase tracking-widest2">
        <Link href={`/proyectos/${prev.slug}/`} className="link-underline text-white/70 hover:text-white">
          ← {prev.name}
        </Link>
        <Link href="/proyectos/" className="link-underline text-white/70 hover:text-white">
          Todos los proyectos
        </Link>
      </div>

      <Link href={`/proyectos/${next.slug}/`} className="img-zoom group relative block overflow-hidden">
        <div className="relative h-[55vh] md:h-[70vh]">
          <img
            src={next.cover}
            alt={next.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-ink/55 transition-colors duration-700 group-hover:bg-ink/35" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Reveal>
              <p className="text-xs uppercase tracking-widest2 text-gold">Siguiente proyecto</p>
              <h2 className="mt-4 max-w-3xl px-6 font-display text-3xl md:text-5xl">
                {next.name}
              </h2>
              <p className="mt-6 inline-block border-b border-white/50 pb-1 text-xs uppercase tracking-widest2 transition-colors duration-300 group-hover:border-gold group-hover:text-gold">
                Continuar →
              </p>
            </Reveal>
          </div>
        </div>
      </Link>
    </section>
  );
}
