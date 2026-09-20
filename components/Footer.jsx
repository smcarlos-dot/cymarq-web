import Link from 'next/link';
import { serviciosOrdenados, servicioPath } from '@/data/servicios';
import { site } from '@/data/site';

/**
 * El pie es la red de enlaces internos del sitio: desde cualquier página se
 * llega a los cinco servicios, al portafolio y a las preguntas frecuentes.
 * Con eso ninguna página queda huérfana.
 */
export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-x py-16">
        {/* Identidad + mapa del sitio */}
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-16">
          <div>
            <img src="/brand/logo-negro.png" alt="CYMARQ" className="h-12 w-auto" />
            <p className="mt-5 font-sans text-[11px] uppercase tracking-widest2 text-white/60">
              {site.tagline}
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              Arquitectura, diseño, construcción y trámites urbanísticos en Cúcuta, su área
              metropolitana y Norte de Santander.
            </p>
            <p className="mt-6 text-sm">
              <a
                href={site.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline text-white/85 hover:text-gold"
              >
                WhatsApp {site.whatsapp}
              </a>
            </p>
            <p className="mt-2 text-sm">
              <a
                href={`mailto:${site.email}`}
                className="link-underline text-white/85 hover:text-gold"
              >
                {site.email}
              </a>
            </p>
          </div>

          <nav aria-label="Servicios">
            <p className="text-[11px] uppercase tracking-widest2 text-gold">Servicios</p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {serviciosOrdenados.map((s) => (
                <li key={s.slug}>
                  <Link href={servicioPath(s.slug)} className="hover:text-white">
                    {s.nav}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/servicios/" className="hover:text-white">
                  Todos los servicios
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Secciones">
            <p className="text-[11px] uppercase tracking-widest2 text-gold">El sitio</p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li>
                <Link href="/proyectos/" className="hover:text-white">
                  Proyectos
                </Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes/" className="hover:text-white">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link href="/#proceso" className="hover:text-white">
                  Cómo trabajamos
                </Link>
              </li>
              <li>
                <Link href="/#renders" className="hover:text-white">
                  Visualiza tu casa
                </Link>
              </li>
              <li>
                <Link href="/#nosotros" className="hover:text-white">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="/#contacto" className="hover:text-white">
                  Contacto
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Redes, legales y aviso */}
        <div className="flex flex-col items-center gap-8 pt-12 text-center">
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
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[10px] uppercase tracking-wider text-white/35">
            <Link href="/politica-de-privacidad/" className="hover:text-white/70">
              Privacidad
            </Link>
            <Link href="/terminos-y-condiciones/" className="hover:text-white/70">
              Términos
            </Link>
            <Link href="/eliminacion-de-datos/" className="hover:text-white/70">
              Eliminación de datos
            </Link>
          </nav>

          <div className="h-px w-24 bg-gold/60" />

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} CYMARQ. Todos los derechos reservados. {site.location}.
          </p>
        </div>
      </div>
    </footer>
  );
}
