'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useIsoLayoutEffect from '@/lib/useIsoLayoutEffect';
import { hero, whatsappMessages, whatsappUrl } from '@/data/site';

// Recorte del margen transparente del logo.
// El logo vive dentro de un encuadre 16:9 con mucho vacío alrededor, y por eso
// se veía pequeño. La marca ocupa el 28,1 %–71,9 % del ancho y el 13,9 %–86,1 %
// del alto; el destello suelto de la derecha (≈89 %–92 %) queda fuera del
// recorte a propósito, porque descentraba la composición.
// Si se cambia el vídeo del logo, hay que recalcular estos valores.
const LOGO_CROP = (() => {
  const left = 0.22;
  const top = 0.11;
  const width = 0.78 - left;
  const height = 0.89 - top;
  return {
    aspect: ((width * 16) / (height * 9)).toFixed(3),
    media: {
      width: `${(100 / width).toFixed(2)}%`,
      transform: `translate(${(-left * 100).toFixed(2)}%, ${(-top * 100).toFixed(2)}%)`,
    },
  };
})();

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 1, ease: [0.22, 1, 0.36, 1] },
});

export default function Hero() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

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
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center overflow-hidden bg-ink"
      style={{ minHeight: '100svh' }}
    >
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
      {/* Velo sobre el vídeo: lo justo para que el texto se lea, dejando ver
          el timelapse. Se oscurece arriba (por el menú) y abajo (para empalmar
          con la sección siguiente), pero el centro queda claro. */}
      <div className="absolute inset-0 bg-ink/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-ink/45" />
      {/* Sombra suave sólo detrás del bloque de texto. Sin ella, los fotogramas
          de cielo claro dejan el titular por debajo del contraste legible. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 78% 62% at 50% 58%, rgba(17,17,17,0.36) 0%, rgba(17,17,17,0.27) 50%, rgba(17,17,17,0) 100%)',
        }}
      />

      {/* Contenido */}
      {/* Las variantes por altura de pantalla (max-height) encogen la marca y
          los espacios en portátiles bajos (720 px) para que el botón de
          WhatsApp nunca quede por debajo del pliegue. */}
      <div className="container-x relative z-10 flex w-full flex-col items-center py-16 text-center text-white md:py-20 [@media(max-height:800px)]:py-14 [@media(max-height:720px)]:pb-10 [@media(max-height:720px)]:pt-24">
        {/* Marca.
            El vídeo y el PNG de respaldo comparten encuadre (el PNG es su último
            frame) y dejan mucho margen transparente alrededor. Recortamos ese
            aire (ver LOGO_CROP) para que la marca se vea grande sin que el
            hueco vacío empuje el resto del hero fuera de pantalla. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[340px] overflow-hidden sm:max-w-[370px] md:max-w-[400px] lg:max-w-[420px] [@media(max-height:800px)]:max-w-[340px] [@media(max-height:720px)]:max-w-[270px]"
          style={{ aspectRatio: `${LOGO_CROP.aspect} / 1` }}
        >
          {useLogoVideo ? (
            <video
              className="absolute left-0 top-0 max-w-none"
              style={LOGO_CROP.media}
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
              className="absolute left-0 top-0 max-w-none"
              style={LOGO_CROP.media}
            />
          )}
        </motion.div>

        <motion.h1
          {...fadeUp(0.35)}
          className="mt-6 max-w-3xl font-display text-4xl leading-[1.08] md:mt-8 md:text-5xl lg:text-6xl [@media(max-height:800px)]:mt-5 [@media(max-height:800px)]:lg:text-5xl [@media(max-height:720px)]:md:text-4xl"
        >
          Antes de construir tu hogar, <em className="not-italic text-gold">vívelo.</em>
        </motion.h1>

        <motion.p
          {...fadeUp(0.55)}
          className="mt-7 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg [@media(max-height:800px)]:mt-5"
        >
          {hero.subtitle}
        </motion.p>

        <motion.div
          {...fadeUp(0.75)}
          className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center [@media(max-height:800px)]:mt-7"
        >
          <a
            href={whatsappUrl(whatsappMessages.hero)}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-3 bg-gold px-8 py-4 text-center font-sans text-xs font-medium uppercase tracking-widest2 text-ink transition-all duration-500 ease-cinema hover:bg-white"
          >
            <svg viewBox="0 0 32 32" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
              <path d="M16.04 4c-6.6 0-11.96 5.33-11.96 11.9 0 2.1.56 4.14 1.62 5.94L4 28l6.32-1.65a12 12 0 0 0 5.71 1.45h.01c6.6 0 11.96-5.33 11.96-11.9C28 9.33 22.64 4 16.04 4Zm0 21.77h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.64-.24-.37a9.8 9.8 0 0 1-1.52-5.25c0-5.45 4.46-9.88 9.93-9.88a9.9 9.9 0 0 1 9.92 9.9c0 5.45-4.46 9.85-9.93 9.85Zm5.45-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9 9 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
            </svg>
            {hero.cta}
          </a>

          <Link
            href="/proyectos/"
            className="link-underline font-sans text-xs uppercase tracking-widest2 text-white/85 hover:text-white"
          >
            {hero.secondary} →
          </Link>
        </motion.div>

        <motion.p
          {...fadeUp(0.95)}
          className="mt-10 max-w-sm text-xs uppercase leading-relaxed tracking-widest2 text-white/60 [@media(max-height:800px)]:mt-6"
        >
          <span aria-hidden="true">📍 </span>
          {hero.place}
        </motion.p>
      </div>

      {/* Indicador de scroll */}
      <motion.div
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
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
