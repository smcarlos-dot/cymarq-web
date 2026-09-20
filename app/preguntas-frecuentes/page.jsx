import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import FaqList from '@/components/FaqList';
import JsonLd from '@/components/JsonLd';
import Reveal from '@/components/Reveal';
import { faqAll, faqCategories, faqPlainAnswer } from '@/data/faq';
import { whatsappMessages, whatsappUrl } from '@/data/site';
import {
  breadcrumbSchema,
  faqSchema,
  fechaLarga,
  graph,
  pageMetadata,
  webPageSchema,
} from '@/lib/seo';

const path = '/preguntas-frecuentes/';
const title =
  'Preguntas frecuentes sobre licencias, lotes y construcción en Cúcuta | CYMARQ';
const description =
  '50 respuestas sobre licencias de construcción, desenglobe de lotes, legalización de construcciones, uso del suelo y costos de diseñar y construir en Cúcuta.';

export const metadata = pageMetadata({
  title,
  socialTitle: 'Preguntas frecuentes sobre construir en Cúcuta | CYMARQ',
  description,
  path,
});

const trail = [
  { name: 'Inicio', path: '/' },
  { name: 'Preguntas frecuentes', path },
];

export default function PreguntasFrecuentesPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageSchema({
            path,
            name: 'Preguntas frecuentes sobre arquitectura y trámites urbanísticos en Cúcuta',
            description,
            breadcrumb: true,
            author: true,
          }),
          breadcrumbSchema(path, trail),
          faqSchema(
            path,
            faqAll.map((item) => ({ q: item.q, plain: faqPlainAnswer(item) })),
          ),
        ])}
      />

      {/* Encabezado */}
      <section className="bg-ink pb-16 pt-32 text-white md:pb-24 md:pt-40">
        <div className="container-x">
          <Breadcrumbs trail={trail} />
          <Reveal>
            <h1 className="h-display mt-8 max-w-4xl">
              Preguntas frecuentes sobre{' '}
              <em className="text-gold">construir en Cúcuta.</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              Cincuenta preguntas reales sobre licencias, lotes, legalización, norma
              urbanística y costos, respondidas sin rodeos y sin cifras inventadas. Cuando la
              respuesta depende de tu predio, lo decimos.
            </p>
          </Reveal>

          {/* Índice de categorías */}
          <Reveal delay={0.12}>
            <nav aria-label="Categorías de preguntas" className="mt-12">
              <ul className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
                {faqCategories.map((c, i) => (
                  <li key={c.id} className="bg-ink">
                    <a
                      href={`#${c.id}`}
                      className="group flex h-full flex-col justify-between gap-4 bg-ink p-6 transition-colors duration-500 hover:bg-white/5"
                    >
                      <span className="font-display text-sm text-white/30 transition-colors duration-500 group-hover:text-gold">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-display text-base leading-snug text-white">
                        {c.title}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest2 text-white/40">
                        {c.questions.length} preguntas
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        </div>
      </section>

      {/* Preguntas */}
      <section className="bg-paper py-20 md:py-28">
        <div className="container-x">
          <div className="max-w-3xl">
            <FaqList categories={faqCategories} />
          </div>
        </div>
      </section>

      {/* Aviso: alcance de la información */}
      <section className="bg-mist py-14">
        <div className="container-x">
          <div className="max-w-3xl border-l-2 border-gold pl-6 text-sm leading-relaxed text-stone md:pl-8">
            <p className="text-xs uppercase tracking-widest2 text-stone/60">
              Contenido revisado el {fechaLarga()}
            </p>
            <p className="mt-4">
              Esta información es de orientación general sobre trámites urbanísticos en
              Colombia y en Cúcuta. La normativa cambia y cada predio tiene condiciones
              propias: antes de tomar una decisión conviene verificar la norma vigente
              aplicable a tu inmueble ante la autoridad competente. Si quieres, lo revisamos
              contigo.
            </p>
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="bg-ink py-20 text-white md:py-28">
        <div className="container-x">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h-display">¿Tu caso no está en la lista?</h2>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                Cuéntanos qué predio es y qué quieres hacer. Revisamos la norma aplicable y te
                decimos qué se puede y qué no, antes de que gastes en nada.
              </p>
              <a
                href={whatsappUrl(whatsappMessages.faq)}
                data-cta="faq-cierre"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex items-center gap-3 bg-[#25D366] px-10 py-5 font-sans text-sm font-medium uppercase tracking-widest2 text-white transition-transform duration-500 ease-cinema hover:scale-[1.03]"
              >
                Resolver mi caso por WhatsApp
              </a>
              <p className="mt-5 text-xs text-white/50">Sin compromiso y sin costo.</p>
              <p className="mt-8 text-sm">
                <Link href="/servicios/" className="link-underline text-white/70 hover:text-gold">
                  Ver todos los servicios de CYMARQ →
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
