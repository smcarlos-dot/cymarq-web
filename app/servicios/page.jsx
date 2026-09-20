import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import JsonLd from '@/components/JsonLd';
import Reveal from '@/components/Reveal';
import { serviciosOrdenados, servicioPath } from '@/data/servicios';
import { about, services, site, whatsappMessages, whatsappUrl } from '@/data/site';
import {
  breadcrumbSchema,
  graph,
  pageMetadata,
  webPageSchema,
} from '@/lib/seo';

const path = '/servicios/';
const title = 'Servicios de arquitectura y trámites urbanísticos en Cúcuta | CYMARQ';
const description =
  'Diseño arquitectónico y planos, licencias de construcción, desenglobe y subdivisión de lotes, reconocimiento de construcciones y obra. Todos los servicios de CYMARQ en Cúcuta.';

export const metadata = pageMetadata({
  title,
  socialTitle: 'Servicios de arquitectura en Cúcuta | CYMARQ',
  description,
  path,
});

const trail = [
  { name: 'Inicio', path: '/' },
  { name: 'Servicios', path },
];

/** Los servicios que no tienen página propia se explican aquí mismo. */
const otrosServicios = services.filter((s) => !s.href);

export default function ServiciosPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageSchema({
            path,
            name: 'Servicios de CYMARQ',
            description,
            breadcrumb: true,
          }),
          breadcrumbSchema(path, trail),
          {
            '@type': 'ItemList',
            '@id': `${site.url}${path}#servicios`,
            name: 'Servicios de CYMARQ',
            itemListElement: serviciosOrdenados.map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: s.h1,
              url: `${site.url}${servicioPath(s.slug)}`,
            })),
          },
        ])}
      />

      {/* Encabezado */}
      <section className="bg-ink pb-16 pt-32 text-white md:pb-24 md:pt-40">
        <div className="container-x">
          <Breadcrumbs trail={trail} />
          <Reveal>
            <h1 className="h-display mt-8 max-w-4xl">
              Arquitectura, trámites urbanísticos y{' '}
              <em className="text-gold">construcción en Cúcuta.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              Diseñar, tramitar y construir son tres problemas distintos que casi siempre
              acaban en la misma mesa. Aquí está todo el camino, con un solo equipo
              respondiendo por él.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Qué es CYMARQ: respuesta directa sobre la entidad */}
      <section className="bg-gold/10 py-16 md:py-20">
        <div className="container-x">
          <Reveal>
            <div className="max-w-3xl border-l-2 border-gold pl-6 md:pl-8">
              <p className="text-[11px] uppercase tracking-widest2 text-ink/60">Qué es CYMARQ</p>
              <p className="mt-4 text-lg leading-relaxed md:text-xl">{site.entityDescription}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Servicios con página propia */}
      <section className="bg-paper py-20 md:py-28">
        <div className="container-x">
          <Reveal>
            <span className="section-label">Servicios principales</span>
            <h2 className="h-display max-w-2xl">Cinco frentes, un mismo responsable</h2>
          </Reveal>

          <div className="mt-14 space-y-px bg-mist">
            {serviciosOrdenados.map((s, i) => (
              <Reveal key={s.slug} delay={(i % 3) * 0.06} className="bg-paper">
                <Link
                  href={servicioPath(s.slug)}
                  className="group grid gap-6 bg-paper p-6 transition-colors duration-500 hover:bg-mist/60 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] md:items-center md:gap-10 md:p-8"
                >
                  <div className="img-zoom relative aspect-[16/9] overflow-hidden">
                    <img
                      src={s.cover}
                      alt={s.coverAlt}
                      width={s.coverSize.width}
                      height={s.coverSize.height}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <span className="font-display text-sm text-stone/50 transition-colors duration-500 group-hover:text-gold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-2 font-display text-2xl leading-snug transition-colors duration-300 group-hover:text-gold">
                      {s.h1}
                    </h3>
                    <p className="mt-3 max-w-2xl leading-relaxed text-stone">{s.lead}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-xs uppercase tracking-widest2 text-gold transition-transform duration-500 group-hover:translate-x-1 md:shrink-0"
                  >
                    Ver →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios complementarios */}
      <section className="bg-mist py-20 md:py-24">
        <div className="container-x">
          <Reveal>
            <span className="section-label">También hacemos</span>
            <h2 className="h-display max-w-2xl">Servicios complementarios</h2>
            <p className="mt-6 max-w-xl text-stone">
              Trabajos que suelen acompañar a un proyecto y que también se contratan por
              separado.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-px bg-stone/15 sm:grid-cols-2 lg:grid-cols-3">
            {otrosServicios.map((s, i) => (
              <Reveal key={s.title} delay={(i % 3) * 0.08} className="bg-mist">
                <article className="h-full bg-mist p-8">
                  <h3 className="font-display text-xl leading-snug">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone">{s.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Misión y visión */}
      <section className="bg-paper pb-20 md:pb-24">
        <div className="container-x">
          <div className="grid gap-12 border-t border-mist pt-16 md:grid-cols-2 md:gap-20">
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

      {/* Puente a la FAQ */}
      <section className="bg-paper py-20 md:py-24">
        <div className="container-x">
          <Reveal>
            <div className="flex flex-col items-start gap-8 border-t border-stone/15 pt-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="font-display text-2xl leading-snug md:text-3xl">
                  ¿Tienes una duda concreta antes de contratar?
                </h2>
                <p className="mt-4 leading-relaxed text-stone">
                  Reunimos 50 preguntas sobre licencias, desenglobe, legalización, uso del
                  suelo y costos de diseño y construcción en Cúcuta, respondidas sin rodeos.
                </p>
              </div>
              <Link href="/preguntas-frecuentes/" className="btn-line shrink-0 text-ink">
                Ver preguntas frecuentes
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cierre */}
      <section className="bg-ink py-20 text-white md:py-28">
        <div className="container-x">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h-display">¿No sabes cuál de estos necesitas?</h2>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                Cuéntanos qué tienes —un lote, una casa construida, un trámite detenido— y te
                decimos por dónde empezar.
              </p>
              <a
                href={whatsappUrl(whatsappMessages.servicios)}
                data-cta="servicios-cierre"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex items-center gap-3 bg-[#25D366] px-10 py-5 font-sans text-sm font-medium uppercase tracking-widest2 text-white transition-transform duration-500 ease-cinema hover:scale-[1.03]"
              >
                Hablar por WhatsApp
              </a>
              <p className="mt-5 text-xs text-white/50">Sin compromiso y sin costo.</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
