'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import Reveal from '@/components/Reveal';
import { projects, projectCategories } from '@/data/projects';
import { whatsappMessages, whatsappUrl } from '@/data/site';

const TODOS = 'Todos';

export default function PortfolioGrid({ limit }) {
  const [filter, setFilter] = useState(TODOS);

  // Los filtros sólo aparecen en la página completa de portafolio.
  const showFilters = !limit;

  const items = useMemo(() => {
    if (limit) return projects.slice(0, limit);
    if (filter === TODOS) return projects;
    return projects.filter((p) => p.categories?.includes(filter));
  }, [filter, limit]);

  return (
    <section id="portafolio" className="scroll-mt-20 bg-mist py-24 md:py-32">
      <div className="container-x">
        {/* En /proyectos el encabezado lo pone la propia página (h1). */}
        {limit && (
          <Reveal>
            <span className="section-label">Portafolio</span>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h2 className="h-display">Cada proyecto nace de una historia diferente.</h2>
                <p className="mt-6 text-stone">
                  Detrás de cada imagen hay una familia, un lote y un problema concreto que
                  resolver. Estos son algunos.
                </p>
              </div>
              <Link
                href="/proyectos/"
                className="link-underline text-xs uppercase tracking-widest2 text-ink"
              >
                Ver todos →
              </Link>
            </div>
          </Reveal>
        )}

        {showFilters && (
          <Reveal delay={0.1}>
            <div className="flex flex-wrap gap-2">
              {[TODOS, ...projectCategories].map((c) => {
                const active = filter === c;
                return (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    aria-pressed={active}
                    className={`border px-5 py-2.5 text-xs uppercase tracking-widest2 transition-colors duration-300 ${
                      active
                        ? 'border-ink bg-ink text-white'
                        : 'border-stone/25 bg-transparent text-stone hover:border-gold hover:text-ink'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Reveal>
        )}

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((p, i) => (
              <motion.div
                key={p.slug}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link href={`/proyectos/${p.slug}/`} className="img-zoom group block h-full bg-paper">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={p.cover}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                    {p.categories?.[0] && (
                      <span className="absolute left-4 top-4 bg-paper/90 px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-ink">
                        {p.categories[0]}
                      </span>
                    )}
                    <span className="absolute bottom-4 left-4 text-xs uppercase tracking-widest2 text-white opacity-0 transition-all duration-500 group-hover:opacity-100">
                      Ver la historia →
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
                    {p.story?.problema && (
                      <p className="mt-4 border-t border-mist pt-4 text-sm leading-relaxed text-stone">
                        {p.story.problema}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {showFilters && items.length === 0 && (
          <p className="mt-16 text-center text-stone">
            Todavía no hay proyectos publicados en esta categoría.
          </p>
        )}

        <Reveal delay={0.2}>
          <div className="mt-20 flex flex-col items-start gap-6 border-t border-stone/15 pt-12 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg font-display text-2xl leading-snug">
              ¿Alguno se parece a lo que imaginas para tu lote?
            </p>
            <a
              href={whatsappUrl(whatsappMessages.lote)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-line shrink-0 text-ink"
            >
              Cuéntanos tu idea
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
