'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import Reveal from '@/components/Reveal';
import { featuredProjects } from '@/data/projects';

/**
 * Muestra del portafolio en la home.
 *
 * Es una muestra, no el portafolio: tres proyectos con lo justo para dar ganas
 * de abrirlos. El problema, la solución y el resto de la historia están en la
 * página de cada proyecto, que es donde toca contarlos; repetirlos aquí hacía
 * la home interminable en móvil sin añadir nada.
 */

const EN_LA_HOME = 3;

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
    <div ref={ref} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
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
          <p className="text-xs uppercase tracking-widest2 text-gold">
            {project.type} · {project.year}
          </p>
          <h3 className="mt-3 font-display text-2xl leading-snug md:text-3xl">{project.name}</h3>
          <p className="mt-4 leading-relaxed text-stone">{project.short}</p>
          <Link
            href={`/proyectos/${project.slug}/`}
            className="link-underline mt-6 inline-block text-xs uppercase tracking-widest2 text-ink"
          >
            Ver la historia completa →
          </Link>
        </Reveal>
      </div>
    </div>
  );
}

export default function FeaturedProjects() {
  const items = featuredProjects.slice(0, EN_LA_HOME);

  return (
    <section id="destacados" className="scroll-mt-20 bg-paper py-20 md:py-32">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="section-label">Proyectos</span>
              <h2 className="h-display">
                Cada proyecto empezó con <em className="text-gold">una conversación.</em>
              </h2>
              <p className="mt-6 text-stone">
                Un problema real, un lote concreto y alguien que quería vivir o trabajar de
                una forma determinada.
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

        <div className="mt-14 space-y-16 md:mt-20 md:space-y-24">
          {items.map((p, i) => (
            <FeaturedItem key={p.slug} project={p} index={i} />
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-16 border-t border-mist pt-10 text-center">
            <Link
              href="/proyectos/"
              className="link-underline text-xs uppercase tracking-widest2 text-ink"
            >
              Ver el portafolio completo →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
