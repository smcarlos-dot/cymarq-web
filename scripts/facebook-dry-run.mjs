/**
 * Ensayo en seco de la publicación en la Página de Facebook.
 *
 * Muestra exactamente qué se publicaría y comprueba cada requisito. Las únicas
 * peticiones son GET: identidad del token, datos de la Página y descarga de la
 * imagen. En este archivo no hay ninguna llamada POST.
 *
 *   npm run facebook:dry-run
 *   npm run facebook:dry-run -- --caption=instagram
 */

import { readFile } from 'node:fs/promises';

import {
  getTokenIdentity,
  getPage,
  checkPublicImage,
  analyzeMessage,
  describeToken,
  GraphError,
  GRAPH_HOST,
  API_VERSION,
  CAPTION_RULES,
  IMAGE_RULES,
} from '../lib/facebook/publish.mjs';
import {
  cargarPropuesta,
  requirePageToken,
  readPageId,
  IMAGEN_URL,
  JOB_ID,
  DIARIO,
  PAGINA_ESPERADA,
} from './facebook-job.mjs';

const bloque = (t) => {
  console.log(`\n${t}`);
  console.log('═'.repeat(62));
};
const marca = (ok) => (ok ? 'OK   ' : 'FALLO');

async function main() {
  const token = await requirePageToken();
  const pageId = await readPageId();
  const { metadata, variante, caption } = await cargarPropuesta();
  const fallos = [];

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  FACEBOOK — ENSAYO EN SECO                                   ║');
  console.log('║  Solo peticiones GET. NO se publica nada.                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  /* --- Diario ----------------------------------------------------- */
  let previo = {};
  try {
    previo = JSON.parse(await readFile(DIARIO, 'utf8'))[JOB_ID] ?? {};
  } catch {
    /* aún no hay diario */
  }
  if (previo.post_id) {
    bloque('AVISO — ESTE TRABAJO YA SE PUBLICÓ EN FACEBOOK');
    console.log(`  post_id   : ${previo.post_id}`);
    console.log(`  permalink : ${previo.permalink ?? '(no registrado)'}`);
    console.log('\n  El script de publicación se negaría a repetirlo.');
  }

  /* --- Página destino --------------------------------------------- */
  bloque('PÁGINA DESTINO');

  console.log(`  Host        : ${GRAPH_HOST}`);
  console.log(`  Versión API : ${API_VERSION}`);
  console.log(`  Token       : ${describeToken(token)}  ← su valor nunca se imprime`);

  let identidad;
  let pagina;
  try {
    identidad = await getTokenIdentity(token);
    pagina = await getPage(pageId, token);
  } catch (error) {
    console.error(`\n  ERROR consultando la Página: ${error.message}`);
    if (error instanceof GraphError && error.code) console.error(`  código ${error.code}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n  PÁGINA      : ${pagina.name ?? '(desconocida)'}`);
  console.log(`  PAGE_ID     : ${pagina.id ?? '(ausente)'}`);
  console.log(`  usuario     : ${pagina.username ? `@${pagina.username}` : '(sin alias)'}`);
  console.log(`  enlace      : ${pagina.link ?? '(no informado)'}`);
  console.log(`  token de    : ${identidad.name ?? '(desconocido)'} (id ${identidad.id})`);

  if (String(identidad.id) !== String(pageId)) {
    fallos.push(`El token no es de la Página ${pageId} sino de ${identidad.id}.`);
  }
  if (pagina.name !== PAGINA_ESPERADA) {
    fallos.push(`La Página se llama «${pagina.name}», se esperaba «${PAGINA_ESPERADA}».`);
  }

  /* --- Imagen ------------------------------------------------------ */
  bloque('PROYECTO E IMAGEN');

  console.log(`  JOB         : ${JOB_ID}`);
  console.log(`  PROYECTO    : ${metadata.proyecto_nombre ?? '(sin nombre)'}`);
  console.log(`  IMAGEN      : ${metadata.archivo ?? '(sin archivo)'}`);
  console.log(`  URL PÚBLICA : ${IMAGEN_URL}`);

  const imagen = await checkPublicImage(IMAGEN_URL);
  console.log(`    HTTP status  : ${imagen.status ?? '(sin respuesta)'}`);
  console.log(`    Content-Type : ${imagen.contentType ?? '(ninguno)'}` +
    ` (admitidos: ${IMAGE_RULES.contentTypes.join(', ')})`);
  console.log(`    Peso         : ${imagen.bytes ?? '?'} bytes` +
    (imagen.bytes ? ` (${Math.round(imagen.bytes / 1024)} KB · máx ${IMAGE_RULES.maxBytes / 1024 / 1024} MB)` : ''));
  console.log(`    Dimensiones  : ${imagen.width ?? '?'}x${imagen.height ?? '?'} px`);
  console.log(`    Sin autenticación: se pidió sin credenciales`);

  if (imagen.ok) {
    console.log(`\n    [${marca(true)}] Facebook podrá descargarla.`);
  } else {
    for (const p of imagen.problems) console.log(`    [${marca(false)}] ${p}`);
    fallos.push(...imagen.problems.map((p) => `Imagen: ${p}`));
  }

  /* --- Texto ------------------------------------------------------- */
  bloque(`CAPTION COMPLETO  (variante «${variante}», literal)`);

  console.log('┌──────────────────────────────────────────────────────────────');
  for (const linea of caption.split('\n')) console.log(`│ ${linea}`);
  console.log('└──────────────────────────────────────────────────────────────');

  const analisis = analyzeMessage(caption);
  console.log(`\n  CARACTERES : ${analisis.characters}  (máx ${CAPTION_RULES.maxCharacters} en Facebook)`);
  console.log(`  HASHTAGS   : ${analisis.hashtags.length}  (Facebook no impone límite)`);
  console.log(`  MENCIONES  : ${analisis.mentions.length}`);
  if (analisis.ok) {
    console.log(`\n  [${marca(true)}] El texto cumple los límites de Facebook.`);
  } else {
    for (const p of analisis.problems) console.log(`  [${marca(false)}] ${p}`);
    fallos.push(...analisis.problems.map((p) => `Texto: ${p}`));
  }

  /* --- Llamada prevista -------------------------------------------- */
  bloque('LLAMADA QUE SE HARÍA AL PUBLICAR  (no se ejecuta ahora)');

  console.log(`  POST ${GRAPH_HOST}/${API_VERSION}/${pageId}/photos`);
  console.log(`     url       = ${IMAGEN_URL}`);
  console.log(`     caption   = (${analisis.characters} caracteres, mostrado arriba)`);
  console.log(`     published = true`);
  console.log(`  → devolvería {"id": "<PHOTO_ID>", "post_id": "<POST_ID>"}`);
  console.log(`\n  GET  ${GRAPH_HOST}/${API_VERSION}/<POST_ID>?fields=permalink_url,created_time`);
  console.log(`\n  Facebook no usa contenedores: la foto se crea y se publica en`);
  console.log(`  una sola llamada. No hay creation_id ni sondeo de status_code.`);

  /* --- Resultado --------------------------------------------------- */
  bloque('RESULTADO DEL ENSAYO');

  if (fallos.length === 0 && !previo.post_id) {
    console.log('  ESTADO: LISTO PARA PUBLICAR');
    console.log('\n  No se ha publicado nada. Requiere autorización explícita:');
    console.log('      npm run facebook:publish -- --confirm\n');
  } else if (fallos.length === 0) {
    console.log('  ESTADO: LISTO, PERO YA PUBLICADO ANTES (ver aviso arriba)\n');
  } else {
    console.log('  ESTADO: NO LISTO');
    for (const f of fallos) console.log(`    · ${f}`);
    console.log('');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\n  Error inesperado: ${error?.message ?? 'desconocido'}\n`);
  process.exitCode = 1;
});
