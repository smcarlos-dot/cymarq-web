'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useIsoLayoutEffect from '@/lib/useIsoLayoutEffect';

export default function Hero() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const logoRef = useRef(null);

  // Fallback: navegadores sin soporte de WebM VP9 con canal alfa (p. ej. Safari)
  // muestran el PNG transparente del último frame.
  const [useLogoVideo, setUseLogoVideo] = useState(true);

  useEffect(() => {
    const v = document.createElement('video');
    const canVp9 = v.canPlayType('video/webm; codecs="vp9"');
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (!canVp9 || isSafari) setUseLogoVideo(false);
  }, []);

  // Parallax cinematográfico del video de fondo con GSAP
  useIsoLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to(videoRef.current, {
        yPercent: 25,
        scale: 1.15,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-ink">
      {/* Video de fondo */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        src="/videos/timelapse-edificio-cyma.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/photos/edificio-cyma.webp"
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-ink/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />

      {/* Contenido */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        {/* Título accesible para SEO (el logo es visual) */}
        <h1 className="sr-only">CYMARQ — Arquitectura, Diseño y Construcción</h1>

        {/* Animación del logo con fondo transparente (chroma eliminado).
            Se reproduce una vez y queda congelada en el último frame. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl"
        >
          {useLogoVideo ? (
            <video
              ref={logoRef}
              className="aspect-video w-full object-contain"
              src="/videos/logo-intro.webm"
              autoPlay
              muted
              playsInline
              preload="auto"
              onError={() => setUseLogoVideo(false)}
              aria-hidden="true"
            />
          ) : (
            <img
              src="/brand/logo-final.png"
              alt=""
              aria-hidden="true"
              className="aspect-video w-full object-contain"
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="-mt-4 md:-mt-8"
        >
          <Link href="/proyectos/" className="btn-line text-white">
            Explorar proyectos
            <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </div>

      {/* Indicador de scroll */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="h-12 w-px bg-gradient-to-b from-transparent via-white/70 to-transparent"
        />
      </motion.div>
    </section>
  );
}
