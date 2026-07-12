import Link from 'next/link';
import { site } from '@/data/site';

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-x flex flex-col items-center gap-8 py-16 text-center">
        <img src="/brand/logo-negro.png" alt="CYMARQ" className="h-14 w-auto" />
        <p className="font-sans text-xs uppercase tracking-widest2 text-white/70">
          {site.tagline}
        </p>

        <div className="flex items-center gap-8">
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-sm text-white/80 hover:text-gold"
          >
            Instagram
          </a>
          <a
            href={site.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-sm text-white/80 hover:text-gold"
          >
            Facebook
          </a>
          <a
            href={site.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-sm text-white/80 hover:text-gold"
          >
            WhatsApp
          </a>
          <a
            href={`mailto:${site.email}`}
            className="link-underline text-sm text-white/80 hover:text-gold"
          >
            Correo
          </a>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-widest2 text-white/50">
          <Link href="/#nosotros" className="hover:text-white">Nosotros</Link>
          <Link href="/#servicios" className="hover:text-white">Servicios</Link>
          <Link href="/proyectos/" className="hover:text-white">Portafolio</Link>
          <Link href="/#renders" className="hover:text-white">Renders</Link>
          <Link href="/#contacto" className="hover:text-white">Contacto</Link>
        </nav>

        <div className="h-px w-24 bg-gold/60" />

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} CYMARQ. Todos los derechos reservados. {site.location}.
        </p>
      </div>
    </footer>
  );
}
