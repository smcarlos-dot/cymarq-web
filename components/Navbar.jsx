'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { whatsappMessages, whatsappUrl } from '@/data/site';

const links = [
  { href: '/#proceso', label: 'Proceso' },
  { href: '/#renders', label: 'Visualiza tu casa' },
  { href: '/proyectos/', label: 'Proyectos' },
  { href: '/#nosotros', label: 'Nosotros' },
  { href: '/#servicios', label: 'Servicios' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dark = scrolled || !isHome || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-cinema ${
        dark ? 'bg-ink/90 backdrop-blur-md py-3' : 'bg-transparent py-6'
      }`}
    >
      <div className="container-x flex items-center justify-between">
        <Link href="/" aria-label="CYMARQ — Inicio" onClick={() => setOpen(false)}>
          <img
            src="/brand/logo-negro.png"
            alt="CYMARQ"
            className="h-9 w-auto md:h-10"
          />
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-8 md:flex lg:gap-10">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="link-underline font-sans text-xs uppercase tracking-widest2 text-white/90 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={whatsappUrl(whatsappMessages.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gold px-5 py-3 font-sans text-xs font-medium uppercase tracking-widest2 text-ink transition-colors duration-500 hover:bg-white"
          >
            Asesoría gratis
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          <span
            className={`h-px w-6 bg-white transition-transform duration-300 ${open ? 'translate-y-[3.5px] rotate-45' : ''}`}
          />
          <span
            className={`h-px w-6 bg-white transition-transform duration-300 ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-ink md:hidden"
          >
            <div className="container-x flex flex-col gap-6 py-8">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.4 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-2xl text-white"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.a
                href={whatsappUrl(whatsappMessages.general)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * links.length, duration: 0.4 }}
                className="mt-2 inline-flex items-center justify-center bg-gold px-6 py-4 text-center font-sans text-xs font-medium uppercase tracking-widest2 text-ink"
              >
                Asesoría gratis por WhatsApp
              </motion.a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
