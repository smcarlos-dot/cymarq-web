'use client';

import { motion } from 'framer-motion';
import Reveal from '@/components/Reveal';
import { about } from '@/data/site';

export default function About() {
  return (
    <section id="nosotros" className="scroll-mt-20 bg-paper py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Texto */}
          <div>
            <Reveal>
              <span className="section-label">Nosotros</span>
              <h2 className="h-display">
                Diseñamos espacios con propósito.{' '}
                <em className="text-gold">Construimos confianza.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 text-lg leading-relaxed text-stone">{about.intro}</p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-6 leading-relaxed text-stone">{about.extra}</p>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="mt-10 flex flex-wrap gap-2">
                {about.values.map((v) => (
                  <span
                    key={v}
                    className="border border-mist bg-mist px-4 py-2 text-xs uppercase tracking-wider text-stone transition-colors duration-500 hover:border-gold hover:text-ink"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Imagen con parallax sutil */}
          <Reveal delay={0.2} className="relative">
            <div className="img-zoom overflow-hidden">
              <img
                src="/photos/living.webp"
                alt="Interior diseñado por CYMARQ"
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-8 -left-4 bg-ink p-8 text-white md:-left-10"
            >
              <p className="font-display text-4xl text-gold">100%</p>
              <p className="mt-1 text-xs uppercase tracking-widest2 text-white/70">
                Cobertura nacional
              </p>
            </motion.div>
          </Reveal>
        </div>

        {/* Pilares */}
        <div className="mt-32 grid gap-px bg-mist sm:grid-cols-2 lg:grid-cols-4">
          {about.pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.12} className="bg-paper">
              <div className="group h-full border-t-2 border-transparent bg-paper p-8 transition-all duration-500 ease-cinema hover:border-gold hover:bg-mist/60">
                <span className="font-display text-3xl text-mist transition-colors duration-500 group-hover:text-gold">
                  0{i + 1}
                </span>
                <h3 className="mt-4 font-display text-xl">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
