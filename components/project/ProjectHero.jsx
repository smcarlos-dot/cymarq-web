'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useIsoLayoutEffect from '@/lib/useIsoLayoutEffect';

export default function ProjectHero({ project }) {
  const sectionRef = useRef(null);
  const imgRef = useRef(null);

  useIsoLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to(imgRef.current, {
        yPercent: 20,
        scale: 1.12,
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
  }, [project.slug]);

  return (
    <section ref={sectionRef} className="relative h-[85vh] w-full overflow-hidden bg-ink md:h-screen">
      <img
        ref={imgRef}
        src={project.cover}
        alt={project.name}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/50" />

      <div className="container-x relative z-10 flex h-full flex-col justify-end pb-20 text-white md:pb-28">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs uppercase tracking-widest2 text-gold"
        >
          {project.type} · {project.year}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-4xl font-display text-4xl leading-tight md:text-6xl lg:text-7xl"
        >
          {project.name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-xl text-white/80"
        >
          {project.short}
        </motion.p>
      </div>
    </section>
  );
}
