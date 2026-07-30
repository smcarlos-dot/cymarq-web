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
 *
 * VÍDEO
 *
 *   --media-type=<tipo>   "image" (por defecto), "reels" o "video"
 *   --video-url=<url>     URL pública HTTPS del MP4. Obligatoria si el tipo no
 *                         es "image"
 *   --cover-url=<url>     portada opcional (solo Instagram Reels)
 *   --thumb-offset=<ms>   milisegundo del que sacar la portada, alternativa a
 *                         --cover-url
 *   --video-file=<ruta>   copia local del MP4. Solo Facebook Reels: si viene, los
 *                         bytes se SUBEN en vez de pedirle a Facebook que
 *                         descargue la URL. Es la vía preferida, porque el
 *                         descargador de Facebook obedece robots.txt y el
 *                         gestionado de Cloudflare bloquea su agente.
 *
 * `--media-type` es lo que decide el flujo, y su valor por defecto es `image`:
 * una invocación antigua, sin la bandera, se comporta exactamente igual que
 * antes de existir el vídeo. Eso es deliberado — el camino de las imágenes ya
 * está probado con publicaciones reales y no se toca.
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
export const TIPOS_MEDIO = ['image', 'reels', 'video'];

/** Valida una URL pública destinada a Meta. Aborta si no sirve. */
function exigirUrlHttps(valor, bandera) {
  let url;
  try {
    url = new URL(valor);
  } catch {
    console.error(`\n  ${bandera} no es una URL válida: ${valor}\n`);
    process.exit(1);
  }
  if (url.protocol !== 'https:') {
    console.error(`\n  ${bandera} debe ser HTTPS. Meta no descargará ${url.protocol}//\n`);
    process.exit(1);
  }
  return valor;
}

export function leerTrabajo({ varianteCaption, uso }) {
  const jobId = argumento('job');
  const metadata = argumento('metadata');
  const imageUrl = argumento('image-url');
  const videoUrl = argumento('video-url');

  const mediaType = argumento('media-type') ?? 'image';
  if (!TIPOS_MEDIO.includes(mediaType)) {
    console.error(
      `\n  --media-type debe ser ${TIPOS_MEDIO.join(', ')}; no "${mediaType}".\n`
    );
    process.exit(1);
  }
  const esVideo = mediaType !== 'image';

  const ausentes = [];
  if (!jobId) ausentes.push('--job');
  if (!metadata) ausentes.push('--metadata');
  // El medio obligatorio depende del tipo. No se acepta uno por el otro: pasar
  // un JPEG donde se espera un MP4 solo se descubriría dentro de Meta.
  if (esVideo && !videoUrl) ausentes.push('--video-url');
  if (!esVideo && !imageUrl) ausentes.push('--image-url');
  if (ausentes.length) faltan(ausentes, uso);

  const variante = argumento('caption') ?? varianteCaption;
  if (variante !== 'instagram' && variante !== 'facebook') {
    console.error(`\n  --caption debe ser "instagram" o "facebook", no "${variante}".\n`);
    process.exit(1);
  }

  if (imageUrl) exigirUrlHttps(imageUrl, '--image-url');
  if (videoUrl) exigirUrlHttps(videoUrl, '--video-url');

  const coverUrl = argumento('cover-url');
  if (coverUrl) exigirUrlHttps(coverUrl, '--cover-url');

  const thumbOffsetCrudo = argumento('thumb-offset');
  let thumbOffset;
  if (thumbOffsetCrudo !== undefined) {
    thumbOffset = Number(thumbOffsetCrudo);
    if (!Number.isFinite(thumbOffset) || thumbOffset < 0) {
      console.error(`\n  --thumb-offset debe ser un número de ms >= 0, no "${thumbOffsetCrudo}".\n`);
      process.exit(1);
    }
  }

  const videoFileCrudo = argumento('video-file');
  const videoFile = videoFileCrudo
    ? (isAbsolute(videoFileCrudo) ? videoFileCrudo : resolve(process.cwd(), videoFileCrudo))
    : undefined;
  if (videoFile && !esVideo) {
    console.error('\n  --video-file solo tiene sentido con --media-type=reels o video.\n');
    process.exit(1);
  }

  return {
    jobId,
    metadataPath: isAbsolute(metadata) ? metadata : resolve(process.cwd(), metadata),
    imageUrl,
    videoUrl,
    videoFile,
    mediaType,
    esVideo,
    coverUrl,
    thumbOffset,
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
