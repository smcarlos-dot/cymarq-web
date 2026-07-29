'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Reveal from '@/components/Reveal';
import { IconCube } from '@/components/viewer/ViewerIcons';

/**
 * Bloque "Modelo 3D" de la ficha de proyecto.
 *
 * Va sobre fondo claro, entre dos secciones oscuras (galería y siguiente
 * proyecto), para que se lea como una pieza distinta dentro del recorrido.
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
    <section id="modelo-3d" className="scroll-mt-20 bg-paper py-24 md:py-32">
      <div className="container-x">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs font-medium uppercase tracking-widest2 text-gold">
              Modelo 3D
            </span>
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
          </div>
          <h2 className="h-display mt-4 max-w-3xl">
            No solo mires el proyecto: <em className="text-gold">recórrelo.</em>
          </h2>
          <p className="mt-6 max-w-2xl leading-relaxed text-stone">
            Más allá de los renders y el video, aquí el modelo arquitectónico es tuyo:
            gíralo, obsérvalo desde cualquier ángulo, cámbialo a maqueta blanca para leer
            la volumetría y estudia la casa como lo haría el equipo de diseño.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-12 border border-ink/10">
            {active ? (
              <CYMARQ3DViewer model={model} title={title} fileLabel={fileLabel} />
            ) : (
              <div className="relative flex h-[62vh] min-h-[380px] items-center justify-center overflow-hidden bg-ink md:h-[78vh]">
                {poster && (
                  <img
                    src={poster}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full scale-105 object-cover opacity-30 blur-[3px]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/60" />

                <div className="relative z-10 flex flex-col items-center px-6 text-center">
                  <p className="text-[11px] uppercase tracking-widest2 text-gold">
                    Visor interactivo CYMARQ
                  </p>
                  <p className="mt-4 max-w-md font-display text-2xl leading-snug text-white md:text-3xl">
                    {title}
                  </p>

                  <button
                    type="button"
                    onClick={() => setActive(true)}
                    onPointerEnter={importViewer}
                    onFocus={importViewer}
                    className="mt-10 inline-flex items-center gap-3 bg-gold px-8 py-5 font-sans text-xs uppercase tracking-widest2 text-ink transition-colors duration-500 ease-cinema hover:bg-white md:px-10"
                  >
                    <IconCube className="h-4 w-4" />
                    Explorar modelo 3D
                  </button>

                  <p className="mt-6 text-[10px] uppercase tracking-widest2 text-white/40">
                    {fileLabel ? `${fileLabel} · ` : ''}se descarga sólo al pulsar
                  </p>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-px bg-mist sm:grid-cols-3">
          {HIGHLIGHTS.map(([label, text], i) => (
            <Reveal key={label} delay={0.1 + i * 0.08}>
              <div className="h-full bg-paper p-6">
                <p className="text-[10px] uppercase tracking-widest2 text-gold">{label}</p>
                <p className="mt-3 text-sm leading-relaxed text-stone">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-[10px] uppercase tracking-widest2 text-stone/70">
          Arrastrar: orbitar · Rueda o dos dedos: zoom · Clic derecho o dos dedos:
          desplazar
        </p>
      </div>
    </section>
  );
}
