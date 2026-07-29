/**
 * Publicación real controlada en la Página de Facebook "Cymarq".
 *
 * Flujo: una sola llamada de escritura.
 *
 *   POST /<PAGE_ID>/photos   (url + caption)  → { id, post_id }   IRREVERSIBLE
 *   GET  /<POST_ID>?fields=permalink_url,created_time
 *
 * PROTECCIONES CONTRA DUPLICADOS
 *
 * Diario propio en `.facebook-publish-state.json` (ignorado por git), separado
 * del de Instagram. La misma propuesta puede estar publicada en Instagram y no
 * en Facebook, o al revés, sin que un diario interfiera con el otro.
 *
 *   - Si la entrada ya tiene `post_id` → se niega a ejecutar.
 *   - Antes del POST marca `publish_attempted`. Si la respuesta se pierde por
 *     red, el script NO reintenta solo: exige comprobación manual, porque un
 *     reintento a ciegas publicaría la foto dos veces.
 *
 * Además exige `--confirm`. Sin él no ejecuta ninguna escritura.
 *
 *   npm run facebook:publish -- --job=<ID> --metadata=<ruta> --image-url=<url>
 *   ... añadiendo --confirm para publicar de verdad.
 */

import { readFile, writeFile } from 'node:fs/promises';

import {
  getTokenIdentity,
  getPage,
  publishPhoto,
  getPost,
  checkPublicImage,
  analyzeMessage,
  GraphError,
  GRAPH_HOST,
  API_VERSION,
} from '../lib/facebook/publish.mjs';
import {
  leerTrabajoFacebook,
  cargarPropuesta,
  requirePageToken,
  readPageId,
  DIARIO,
  PAGINA_ESPERADA,
} from './facebook-job.mjs';

const USO =
  'npm run facebook:publish -- --job=<ID> --metadata=<ruta> --image-url=<url> [--confirm]';

const bloque = (t) => {
  console.log(`\n${t}`);
  console.log('═'.repeat(62));
};

async function leerDiario() {
  try {
    return JSON.parse(await readFile(DIARIO, 'utf8'));
  } catch {
    return {};
  }
}

async function anotar(jobId, cambios) {
  const diario = await leerDiario();
  diario[jobId] = { ...(diario[jobId] ?? {}), ...cambios, actualizado: new Date().toISOString() };
  await writeFile(DIARIO, `${JSON.stringify(diario, null, 2)}\n`, 'utf8');
  return diario[jobId];
}

function mostrarError(error) {
  console.error(`  ${error?.message ?? 'error desconocido'}`);
  if (error instanceof GraphError) {
    if (error.status !== null) console.error(`    HTTP    : ${error.status}`);
    if (error.code !== null) console.error(`    código  : ${error.code}`);
    if (error.subcode !== null) console.error(`    subcode : ${error.subcode}`);
    if (error.fbtraceId) console.error(`    fbtrace : ${error.fbtraceId}`);
  }
}

async function main() {
  const confirmar = process.argv.includes('--confirm');
  const trabajo = leerTrabajoFacebook(USO);
  const { jobId: JOB_ID, imageUrl: IMAGEN_URL, variante } = trabajo;
  const token = await requirePageToken();
  const pageId = await readPageId();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  FACEBOOK — PUBLICACIÓN REAL CONTROLADA                      ║');
  console.log(`║  Modo: ${(confirmar ? 'PUBLICAR DE VERDAD' : 'ensayo (sin --confirm)').padEnd(53)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  /* --- Diario ----------------------------------------------------- */
  const previo = (await leerDiario())[JOB_ID] ?? {};

  if (previo.post_id) {
    bloque('DETENIDO — ESTA PUBLICACIÓN YA EXISTE EN FACEBOOK');
    console.log(`  job       : ${JOB_ID}`);
    console.log(`  post_id   : ${previo.post_id}`);
    console.log(`  permalink : ${previo.permalink ?? '(no registrado)'}`);
    console.log(`  publicada : ${previo.publicado_en ?? '(desconocido)'}`);
    console.log('\n  No se republica.\n');
    return;
  }

  if (previo.publish_attempted) {
    bloque('DETENIDO — INTENTO ANTERIOR SIN RESPUESTA');
    console.log(`  intentado : ${previo.publish_intentado_en ?? '(desconocido)'}`);
    console.log('\n  Ya se llamó a /photos y no se registró el resultado.');
    console.log('  Reintentar podría publicar la foto dos veces.');
    console.log('  Comprueba a mano en la Página si el post existe antes de');
    console.log('  tocar el diario .facebook-publish-state.json.\n');
    process.exitCode = 1;
    return;
  }

  /* --- Contenido --------------------------------------------------- */
  const { metadata, caption } = await cargarPropuesta(trabajo);
  const analisis = analyzeMessage(caption);

  bloque('CONTENIDO A PUBLICAR');
  console.log(`  job       : ${JOB_ID}`);
  console.log(`  proyecto  : ${metadata.proyecto_nombre}`);
  console.log(`  imagen    : ${IMAGEN_URL}`);
  console.log(`  texto     : variante «${variante}», ${analisis.characters} caracteres`);

  if (!analisis.ok) {
    console.error('\n  ABORTADO: el texto no cumple los límites.');
    for (const p of analisis.problems) console.error(`    · ${p}`);
    process.exitCode = 1;
    return;
  }

  /* --- Comprobaciones previas -------------------------------------- */
  bloque('COMPROBACIONES PREVIAS');

  const identidad = await getTokenIdentity(token);
  const pagina = await getPage(pageId, token);
  console.log(`  página    : ${pagina.name} (id ${pagina.id})`);
  console.log(`  token de  : ${identidad.name} (id ${identidad.id})`);

  if (String(identidad.id) !== String(pageId)) {
    console.error(`\n  ABORTADO: el token no es de la Página ${pageId}.`);
    process.exitCode = 1;
    return;
  }
  if (pagina.name !== PAGINA_ESPERADA) {
    console.error(`\n  ABORTADO: la Página es «${pagina.name}», se esperaba «${PAGINA_ESPERADA}».`);
    process.exitCode = 1;
    return;
  }

  const imagen = await checkPublicImage(IMAGEN_URL);
  console.log(`  imagen    : HTTP ${imagen.status}, ${imagen.contentType}, ` +
    `${imagen.width}x${imagen.height}, ${Math.round(imagen.bytes / 1024)} KB`);
  if (!imagen.ok) {
    console.error('\n  ABORTADO: la imagen no cumple los requisitos.');
    for (const p of imagen.problems) console.error(`    · ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log('  [OK] Todo listo.');

  if (!confirmar) {
    bloque('ENSAYO — NO SE HA EJECUTADO NINGUNA ESCRITURA');
    console.log('  Para publicar de verdad:');
    console.log('      npm run facebook:publish -- --confirm\n');
    return;
  }

  /* --- Publicar ----------------------------------------------------- */
  bloque(`1/2  PUBLICAR   POST ${GRAPH_HOST}/${API_VERSION}/${pageId}/photos`);
  console.log('  Esta llamada es IRREVERSIBLE.');

  await anotar(JOB_ID, {
    job: JOB_ID,
    page_id: String(pageId),
    page_name: pagina.name,
    image_url: IMAGEN_URL,
    caption_variante: variante,
    caption_caracteres: analisis.characters,
    publish_attempted: true,
    publish_intentado_en: new Date().toISOString(),
  });

  let photoId = null;
  let postId = null;
  try {
    const resultado = await publishPhoto({ pageId, token, imageUrl: IMAGEN_URL, caption });
    photoId = resultado?.id ? String(resultado.id) : null;
    postId = resultado?.post_id ? String(resultado.post_id) : null;
    if (!photoId && !postId) throw new GraphError('La respuesta no incluyó ni id ni post_id.');
    await anotar(JOB_ID, { photo_id: photoId, post_id: postId, publicado_en: new Date().toISOString() });
    console.log(`  PHOTO_ID : ${photoId ?? '(no devuelto)'}`);
    console.log(`  POST_ID  : ${postId ?? '(no devuelto)'}`);
  } catch (error) {
    console.error('\n  FALLO al publicar la foto.');
    mostrarError(error);
    console.error('\n  El diario ha quedado marcado como intento sin confirmar.');
    console.error('  Comprueba manualmente en la Página si el post existe.');
    console.error('  NO vuelvas a ejecutar el script sin comprobarlo antes.');
    process.exitCode = 1;
    return;
  }

  /* --- Permalink ----------------------------------------------------- */
  const idParaEnlace = postId ?? photoId;
  bloque(`2/2  PERMALINK   GET ${GRAPH_HOST}/${API_VERSION}/${idParaEnlace}`);

  let post = null;
  try {
    post = await getPost(idParaEnlace, token);
    await anotar(JOB_ID, { permalink: post?.permalink_url ?? null, created_time: post?.created_time ?? null });
    console.log(`  permalink : ${post?.permalink_url ?? '(no devuelto)'}`);
    console.log(`  creado    : ${post?.created_time ?? '(no devuelto)'}`);
  } catch (error) {
    console.error('  El post SÍ se creó, pero no se pudo leer el permalink:');
    mostrarError(error);
  }

  /* --- Resultado ------------------------------------------------------ */
  bloque('RESULTADO');
  console.log(`  PÁGINA DESTINO : ${pagina.name}`);
  console.log(`  PAGE_ID        : ${pageId}`);
  console.log(`  PROYECTO       : ${metadata.proyecto_nombre}`);
  console.log(`  IMAGEN         : ${IMAGEN_URL}`);
  console.log(`  PHOTO_ID       : ${photoId ?? '(no devuelto)'}`);
  console.log(`  POST_ID        : ${postId ?? '(no devuelto)'}`);
  console.log(`  PERMALINK      : ${post?.permalink_url ?? '(no devuelto)'}`);
  console.log(`  FECHA/HORA     : ${new Date().toISOString()}  (UTC)`);
  console.log(`                   ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}  (Bogotá)`);
  console.log(`\n  RESULTADO FINAL: PUBLICACIÓN REALIZADA CORRECTAMENTE.`);
  console.log(`  Registrada en el diario de Facebook. No se repetirá.\n`);
}

main().catch((error) => {
  console.error(`\n  Error inesperado: ${error?.message ?? 'desconocido'}\n`);
  process.exitCode = 1;
});
