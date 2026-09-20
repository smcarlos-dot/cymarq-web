import { faqCategories } from '@/data/faq';
import { serviciosOrdenados, servicioPath } from '@/data/servicios';
import { site } from '@/data/site';
import { fechaLarga } from '@/lib/seo';

export const dynamic = 'force-static';

/**
 * /llms.txt — mapa del sitio en texto llano para sistemas de respuesta.
 *
 * Es una convención emergente (llmstxt.org), todavía no un estándar que los
 * grandes rastreadores se hayan comprometido a leer. Se genera a partir de
 * los mismos datos que la web, así que no puede desincronizarse, y cuesta
 * poco: si la convención cuaja, el sitio ya está preparado.
 */
export function GET() {
  const servicios = serviciosOrdenados
    .map((s) => `- [${s.h1}](${site.url}${servicioPath(s.slug)}): ${s.respuesta.text}`)
    .join('\n');

  const faq = faqCategories
    .map(
      (c) =>
        `- [${c.title}](${site.url}/preguntas-frecuentes/#${c.id}): ${c.intro} (${c.questions.length} preguntas)`,
    )
    .join('\n');

  const cuerpo = `# CYMARQ — Arquitectura, diseño y construcción en Cúcuta

> ${site.entityDescription}

Área de servicio: Cúcuta, su área metropolitana (Villa del Rosario, Los Patios) y Norte de Santander, Colombia.
CYMARQ presta servicios en toda su área de cobertura y no publica una oficina abierta al público.
Contacto: WhatsApp ${site.whatsapp} · ${site.email}
Contenido revisado el ${fechaLarga()}.

## Servicios

${servicios}

## Preguntas frecuentes

Respuestas sobre trámites urbanísticos en Cúcuta, escritas para leerse de forma autónoma.
Índice completo: ${site.url}/preguntas-frecuentes/

${faq}

## Portafolio

- [Proyectos de CYMARQ](${site.url}/proyectos/): viviendas, proyectos comerciales, edificaciones de uso mixto y espacio público en Cúcuta, Tibú y Norte de Santander.

## Notas sobre el contenido

- El sitio no publica precios: los costos de licencias, diseño y obra dependen del predio y del alcance, y así se explica en cada respuesta.
- Las respuestas sobre normativa son de orientación general. La norma urbanística cambia y cada predio tiene condiciones propias.
- Fuentes oficiales citadas: Alcaldía de San José de Cúcuta, Curaduría Urbana N.º 1 y N.º 2 de Cúcuta, Decreto 1077 de 2015.
`;

  return new Response(cuerpo, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
