import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-white">
      <p className="text-xs uppercase tracking-widest2 text-gold">Error 404</p>
      <h1 className="mt-4 font-display text-5xl md:text-7xl">Página no encontrada</h1>
      <p className="mt-6 max-w-md text-white/60">
        El espacio que buscas aún no ha sido diseñado.
      </p>
      <Link href="/" className="btn-line mt-10 text-white">
        Volver al inicio <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
