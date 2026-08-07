'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import Reveal from '@/components/Reveal';
import { featuredProjects } from '@/data/projects';

function FeaturedItem({ project, index }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  // Parallax de la imagen dentro de su marco
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const even = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`grid items-center gap-10 lg:grid-cols-12 ${even ? '' : ''}`}
    >
      {/* Imagen */}
      <Link
        href={`/proyectos/${project.slug}/`}
        className={`img-zoom group relative block overflow-hidden lg:col-span-7 ${
          even ? 'lg:order-1' : 'lg:order-2'
        }`}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <motion.img
            src={project.cover}
            alt={project.name}
            style={{ y, scale: 1.18 }}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/20" />
        </div>
      </Link>

      {/* Texto */}
      <div className={`lg:col-span-5 ${even ? 'lg:order-2 lg:pl-6' : 'lg:order-1 lg:pr-6'}`}>
        <Reveal>
          <span className="font-display text-5xl text-mist">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className="mt-4 text-xs uppercase tracking-widest2 text-gold">
            {project.type} · {project.year}
          </p>
          <h3 className="mt-3 font-display text-3xl md:text-4xl">{project.name}</h3>
          <p className="mt-4 leading-relaxed text-stone">{project.short}</p>

          {project.story && (
            <dl className="mt-8 space-y-5 border-t border-mist pt-8">
              <div>
                <dt className="text-[11px] uppercase tracking-widest2 text-gold">El problema</dt>
                <dd className="mt-2 text-sm leading-relaxed text-stone">
                  {project.story.problema}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-widest2 text-gold">La solución</dt>
                <dd className="mt-2 text-sm leading-relaxed text-stone">
                  {project.story.solucion}
                </dd>
              </div>
            </dl>
          )}

          <Link
            href={`/proyectos/${project.slug}/`}
            className="link-underline mt-8 inline-block text-xs uppercase tracking-widest2 text-ink"
          >
            Ver la historia completa →
          </Link>
        </Reveal>
      </div>
    </div>
  );
}

export default function FeaturedProjects() {
  return (
    <section id="destacados" className="scroll-mt-20 bg-paper py-24 md:py-32">
      <div className="container-x">
        <Reveal>
          <span className="section-label">Proyectos destacados</span>
          <h2 className="h-display max-w-3xl">
            Cada proyecto empezó con <em className="text-gold">una conversación.</em>
          </h2>
          <p className="mt-6 max-w-xl text-stone">
            Un problema real, un lote concreto y una familia que quería vivir de una forma
            determinada. Así se resolvieron.
          </p>
        </Reveal>

        <div className="mt-20 space-y-24 md:space-y-32">
          {featuredProjects.map((p, i) => (
            <FeaturedItem key={p.slug} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
