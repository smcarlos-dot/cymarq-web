'use client';

import Reveal from '@/components/Reveal';
import { momento, whatsappMessages, whatsappUrl } from '@/data/site';

/**
 * Segunda sección de la home.
 * Antes de hablar de CYMARQ, nombramos el momento en el que está
 * quien nos lee: acaba de comprar un lote y no sabe por dónde empezar.
 */
export default function Momento() {
  return (
    <section id="momento" className="scroll-mt-20 bg-paper py-24 md:py-32">
      <div className="container-x">
        {/* El titular va a todo el ancho: en una columna estrecha se partía en
            líneas muy cortas ("más" / "importantes de") y se leía mal. */}
        <div className="max-w-4xl">
          <Reveal>
            <span className="section-label">{momento.label}</span>
            <h2 className="h-display text-balance">
              Construir una casa es una de las decisiones más importantes de{' '}
              <em className="text-gold">una familia.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-8 text-lg leading-relaxed text-stone">{momento.intro}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-20">
          <ul className="divide-y divide-mist border-y border-mist">
            {momento.questions.map((q, i) => (
              <li key={q}>
                <Reveal delay={i * 0.08}>
                  <div className="flex items-baseline gap-6 py-6">
                    <span className="font-display text-sm text-gold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-xl leading-snug md:text-2xl">{q}</span>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>

          <Reveal delay={0.2}>
            <div className="border-l-2 border-gold bg-mist/60 p-8 md:p-10">
              <p className="font-display text-2xl leading-snug md:text-3xl">{momento.closing}</p>
              <a
                href={whatsappUrl(whatsappMessages.general)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-line mt-8 text-ink"
              >
                {momento.cta}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
