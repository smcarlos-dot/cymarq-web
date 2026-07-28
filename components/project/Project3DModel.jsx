'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Reveal from '@/components/Reveal';

/**
 * Bloque "Modelo 3D" de la ficha de proyecto.
 *
 * Ni el visor (Three.js) ni el archivo GLB se descargan al abrir la página:
 * sólo al pulsar "Explorar modelo 3D". Así la carga inicial del proyecto
 * y sus métricas web no se ven afectadas.
 */

const importViewer = () => import('@/components/viewer/CYMARQ3DViewer');

const CYMARQ3DViewer = dynamic(importViewer, {
  ssr: false,
  loading: () => (
    <div className="flex h-[62vh] min-h-[380px] items-center justify-center bg-ink text-[11px] uppercase tracking-widest2 text-white/50 md:h-[78vh]">
      Iniciando visor…
    </div>
  ),
});

const HIGHLIGHTS = [
  ['Vistas técnicas', 'Frente, posterior, laterales, superior e isométrica.'],
  ['Maqueta blanca', 'La volumetría pura, sin acabados ni distracciones.'],
  ['Recorrido libre', 'Orbita, acerca y desplaza el modelo a tu ritmo.'],
];

export default function Project3DModel({ model, title, poster, fileLabel }) {
  const [active, setActive] = useState(false);

  return (
    <section className="bg-ink py-24 text-white md:py-32">
      <div className="container-x">
        <Reveal>
          <span className="section-label">Modelo 3D</span>
          <h2 className="h-display max-w-3xl">
            Recorre el proyecto <em className="text-gold">en tres dimensiones.</em>
          </h2>
          <p className="mt-6 max-w-2xl leading-relaxed text-white/60">
            Más allá de los renders y el video, aquí el modelo arquitectónico es tuyo:
            gíralo, obsérvalo desde cualquier ángulo, cámbialo a maqueta blanca para leer
            la volumetría y estudia la casa como lo haría el equipo de diseño.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-12 border border-white/10">
            {active ? (
              <CYMARQ3DViewer model={model} title={title} fileLabel={fileLabel} />
            ) : (
              <div className="relative flex h-[62vh] min-h-[380px] items-center justify-center overflow-hidden md:h-[78vh]">
                {poster && (
                  <img
                    src={poster}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full scale-105 object-cover opacity-45 blur-[2px]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />

                <div className="relative z-10 flex flex-col items-center px-6 text-center">
                  <p className="text-[11px] uppercase tracking-widest2 text-gold">
                    Visor interactivo CYMARQ
                  </p>
                  <p className="mt-4 max-w-md font-display text-2xl leading-snug md:text-3xl">
                    {title}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActive(true)}
                    onPointerEnter={importViewer}
                    onFocus={importViewer}
                    className="btn-line mt-10 text-white"
                  >
                    Explorar modelo 3D
                  </button>
                  <p className="mt-6 text-[10px] uppercase tracking-widest2 text-white/35">
                    {fileLabel ? `${fileLabel} · ` : ''}se descarga sólo al pulsar
                  </p>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-3">
          {HIGHLIGHTS.map(([label, text], i) => (
            <Reveal key={label} delay={0.1 + i * 0.08}>
              <div className="h-full bg-ink p-6">
                <p className="text-[10px] uppercase tracking-widest2 text-gold">{label}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-[10px] uppercase tracking-widest2 text-white/30">
          Arrastrar: orbitar · Rueda o dos dedos: zoom · Clic derecho o dos dedos:
          desplazar
        </p>
      </div>
    </section>
  );
}
