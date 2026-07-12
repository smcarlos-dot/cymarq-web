import Link from 'next/link';
import PortfolioGrid from '@/components/PortfolioGrid';
import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'Portafolio de proyectos',
  description:
    'Portafolio de CYMARQ: proyectos residenciales, comerciales, de espacio público e infraestructura diseñados y desarrollados en Colombia.',
};

export default function ProyectosPage() {
  return (
    <>
      {/* Hero corto */}
      <section className="bg-ink pb-16 pt-36 text-white md:pb-24 md:pt-44">
        <div className="container-x">
          <Reveal>
            <span className="section-label">Portafolio</span>
            <h1 className="h-display max-w-4xl">
              Proyectos con identidad, funcionalidad y{' '}
              <em className="text-gold">carácter.</em>
            </h1>
            <p className="mt-6 max-w-xl text-white/70">
              Residencial, comercial, espacio público e infraestructura. Cada proyecto
              nace del análisis del lugar, el estilo de vida del cliente y las
              condiciones técnicas del terreno.
            </p>
          </Reveal>
        </div>
      </section>

      <PortfolioGrid />

      <section className="bg-paper py-20 text-center">
        <Reveal>
          <p className="font-display text-2xl">¿Quieres ver más?</p>
          <Link href="/#renders" className="btn-line mt-8 text-ink">
            Ver renders <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
