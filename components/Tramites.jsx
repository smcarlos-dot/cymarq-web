'use client';

import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { serviciosOrdenados, servicioPath } from '@/data/servicios';
import { faqLinksFor } from '@/data/faq';
import { site } from '@/data/site';

/**
 * Puente entre la home y las páginas que resuelven una búsqueda concreta.
 *
 * Va alto en la página a propósito: mucha gente no llega buscando "una casa
 * bonita", sino con un trámite atascado —una licencia, un lote que quiere
 * dividir, una construcción sin papeles—. Esta sección les da el camino
 * directo, y de paso deja escrito, en lenguaje llano, qué es CYMARQ.
 */

/** Las preguntas con más volumen de búsqueda, una por frente de trabajo. */
const DESTACADAS = [
  'necesito-licencia-de-construccion-en-cucuta',
  'como-legalizar-una-casa-construida-sin-licencia',
  'puedo-dividir-mi-lote-en-dos',
  'que-puedo-construir-en-mi-lote',
  'licencia-para-construir-un-segundo-piso',
  'cuanto-cuesta-disenar-una-casa-en-cucuta',
];

export default function Tramites() {
  const preguntas = faqLinksFor(DESTACADAS);

  return (
    <section id="tramites" className="scroll-mt-20 bg-mist py-20 md:py-32">
      <div className="container-x">
        <Reveal>
          <span className="section-label">Qué hacemos</span>
          <h2 className="h-display max-w-3xl">
            Diseñamos, tramitamos y <em className="text-gold">construimos.</em>
          </h2>
          <p className="mt-6 max-w-2xl leading-relaxed text-stone md:text-lg">{site.entityDescription}</p>
        </Reveal>

        {/* Los cinco frentes con página propia */}
        <div className="mt-12 grid grid-cols-2 gap-px bg-stone/15 md:mt-14 lg:grid-cols-3">
          {serviciosOrdenados.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 3) * 0.08} className="bg-mist">
              <Link
                href={servicioPath(s.slug)}
                className="group flex h-full flex-col bg-mist p-5 transition-colors duration-500 ease-cinema hover:bg-paper sm:p-7 md:p-8"
              >
                <span className="font-display text-sm text-stone/40 transition-colors duration-500 group-hover:text-gold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 flex-1 font-display text-base leading-snug transition-colors duration-300 group-hover:text-gold sm:mt-4 sm:flex-none sm:text-xl">
                  {s.nav}
                </h3>
                <p className="mt-3 hidden flex-1 text-sm leading-relaxed text-stone sm:block">{s.lead}</p>
                <span className="mt-4 text-[10px] uppercase tracking-widest2 text-gold sm:mt-5 sm:text-[11px]">
                  Ver →
                </span>
              </Link>
            </Reveal>
          ))}

          {/* Sexta celda: entrada a las preguntas frecuentes */}
          <Reveal delay={0.16} className="col-span-2 bg-mist lg:col-span-1">
            <Link
              href="/preguntas-frecuentes/"
              className="group flex h-full flex-col justify-between gap-5 bg-ink p-6 text-white transition-colors duration-500 hover:bg-gold hover:text-ink sm:p-7 md:p-8"
            >
              <span className="font-display text-sm opacity-50">06</span>
              <div>
                <h3 className="font-display text-xl leading-snug">
                  ¿Tu duda es más concreta?
                </h3>
                <p className="mt-3 text-sm leading-relaxed opacity-70">
                  50 preguntas respondidas sobre licencias, lotes, legalización, uso del suelo
                  y costos en Cúcuta.
                </p>
                <p className="mt-5 text-[11px] uppercase tracking-widest2">
                  Ver preguntas frecuentes →
                </p>
              </div>
            </Link>
          </Reveal>
        </div>

        {/* Preguntas con más búsqueda */}
        <Reveal delay={0.1}>
          <div className="mt-14 border-t border-stone/15 pt-10">
            <p className="text-[11px] uppercase tracking-widest2 text-stone/70">
              Lo que más nos preguntan
            </p>
            <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {preguntas.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/preguntas-frecuentes/#${q.id}`}
                    className="group flex items-start gap-3 text-sm leading-relaxed text-stone transition-colors duration-300 hover:text-ink"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[10px] h-px w-3 shrink-0 bg-gold transition-all duration-500 group-hover:w-5"
                    />
                    <span>{q.q}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
