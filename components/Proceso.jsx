'use client';

import Reveal from '@/components/Reveal';
import { proceso, whatsappMessages, whatsappUrl } from '@/data/site';

/**
 * "Así convertimos una idea en un hogar".
 * Quien no conoce el proceso constructivo teme equivocarse:
 * ver el camino completo, paso a paso, es lo que quita ese miedo.
 */
export default function Proceso() {
  return (
    <section id="proceso" className="scroll-mt-20 bg-ink py-20 text-white md:py-32">
      <div className="container-x">
        <Reveal>
          <span className="section-label">{proceso.label}</span>
          <h2 className="h-display max-w-3xl">
            Así convertimos una idea en <em className="text-gold">un hogar.</em>
          </h2>
          <p className="mt-6 max-w-xl text-white/70">{proceso.intro}</p>
        </Reveal>

        <ol className="mt-10 grid gap-px bg-white/10 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {proceso.steps.map((s, i) => (
            <li key={s.title} className="bg-ink">
              <Reveal delay={(i % 3) * 0.1} className="h-full">
                <div className="group flex h-full gap-4 bg-ink px-5 py-5 transition-colors duration-500 ease-cinema hover:bg-white/5 md:flex-col md:gap-0 md:p-10">
                  <span className="mt-[3px] shrink-0 font-display text-sm leading-none text-white/25 transition-colors duration-500 group-hover:text-gold md:mt-0 md:text-4xl">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex flex-1 flex-col">
                    <h3 className="font-display text-base leading-snug md:mt-5 md:text-2xl">
                      {s.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/65 md:mt-4">
                      {s.text}
                    </p>
                    <div className="mt-4 h-px w-8 bg-gold/60 transition-all duration-700 ease-cinema group-hover:w-full md:mt-8" />
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col items-start gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:mt-16 md:pt-10">
            <p className="max-w-md font-display text-xl leading-snug md:text-2xl">
              El primer paso es una conversación. Nada más.
            </p>
            <a
              href={whatsappUrl(whatsappMessages.proceso)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-3 bg-gold px-8 py-4 font-sans text-xs font-medium uppercase tracking-widest2 text-ink transition-colors duration-500 hover:bg-white"
            >
              {proceso.cta}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
