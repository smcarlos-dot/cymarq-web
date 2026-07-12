'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Reveal from '@/components/Reveal';
import { renderVideos, renderPhotos } from '@/data/site';

/**
 * Sección Renders: videos (respetando su orientación vertical/horizontal)
 * y galería de imágenes. Carga diferida y reproducción exclusiva —
 * nunca suenan dos videos a la vez.
 */
function VideoCard({ video, activeSrc, onPlay }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const isActive = activeSrc === video.src;

  // Pausar si otro video comienza
  if (ref.current && !isActive && !ref.current.paused) {
    ref.current.pause();
  }

  const handlePlay = () => {
    setStarted(true);
    onPlay(video.src);
    requestAnimationFrame(() => {
      ref.current?.play();
    });
  };

  return (
    <figure className="group relative overflow-hidden bg-ink">
      <div className={`relative ${video.vertical ? 'aspect-[9/16]' : 'aspect-video'}`}>
        <video
          ref={ref}
          src={video.src}
          poster={video.poster}
          preload="none"
          controls={started}
          playsInline
          onPlay={() => onPlay(video.src)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {!started && (
          <button
            onClick={handlePlay}
            aria-label={`Reproducir: ${video.title}`}
            className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors duration-500 hover:bg-ink/10"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-ink/40 backdrop-blur-sm transition-all duration-500 ease-cinema group-hover:scale-110 group-hover:border-gold">
              <svg viewBox="0 0 24 24" className="ml-1 h-5 w-5 fill-white" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      {!started && (
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 text-[11px] uppercase tracking-widest2 text-white">
          {video.title}
        </figcaption>
      )}
    </figure>
  );
}

function Lightbox({ photo, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.img
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        src={photo.src}
        alt={photo.alt}
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-300 hover:border-gold hover:text-gold"
      >
        ✕
      </button>
      <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-widest2 text-white/70">
        {photo.alt}
      </p>
    </motion.div>
  );
}

export default function Renders() {
  const [activeSrc, setActiveSrc] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  return (
    <section id="renders" className="scroll-mt-20 bg-paper py-24 md:py-32">
      <div className="container-x">
        <Reveal>
          <span className="section-label">Renders</span>
          <h2 className="h-display max-w-3xl">
            El proyecto en movimiento, <em className="text-gold">antes de construirse.</em>
          </h2>
        </Reveal>

        {/* Videos — verticales en su formato original */}
        <div className="mt-16 grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
          {renderVideos.map((v, i) => (
            <Reveal key={v.src} delay={(i % 4) * 0.1}>
              <VideoCard video={v} activeSrc={activeSrc} onPlay={setActiveSrc} />
            </Reveal>
          ))}
        </div>

        {/* Galería de imágenes */}
        <Reveal>
          <h3 className="mt-24 font-display text-2xl md:text-3xl">
            Visualización arquitectónica
          </h3>
        </Reveal>
        <div className="mt-10 columns-2 gap-4 md:columns-3 md:gap-6 [&>*]:mb-4 md:[&>*]:mb-6">
          {renderPhotos.map((p, i) => (
            <Reveal key={p.src} delay={(i % 3) * 0.08}>
              <button
                onClick={() => setLightbox(p)}
                className="img-zoom group relative block w-full break-inside-avoid overflow-hidden"
                aria-label={`Ampliar: ${p.alt}`}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="w-full object-cover"
                />
                <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/25" />
                <span className="absolute bottom-3 left-3 text-[11px] uppercase tracking-widest2 text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  {p.alt}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </section>
  );
}
