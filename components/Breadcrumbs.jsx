import Link from 'next/link';

/**
 * Migas de pan visibles. Acompañan siempre a un `BreadcrumbList` en el
 * JSON-LD de la página: los datos estructurados no deben decir nada que
 * el visitante no pueda ver.
 *
 * `trail`: [{ name, path }] desde Inicio hasta la página actual.
 */
export default function Breadcrumbs({ trail }) {
  const last = trail.length - 1;

  return (
    <nav aria-label="Ruta de navegación" className="text-[11px] uppercase tracking-widest2">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/45">
        {trail.map((item, i) => (
          <li key={item.path} className="flex items-center gap-2">
            {i === last ? (
              <span aria-current="page" className="text-white/70">
                {item.name}
              </span>
            ) : (
              <Link href={item.path} className="transition-colors hover:text-gold">
                {item.name}
              </Link>
            )}
            {i < last && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
