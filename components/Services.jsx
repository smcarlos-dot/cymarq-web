'use client';

import Reveal from '@/components/Reveal';
import { services, site } from '@/data/site';

export default function Services() {
  return (
    <section id="servicios" className="scroll-mt-20 bg-ink py-24 text-white md:py-32">
      <div className="container-x">
        <Reveal>
          <span className="section-label">Servicios</span>
          <h2 className="h-display max-w-3xl">
            Todo el ciclo del proyecto, <em className="text-gold">de la idea a la obra.</em>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.1} className="bg-ink">
              <article className="group flex h-full flex-col bg-ink p-8 transition-colors duration-500 ease-cinema hover:bg-white/5">
                <span className="font-display text-sm text-white/30 transition-colors duration-500 group-hover:text-gold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-xl">{s.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60">{s.text}</p>
                <div className="mt-6 h-px w-8 bg-gold/60 transition-all duration-700 ease-cinema group-hover:w-full" />
              </article>
            </Reveal>
          ))}

          {/* Tarjeta CTA */}
          <Reveal delay={0.2} className="bg-ink">
            <a
              href={site.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col justify-between bg-gold p-8 text-ink transition-colors duration-500 hover:bg-white"
            >
              <span className="font-display text-sm opacity-60">12</span>
              <div>
                <h3 className="font-display text-2xl">¿Tienes un proyecto en mente?</h3>
                <p className="mt-3 text-sm font-medium uppercase tracking-widest2">
                  Hablemos →
                </p>
              </div>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
