'use client';

import Reveal from '@/components/Reveal';
import { site } from '@/data/site';

const channels = [
  {
    label: 'WhatsApp',
    value: site.whatsapp,
    href: site.whatsappLink,
  },
  {
    label: 'Correo electrónico',
    value: site.email,
    href: `mailto:${site.email}`,
  },
  {
    label: 'Instagram',
    value: '@cymarq_obras',
    href: site.instagram,
  },
  {
    label: 'Facebook',
    value: 'cymarq.obras',
    href: site.facebook,
  },
];

export default function Contact() {
  return (
    <section id="contacto" className="scroll-mt-20 relative overflow-hidden bg-ink py-24 text-white md:py-32">
      {/* Imagen de fondo sutil */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: "url('/photos/fachada.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/80 to-ink" aria-hidden="true" />

      <div className="container-x relative z-10">
        <Reveal>
          <span className="section-label">Contacto</span>
          <h2 className="h-display max-w-3xl">
            Transformemos tu idea en un <em className="text-gold">espacio con propósito.</em>
          </h2>
          <p className="mt-6 max-w-xl text-white/70">
            Prestamos nuestros servicios en todo el territorio colombiano. Escríbenos y
            conversemos sobre tu proyecto.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.1} className="bg-ink">
              <a
                href={c.href}
                target={c.href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="group block h-full bg-ink p-8 transition-colors duration-500 hover:bg-white/5"
              >
                <p className="text-[11px] uppercase tracking-widest2 text-white/50">{c.label}</p>
                <p className="mt-3 font-display text-lg text-white transition-colors duration-300 group-hover:text-gold">
                  {c.value}
                </p>
                <div className="mt-6 h-px w-8 bg-gold/60 transition-all duration-700 ease-cinema group-hover:w-full" />
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <div className="mt-16 text-center">
            <a
              href={site.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-line text-white"
            >
              Iniciar conversación
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
