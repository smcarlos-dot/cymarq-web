'use client';

import { motion } from 'framer-motion';
import Reveal from '@/components/Reveal';
import AboutCarousel from '@/components/AboutCarousel';
import { about, ceo } from '@/data/site';

export default function About() {
  return (
    <section id="nosotros" className="scroll-mt-20 bg-paper py-20 md:py-32">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Texto */}
          <div>
            <Reveal>
              <span className="section-label">Cómo pensamos</span>
              <h2 className="h-display">
                La arquitectura comienza <em className="text-gold">escuchando.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 leading-relaxed text-stone md:mt-8 md:text-lg">{about.intro}</p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-6 leading-relaxed text-stone">{about.extra}</p>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-6 leading-relaxed text-stone">{about.team}</p>
            </Reveal>
            <Reveal delay={0.35}>
              <ul className="mt-8 space-y-3 border-l-2 border-gold pl-6 md:mt-10 md:space-y-4">
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

        {/* Quién responde por el trabajo.
            El dato publicado es verificable por cualquiera en los registros
            del CPNAA y el COPNIA; la cédula y el resto de la hoja de vida no
            se publican porque no le sirven a nadie aquí. */}
        <div className="mt-14 border-t border-mist pt-10 md:mt-28 md:pt-12">
          <Reveal>
            <span className="section-label">Quién responde</span>
          </Reveal>
          <div className="mt-6 grid gap-8 md:mt-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
            <Reveal>
              <h3 className="font-display text-xl leading-snug md:text-3xl">{ceo.nombre}</h3>
              <p className="mt-2 text-xs uppercase tracking-widest2 text-gold">{ceo.rol}</p>
              <p className="mt-5 text-[15px] leading-relaxed text-stone md:mt-6 md:text-base">{ceo.bio}</p>
              <a
                href={ceo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline mt-5 inline-block text-xs uppercase tracking-widest2 text-ink md:mt-6"
              >
                Perfil profesional en LinkedIn →
              </a>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="bg-mist p-6 md:p-8">
                <p className="text-[11px] uppercase tracking-widest2 text-ink/60">
                  Formación
                </p>
                <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-stone md:mt-4 md:space-y-3 md:text-sm">
                  {ceo.titulos.map((t) => (
                    <li key={t.titulo} className="flex gap-3">
                      <span aria-hidden="true" className="mt-[9px] h-px w-3 shrink-0 bg-gold" />
                      <span>
                        <strong className="font-medium text-ink">{t.titulo}</strong>
                        <br />
                        {t.entidad}, {t.anio}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-[11px] uppercase tracking-widest2 text-ink/60 md:mt-7">
                  Matrículas vigentes
                </p>
                <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-stone md:mt-4 md:space-y-3 md:text-sm">
                  {ceo.credenciales.map((c) => (
                    <li key={c.numero} className="flex gap-3">
                      <span aria-hidden="true" className="mt-[9px] h-px w-3 shrink-0 bg-gold" />
                      <span>
                        <strong className="font-medium text-ink">{c.numero}</strong>
                        <br />
                        {c.nombre} —{' '}
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-underline text-ink hover:text-gold"
                        >
                          {c.entidadCorta}
                        </a>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs leading-relaxed text-stone/70 md:mt-6">
                  Ambas matrículas se pueden verificar directamente en los registros públicos
                  del CPNAA y el COPNIA.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Pilares */}
        <div className="mt-16 grid grid-cols-2 gap-px bg-mist md:mt-28 lg:grid-cols-4">
          {about.pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.12} className="bg-paper">
              <div className="group h-full border-t-2 border-transparent bg-paper p-5 transition-all duration-500 ease-cinema hover:border-gold hover:bg-mist/60 sm:p-8">
                <span className="font-display text-2xl text-mist transition-colors duration-500 group-hover:text-gold sm:text-3xl">
                  0{i + 1}
                </span>
                <h3 className="mt-3 font-display text-base leading-snug sm:mt-4 sm:text-xl">{p.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-stone sm:mt-3 sm:text-sm">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
