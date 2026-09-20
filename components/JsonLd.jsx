/**
 * Inserta un bloque JSON-LD en el HTML estático.
 * Se usa un único `@graph` por página para que las entidades puedan
 * referenciarse entre sí por `@id` sin duplicar nodos.
 */
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
