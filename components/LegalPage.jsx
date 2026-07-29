import Reveal from '@/components/Reveal';

/**
 * Maqueta compartida por las páginas legales (privacidad, términos,
 * eliminación de datos). Reutiliza el lenguaje visual del resto del sitio:
 * hero oscuro con `section-label` + `h-display` y cuerpo sobre fondo claro.
 */

export function LegalSection({ id, title, children }) {
  return (
    <section id={id} className="mt-14 scroll-mt-28 first:mt-0">
      <h2 className="font-display text-2xl leading-snug md:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-stone">{children}</div>
    </section>
  );
}

export function LegalList({ children }) {
  return <ul className="ml-5 list-disc space-y-2 marker:text-gold">{children}</ul>;
}

export function LegalNote({ children }) {
  return (
    <div className="border-l-2 border-gold bg-mist px-6 py-5 text-[15px] leading-relaxed text-ink">
      {children}
    </div>
  );
}

export default function LegalPage({ label, title, lead, updatedAt, children }) {
  return (
    <>
      <section className="bg-ink pb-16 pt-36 text-white md:pb-24 md:pt-44">
        <div className="container-x">
          <Reveal>
            <span className="section-label">{label}</span>
            <h1 className="h-display max-w-4xl">{title}</h1>
            {lead ? <p className="mt-6 max-w-2xl text-white/70">{lead}</p> : null}
            <p className="mt-8 text-xs uppercase tracking-widest2 text-white/40">
              Última actualización: {updatedAt}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper py-20 md:py-28">
        <div className="container-x">
          <div className="max-w-3xl">{children}</div>
        </div>
      </section>
    </>
  );
}
