'use client';

import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { projects } from '@/data/projects';

export default function PortfolioGrid({ limit }) {
  const items = limit ? projects.slice(0, limit) : projects;

  return (
    <section id="portafolio" className="scroll-mt-20 bg-mist py-24 md:py-32">
      <div className="container-x">
        <Reveal>
          <span className="section-label">Portafolio</span>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="h-display">Nuestros proyectos</h2>
            {limit && (
              <Link
                href="/proyectos/"
                className="link-underline text-xs uppercase tracking-widest2 text-ink"
              >
                Ver todos →
              </Link>
            )}
          </div>
        </Reveal>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.1}>
              <Link
                href={`/proyectos/${p.slug}/`}
                className="img-zoom group block bg-paper"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={p.cover}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                  <span className="absolute bottom-4 left-4 text-xs uppercase tracking-widest2 text-white opacity-0 transition-all duration-500 group-hover:opacity-100">
                    Ver proyecto →
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-[11px] uppercase tracking-widest2 text-gold">
                    {p.year} · {p.status.split('–')[0].trim()}
                  </p>
                  <h3 className="mt-2 font-display text-xl leading-snug transition-colors duration-300 group-hover:text-gold">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-sm text-stone">{p.location}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
