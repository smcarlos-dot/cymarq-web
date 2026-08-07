'use client';

import { motion } from 'framer-motion';
import Reveal from '@/components/Reveal';
import AboutCarousel from '@/components/AboutCarousel';
import { about } from '@/data/site';

export default function About() {
  return (
    <section id="nosotros" className="scroll-mt-20 bg-paper py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Texto */}
          <div>
            <Reveal>
              <span className="section-label">Cómo pensamos</span>
              <h2 className="h-display">
                La arquitectura comienza <em className="text-gold">escuchando.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 text-lg leading-relaxed text-stone">{about.intro}</p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-6 leading-relaxed text-stone">{about.extra}</p>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-6 leading-relaxed text-stone">{about.team}</p>
            </Reveal>
            <Reveal delay={0.35}>
              <ul className="mt-10 space-y-4 border-l-2 border-gold pl-6">
                {about.manifesto.map((m) => (
                  <li key={m} className="font-display text-lg leading-snug md:text-xl">
                    {m}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Imagen con parallax sutil */}
          <Reveal delay={0.2} className="relative">
            <AboutCarousel />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-8 -left-4 bg-ink p-8 text-white md:-left-10"
            >
              <p className="font-display text-4xl text-gold">Cúcuta</p>
              <p className="mt-1 text-xs uppercase tracking-widest2 text-white/70">
                Norte de Santander
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
                <h3 className="mt-4 font-display text-xl leading-snug">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Misión y visión */}
        <div className="mt-24 grid gap-12 border-t border-mist pt-16 md:grid-cols-2 md:gap-20">
          <Reveal>
            <p className="text-[11px] uppercase tracking-widest2 text-gold">Misión</p>
            <p className="mt-4 leading-relaxed text-stone">{about.mision}</p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-[11px] uppercase tracking-widest2 text-gold">Visión</p>
            <p className="mt-4 leading-relaxed text-stone">{about.vision}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
