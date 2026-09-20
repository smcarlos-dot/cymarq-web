import Link from 'next/link';

/**
 * Lista de preguntas frecuentes.
 *
 * Se construye con `<details>` nativo y no con estado de React: el texto de
 * cada respuesta queda en el HTML aunque el bloque esté plegado, funciona sin
 * JavaScript y un rastreador lo lee completo. Eso es justo lo que hace falta
 * para que el contenido pueda ser comprendido por un buscador o por un
 * sistema de respuesta basado en IA.
 */

function AnswerLink({ link }) {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="link-underline text-gold"
      >
        {link.label} <span aria-hidden="true">↗</span>
      </a>
    );
  }
  return (
    <Link href={link.href} className="link-underline text-gold">
      {link.label} <span aria-hidden="true">→</span>
    </Link>
  );
}

export function FaqItem({ item, defaultOpen = false }) {
  return (
    <details
      id={item.id}
      open={defaultOpen}
      className="group scroll-mt-28 border-b border-stone/15 py-1"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
        <h3 className="font-display text-lg leading-snug transition-colors duration-300 group-open:text-gold md:text-xl">
          {item.q}
        </h3>
        <span
          aria-hidden="true"
          className="mt-1 shrink-0 text-xl leading-none text-gold transition-transform duration-300 group-open:rotate-45"
        >
          +
        </span>
      </summary>

      <div className="space-y-4 pb-7 pr-2 text-[15px] leading-relaxed text-stone md:pr-12">
        {item.a?.map((p) => (
          <p key={p}>{p}</p>
        ))}

        {item.list && (
          <div className="border-l-2 border-gold/50 pl-5">
            {item.list.title && (
              <p className="text-[11px] uppercase tracking-widest2 text-ink/70">
                {item.list.title}
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {item.list.items.map((li) => (
                <li key={li} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[9px] h-px w-3 shrink-0 bg-gold" />
                  <span>{li}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.a2?.map((p) => (
          <p key={p}>{p}</p>
        ))}

        {item.links?.length > 0 && (
          <p className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm">
            {item.links.map((l) => (
              <AnswerLink key={l.href} link={l} />
            ))}
          </p>
        )}
      </div>
    </details>
  );
}

export default function FaqList({ categories }) {
  return (
    <div className="space-y-24">
      {categories.map((cat) => (
        <section key={cat.id} id={cat.id} className="scroll-mt-28">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl leading-snug md:text-4xl">{cat.title}</h2>
            <p className="mt-4 leading-relaxed text-stone">{cat.intro}</p>
            {cat.service && (
              <p className="mt-5 text-sm">
                <Link href={cat.service.href} className="link-underline text-gold">
                  {cat.service.label} <span aria-hidden="true">→</span>
                </Link>
              </p>
            )}
          </div>

          <div className="mt-10 border-t border-stone/15">
            {cat.questions.map((q, i) => (
              <FaqItem key={q.id} item={q} defaultOpen={i === 0} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
