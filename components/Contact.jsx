'use client';

import Reveal from '@/components/Reveal';
import { finalCta, site, whatsappMessages, whatsappUrl } from '@/data/site';

const channels = [
  {
    label: 'Correo electrónico',
    value: site.email,
    href: `mailto:${site.email}`,
  },
  {
    label: 'Instagram',
    value: '@cymarq.obras',
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
    <section
      id="contacto"
      className="scroll-mt-20 relative overflow-hidden bg-ink py-24 text-white md:py-32"
    >
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
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink via-ink/80 to-ink"
        aria-hidden="true"
      />

      <div className="container-x relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="section-label">{finalCta.label}</span>
            <h2 className="h-display">
              ¿Ya tienes un lote y quieres{' '}
              <em className="text-gold">comenzar a construir?</em>
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-white/75">{finalCta.text}</p>
          </Reveal>

          <Reveal delay={0.15}>
            <a
              href={whatsappUrl(whatsappMessages.lote)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 inline-flex items-center gap-3 bg-[#25D366] px-10 py-5 font-sans text-sm font-medium uppercase tracking-widest2 text-white transition-transform duration-500 ease-cinema hover:scale-[1.03]"
            >
              <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M16.04 4c-6.6 0-11.96 5.33-11.96 11.9 0 2.1.56 4.14 1.62 5.94L4 28l6.32-1.65a12 12 0 0 0 5.71 1.45h.01c6.6 0 11.96-5.33 11.96-11.9C28 9.33 22.64 4 16.04 4Zm0 21.77h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.64-.24-.37a9.8 9.8 0 0 1-1.52-5.25c0-5.45 4.46-9.88 9.93-9.88a9.9 9.9 0 0 1 9.92 9.9c0 5.45-4.46 9.85-9.93 9.85Zm5.45-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9 9 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
              </svg>
              {finalCta.button}
            </a>
            <p className="mt-5 text-xs text-white/50">{finalCta.note}</p>
            <p className="mt-2 font-display text-lg text-white/80">{site.whatsapp}</p>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-px bg-white/10 sm:grid-cols-3">
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

        <Reveal delay={0.2}>
          <p className="mt-10 text-center text-xs uppercase tracking-widest2 text-white/50">
            📍 Cúcuta, su área metropolitana y Norte de Santander
          </p>
        </Reveal>
      </div>
    </section>
  );
}
