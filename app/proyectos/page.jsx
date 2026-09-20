import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import PortfolioGrid from '@/components/PortfolioGrid';
import Reveal from '@/components/Reveal';
import { projects } from '@/data/projects';
import { site, whatsappMessages, whatsappUrl } from '@/data/site';
import {
  breadcrumbSchema,
  graph,
  pageMetadata,
  webPageSchema,
} from '@/lib/seo';

const path = '/proyectos/';
const title = 'Proyectos de arquitectura en Cúcuta y Norte de Santander | CYMARQ';
const description =
  'Portafolio de CYMARQ: viviendas, proyectos comerciales, edificaciones de uso mixto y espacio público diseñados en Cúcuta, Tibú y Norte de Santander.';

export const metadata = pageMetadata({
  title,
  socialTitle: 'Portafolio de proyectos | CYMARQ',
  description,
  path,
});

const trail = [
  { name: 'Inicio', path: '/' },
  { name: 'Proyectos', path },
];

export default function ProyectosPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageSchema({
            path,
            name: 'Portafolio de proyectos de CYMARQ',
            description,
            breadcrumb: true,
          }),
          breadcrumbSchema(path, trail),
          {
            '@type': 'ItemList',
            '@id': `${site.url}${path}#proyectos`,
            name: 'Proyectos de CYMARQ',
            itemListElement: projects.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: p.name,
              url: `${site.url}/proyectos/${p.slug}/`,
            })),
          },
        ])}
      />

      {/* Hero corto */}
      <section className="bg-ink pb-16 pt-32 text-white md:pb-24 md:pt-40">
        <div className="container-x">
          <Breadcrumbs trail={trail} />
          <Reveal>
            <span className="section-label mt-8">Portafolio</span>
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
              href="/servicios/diseno-arquitectonico/"
              className="link-underline text-xs uppercase tracking-widest2 text-ink"
            >
              Ver el servicio de diseño arquitectónico →
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
