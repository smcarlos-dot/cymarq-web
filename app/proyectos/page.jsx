import Link from 'next/link';
import PortfolioGrid from '@/components/PortfolioGrid';
import Reveal from '@/components/Reveal';
import { whatsappMessages, whatsappUrl } from '@/data/site';

const title = 'Portafolio de proyectos';
const description =
  'Portafolio de CYMARQ: proyectos residenciales, comerciales, de espacio público e infraestructura diseñados y desarrollados en Cúcuta y Norte de Santander.';

export const metadata = {
  title,
  description,
  alternates: {
    canonical: '/proyectos/',
  },
  openGraph: {
    title: `${title} | CYMARQ`,
    description,
    url: '/proyectos/',
    siteName: 'CYMARQ',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/photos/edificio-cyma.webp',
        width: 1200,
        height: 630,
        alt: 'CYMARQ — Edificio CYMA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | CYMARQ`,
    description,
    images: ['/photos/edificio-cyma.webp'],
  },
};

export default function ProyectosPage() {
  return (
    <>
      {/* Hero corto */}
      <section className="bg-ink pb-16 pt-36 text-white md:pb-24 md:pt-44">
        <div className="container-x">
          <Reveal>
            <span className="section-label">Portafolio</span>
            <h1 className="h-display max-w-4xl">
              Cada proyecto nace de{' '}
              <em className="text-gold">una historia diferente.</em>
            </h1>
            <p className="mt-6 max-w-xl text-white/70">
              Un lote concreto, una familia o un negocio con una necesidad real y una
              solución pensada solo para ellos. Filtra por el tipo de proyecto que se
              parece al tuyo.
            </p>
          </Reveal>
        </div>
      </section>

      <PortfolioGrid />

      <section className="bg-paper py-24 text-center">
        <Reveal>
          <p className="mx-auto max-w-2xl font-display text-3xl leading-snug">
            El siguiente proyecto de esta lista puede ser tu casa.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-stone">
            Cuéntanos dónde está tu lote y cómo quieres vivir. La primera conversación no
            cuesta nada.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <a
              href={whatsappUrl(whatsappMessages.lote)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#25D366] px-8 py-4 font-sans text-xs font-medium uppercase tracking-widest2 text-white transition-transform duration-500 ease-cinema hover:scale-[1.03]"
            >
              Hablar por WhatsApp
              <span aria-hidden="true">→</span>
            </a>
            <Link
              href="/#renders"
              className="link-underline text-xs uppercase tracking-widest2 text-ink"
            >
              Ver cómo visualizarás tu casa →
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
