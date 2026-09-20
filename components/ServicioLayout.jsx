import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import Reveal from '@/components/Reveal';
import { getServicio, servicioPath } from '@/data/servicios';
import { faqLinksFor } from '@/data/faq';
import { whatsappMessages, whatsappUrl } from '@/data/site';
import { fechaLarga } from '@/lib/seo';

/**
 * Maqueta de las páginas de servicio.
 *
 * Comparten estructura porque el visitante agradece encontrar lo mismo en el
 * mismo sitio, pero el contenido de cada una es propio: ninguna es una copia
 * de otra cambiando una palabra.
 *
 * El bloque "En resumen" va arriba a propósito. Es una respuesta completa y
 * autocontenida a la pregunta principal de la página, para quien llega con
 * prisa desde un buscador y para cualquier sistema que necesite citar la
 * respuesta sin recomponerla a partir de media página.
 */

function WhatsAppCta({ message, children, className = '' }) {
  return (
    <a
      href={whatsappUrl(whatsappMessages[message] || whatsappMessages.general)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export default function ServicioLayout({ servicio }) {
  const path = servicioPath(servicio.slug);
  const faqItems = faqLinksFor(servicio.faq || []);
  const related = (servicio.related || []).map(getServicio).filter(Boolean);

  return (
    <>
      {/* Encabezado */}
      <section className="bg-ink pb-16 pt-32 text-white md:pb-24 md:pt-40">
        <div className="container-x">
          <Breadcrumbs
            trail={[
              { name: 'Inicio', path: '/' },
              { name: 'Servicios', path: '/servicios/' },
              { name: servicio.nav, path },
            ]}
          />
          <Reveal>
            <h1 className="h-display mt-8 max-w-4xl">{servicio.h1}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{servicio.lead}</p>
            <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <WhatsAppCta
                message={servicio.cta.message}
                className="inline-flex items-center gap-3 bg-gold px-8 py-4 font-sans text-xs font-medium uppercase tracking-widest2 text-ink transition-colors duration-500 hover:bg-white"
              >
                {servicio.cta.button}
              </WhatsAppCta>
              <Link
                href="/preguntas-frecuentes/"
                className="link-underline text-xs uppercase tracking-widest2 text-white/80"
              >
                Ver preguntas frecuentes →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Respuesta directa */}
      <section className="bg-gold/10 py-16 md:py-20">
        <div className="container-x">
          <Reveal>
            <div className="max-w-3xl border-l-2 border-gold pl-6 md:pl-8">
              <p className="text-[11px] uppercase tracking-widest2 text-ink/60">
                {servicio.respuesta.title}
              </p>
              <p className="mt-4 text-lg leading-relaxed md:text-xl">{servicio.respuesta.text}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Imagen del servicio */}
      {servicio.cover && (
        <div className="bg-paper">
          <div className="container-x">
            <div className="img-zoom relative aspect-[16/7] overflow-hidden">
              <img
                src={servicio.cover}
                alt={servicio.coverAlt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}

      {/* Desarrollo */}
      <section className="bg-paper py-20 md:py-28">
        <div className="container-x">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-20">
            <div className="max-w-2xl space-y-16">
              {servicio.secciones.map((sec) => (
                <Reveal key={sec.id}>
                  <article id={sec.id} className="scroll-mt-28">
                    <h2 className="font-display text-2xl leading-snug md:text-3xl">{sec.title}</h2>
                    <div className="mt-5 space-y-4 leading-relaxed text-stone">
                      {sec.body.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                    {sec.list && (
                      <div className="mt-8 border-l-2 border-gold/50 pl-6">
                        <p className="text-[11px] uppercase tracking-widest2 text-ink/70">
                          {sec.list.title}
                        </p>
                        <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-stone">
                          {sec.list.items.map((li) => (
                            <li key={li} className="flex gap-3">
                              <span
                                aria-hidden="true"
                                className="mt-[10px] h-px w-3 shrink-0 bg-gold"
                              />
                              <span>{li}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                </Reveal>
              ))}

              {/* La normativa cambia: decir desde cuándo se sostiene el texto
                  es parte de la información, no un adorno. */}
              <Reveal>
                <p className="border-t border-stone/15 pt-6 text-xs text-stone/70">
                  Contenido revisado el {fechaLarga()}. La normativa urbanística cambia y cada
                  predio tiene condiciones propias: antes de decidir, conviene verificar la
                  norma vigente aplicable a tu inmueble ante la autoridad competente.
                </p>
              </Reveal>
            </div>

            {/* Columna lateral: entregables y fuentes oficiales */}
            <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <div className="bg-mist p-8">
                  <p className="text-[11px] uppercase tracking-widest2 text-gold">
                    {servicio.incluye.title}
                  </p>
                  <ul className="mt-5 space-y-3 text-sm leading-relaxed text-stone">
                    {servicio.incluye.items.map((li) => (
                      <li key={li} className="flex gap-3">
                        <span aria-hidden="true" className="mt-[9px] h-px w-3 shrink-0 bg-gold" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              {servicio.oficial && (
                <Reveal delay={0.1}>
                  <div className="border border-stone/20 p-8">
                    <p className="text-[11px] uppercase tracking-widest2 text-ink/60">
                      {servicio.oficial.title}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-stone">
                      {servicio.oficial.text}
                    </p>
                    <ul className="mt-5 space-y-3 text-sm">
                      {servicio.oficial.links.map((l) => (
                        <li key={l.href}>
                          <a
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-underline text-ink hover:text-gold"
                          >
                            {l.label} <span aria-hidden="true">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="bg-ink py-20 text-white md:py-28">
        <div className="container-x">
          <Reveal>
            <span className="section-label">{servicio.proceso.title}</span>
            <h2 className="h-display max-w-2xl">Así lo resolvemos</h2>
          </Reveal>
          <div className="mt-14 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {servicio.proceso.steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08} className="bg-ink">
                <div className="h-full bg-ink p-8">
                  <span className="font-display text-sm text-gold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-4 font-display text-lg leading-snug">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas relacionadas: enlazan a la FAQ, no duplican su contenido */}
      {faqItems.length > 0 && (
        <section className="bg-mist py-20 md:py-24">
          <div className="container-x">
            <Reveal>
              <span className="section-label">Preguntas frecuentes</span>
              <h2 className="h-display max-w-2xl">Lo que más nos preguntan sobre esto</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="mt-10 grid gap-px border-t border-stone/15 sm:grid-cols-2">
                {faqItems.map((q) => (
                  <li key={q.id} className="border-b border-stone/15">
                    <Link
                      href={`/preguntas-frecuentes/#${q.id}`}
                      className="group flex items-start justify-between gap-4 py-5 pr-2 sm:pr-8"
                    >
                      <span className="font-display text-base leading-snug transition-colors duration-300 group-hover:text-gold md:text-lg">
                        {q.q}
                      </span>
                      <span
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-gold transition-transform duration-300 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-10">
                <Link
                  href="/preguntas-frecuentes/"
                  className="link-underline text-xs uppercase tracking-widest2 text-ink"
                >
                  Ver las 50 preguntas frecuentes →
                </Link>
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* Servicios relacionados */}
      {related.length > 0 && (
        <section className="bg-paper py-20 md:py-24">
          <div className="container-x">
            <Reveal>
              <span className="section-label">También te puede servir</span>
            </Reveal>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <Reveal key={r.slug} delay={i * 0.08}>
                  <Link
                    href={servicioPath(r.slug)}
                    className="group flex h-full flex-col border-t-2 border-mist p-6 transition-colors duration-500 hover:border-gold"
                  >
                    <h3 className="font-display text-xl leading-snug transition-colors duration-300 group-hover:text-gold">
                      {r.nav}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-stone">{r.lead}</p>
                    <span className="mt-5 text-xs uppercase tracking-widest2 text-gold">
                      Ver servicio →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cierre */}
      <section className="bg-ink py-20 text-white md:py-28">
        <div className="container-x">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h-display">{servicio.cta.title}</h2>
              <p className="mt-6 text-lg leading-relaxed text-white/70">{servicio.cta.text}</p>
              <WhatsAppCta
                message={servicio.cta.message}
                className="mt-10 inline-flex items-center gap-3 bg-[#25D366] px-10 py-5 font-sans text-sm font-medium uppercase tracking-widest2 text-white transition-transform duration-500 ease-cinema hover:scale-[1.03]"
              >
                {servicio.cta.button}
              </WhatsAppCta>
              <p className="mt-5 text-xs text-white/50">Sin compromiso y sin costo.</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
