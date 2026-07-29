/**
 * Argumentos comunes de los publicadores.
 *
 * Antes, el trabajo a publicar estaba escrito como constantes dentro de cada
 * script (la propuesta CYM-2026-0001). Ahora se recibe por línea de órdenes,
 * de modo que el orquestador (CYMARQ_SOCIAL, en Python) puede pedir cualquier
 * propuesta sin tocar código.
 *
 * No hay valores por defecto para el trabajo: si falta un argumento el script
 * se detiene. Un valor por defecto silencioso podría publicar una propuesta
 * distinta de la que se quería.
 *
 *   --job=<ID>            identificador de la propuesta, p. ej. CYM-2026-0007
 *   --metadata=<ruta>     metadata.json de la propuesta
 *   --image-url=<url>     URL pública HTTPS del derivado JPEG
 *   --caption=<variante>  "instagram" o "facebook" (cada script tiene el suyo)
 */

import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

/** Lee `--nombre=valor` de la línea de órdenes. */
export function argumento(nombre) {
  const prefijo = `--${nombre}=`;
  const encontrado = process.argv.find((a) => a.startsWith(prefijo));
  return encontrado ? encontrado.slice(prefijo.length) : undefined;
}

function faltan(nombres, uso) {
  console.error(`\n  FALTAN ARGUMENTOS OBLIGATORIOS: ${nombres.join(', ')}\n`);
  console.error(`  Uso:\n      ${uso}\n`);
  process.exit(1);
}

/**
 * Lee y valida los argumentos que describen el trabajo.
 *
 * `varianteCaption` es la que se usa si no se pasa `--caption`; cada
 * plataforma tiene la suya (Instagram y Facebook llevan textos distintos en la
 * misma propuesta).
 */
export function leerTrabajo({ varianteCaption, uso }) {
  const jobId = argumento('job');
  const metadata = argumento('metadata');
  const imageUrl = argumento('image-url');

  const ausentes = [];
  if (!jobId) ausentes.push('--job');
  if (!metadata) ausentes.push('--metadata');
  if (!imageUrl) ausentes.push('--image-url');
  if (ausentes.length) faltan(ausentes, uso);

  const variante = argumento('caption') ?? varianteCaption;
  if (variante !== 'instagram' && variante !== 'facebook') {
    console.error(`\n  --caption debe ser "instagram" o "facebook", no "${variante}".\n`);
    process.exit(1);
  }

  let url;
  try {
    url = new URL(imageUrl);
  } catch {
    console.error(`\n  --image-url no es una URL válida: ${imageUrl}\n`);
    process.exit(1);
  }
  if (url.protocol !== 'https:') {
    console.error(`\n  --image-url debe ser HTTPS. Meta no descargará ${url.protocol}//\n`);
    process.exit(1);
  }

  return {
    jobId,
    metadataPath: isAbsolute(metadata) ? metadata : resolve(process.cwd(), metadata),
    imageUrl,
    variante,
  };
}

/** Carga el metadata.json de la propuesta y extrae el texto de la variante. */
export async function cargarPropuesta(trabajo) {
  let metadata;
  try {
    metadata = JSON.parse(await readFile(trabajo.metadataPath, 'utf8'));
  } catch (error) {
    console.error(`\n  No se pudo leer la propuesta en:\n    ${trabajo.metadataPath}`);
    console.error(`  ${error?.message ?? ''}\n`);
    process.exit(1);
  }

  // El id del archivo manda sobre el que se pasó por línea de órdenes: si no
  // coinciden es que se está apuntando a la propuesta equivocada.
  const idEnArchivo = metadata?.id;
  if (idEnArchivo && idEnArchivo !== trabajo.jobId) {
    console.error(`\n  DESAJUSTE: --job=${trabajo.jobId} pero el metadata dice id=${idEnArchivo}.`);
    console.error('  Se detiene para no publicar la propuesta equivocada.\n');
    process.exit(1);
  }

  return { metadata, caption: metadata?.texto?.[trabajo.variante] ?? '' };
}
