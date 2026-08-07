'use client';

import Reveal from '@/components/Reveal';
import { whatsappMessages, whatsappUrl } from '@/data/site';

const STORY_BLOCKS = [
  { key: 'contexto', label: 'El contexto' },
  { key: 'problema', label: 'El problema' },
  { key: 'solucion', label: 'La solución' },
  { key: 'resultado', label: 'El resultado' },
];

export default function ProjectInfo({ project }) {
  const facts = [
    { label: 'Ubicación', value: project.location },
    { label: 'Año', value: project.year },
    { label: 'Estado', value: project.status },
    { label: 'Tipología', value: project.type },
    { label: 'Áreas', value: project.area },
  ];

  return (
    <section className="bg-paper py-24 md:py-32">
      <div className="container-x grid gap-16 lg:grid-cols-12">
        {/* Ficha técnica */}
        <aside className="lg:col-span-4">
          <Reveal>
            <span className="section-label">Información</span>
            <dl className="divide-y divide-mist border-y border-mist">
              {facts.map((f) => (
                <div key={f.label} className="grid grid-cols-3 gap-4 py-4">
                  <dt className="text-[11px] uppercase tracking-widest2 text-stone">
                    {f.label}
                  </dt>
                  <dd className="col-span-2 text-sm">{f.value}</dd>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-4 py-4">
                <dt className="text-[11px] uppercase tracking-widest2 text-stone">
                  Servicios
                </dt>
                <dd className="col-span-2 space-y-1 text-sm">
                  {project.services.map((s) => (
                    <p key={s}>{s}</p>
                  ))}
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10">
              <p className="text-[11px] uppercase tracking-widest2 text-stone">
                Sensaciones
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.sensations.map((s) => (
                  <span
                    key={s}
                    className="border border-mist px-3 py-1.5 text-xs text-stone"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </aside>

        {/* Descripción */}
        <div className="lg:col-span-8">
          <Reveal>
            <span className="section-label">El proyecto</span>
            <h2 className="font-display text-3xl md:text-4xl">
              {project.short}
            </h2>
          </Reveal>
          {project.story && (
            <div className="mt-10 grid gap-px bg-mist sm:grid-cols-2">
              {STORY_BLOCKS.map(({ key, label }, i) =>
                project.story[key] ? (
                  <Reveal key={key} delay={i * 0.08} className="bg-paper">
                    <div className="h-full bg-paper p-6 md:p-7">
                      <p className="text-[11px] uppercase tracking-widest2 text-gold">{label}</p>
                      <p className="mt-3 text-sm leading-relaxed text-stone">
                        {project.story[key]}
                      </p>
                    </div>
                  </Reveal>
                ) : null,
              )}
            </div>
          )}

          <div className="mt-10 space-y-6">
            {project.description.map((p, i) => (
              <Reveal key={i} delay={0.1 + i * 0.08}>
                <p className="leading-relaxed text-stone">{p}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <h3 className="mt-14 font-display text-2xl">Concepto de diseño</h3>
            <ul className="mt-6 grid gap-px bg-mist sm:grid-cols-2">
              {project.concept.map((c, i) => (
                <li key={c} className="flex items-start gap-4 bg-paper p-5">
                  <span className="font-display text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {project.video && (
            <Reveal delay={0.25}>
              <h3 className="mt-14 font-display text-2xl">Recorrido en video</h3>
              <div className="mt-6 aspect-video overflow-hidden bg-ink">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId(project.video)}`}
                  title={`Video — ${project.name}`}
                  className="h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </Reveal>
          )}

          <Reveal delay={0.3}>
            <div className="mt-16 border-l-2 border-gold bg-mist/60 p-8 md:p-10">
              <h3 className="font-display text-2xl leading-snug">
                ¿Quieres algo así en tu lote?
              </h3>
              <p className="mt-3 max-w-lg leading-relaxed text-stone">
                Cuéntanos dónde está tu terreno y cómo vive tu familia. Te decimos qué se
                puede hacer allí antes de que inviertas un peso en obra.
              </p>
              <a
                href={whatsappUrl(whatsappMessages.proyecto(project.name))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-line mt-8 text-ink"
              >
                Hablar por WhatsApp
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function youtubeId(url) {
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{6,})/);
  return m ? m[1] : url;
}
