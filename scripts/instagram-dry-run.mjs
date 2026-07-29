/**
 * PASO 3 — Ensayo en seco de la publicación de prueba.
 *
 * Muestra EXACTAMENTE qué se publicaría y comprueba cada requisito, pero no
 * llega a publicar. Las únicas peticiones que hace son GET:
 *
 *   GET /v25.0/me                                  (identidad)
 *   GET /v25.0/<IG_ID>/content_publishing_limit    (permiso y cuota)
 *   GET <URL pública de la imagen>                 (lo que descargará Meta)
 *
 * En este archivo NO existe ninguna llamada POST. Ni /media ni /media_publish.
 *
 *   npm run instagram:dry-run -- --job=<ID> --metadata=<ruta> --image-url=<url>
 */

import {
  getAccount,
  getPublishingLimit,
  checkPublicImage,
  analyzeCaption,
  describeToken,
  GraphError,
  API_VERSION,
  GRAPH_HOST,
  CAPTION_RULES,
  IMAGE_RULES,
} from '../lib/instagram/publish.mjs';
import { requireSecret } from './instagram-env.mjs';
import { leerTrabajo, cargarPropuesta } from './job-args.mjs';

const CUENTA_ESPERADA = 'cymarq_obras';

const USO =
  'npm run instagram:dry-run -- --job=<ID> --metadata=<ruta> --image-url=<url>';

function bloque(texto) {
  console.log(`\n${texto}`);
  console.log('═'.repeat(62));
}

function marca(ok) {
  return ok ? 'OK   ' : 'FALLO';
}

async function main() {
  const trabajo = leerTrabajo({ varianteCaption: 'instagram', uso: USO });
  const { metadata, caption } = await cargarPropuesta(trabajo);
  const token = await requireSecret('INSTAGRAM_PUBLISH_TOKEN');
  const fallos = [];

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  PASO 3 — ENSAYO EN SECO                                     ║');
  console.log('║  Solo peticiones GET. NO se crea contenedor ni se publica.   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  /* ---------------------------------------------------------------- */
  /* Cuenta destino                                                    */
  /* ---------------------------------------------------------------- */
  bloque('CUENTA DESTINO');

  console.log(`  Host        : ${GRAPH_HOST}`);
  console.log(`  Versión API : ${API_VERSION}`);
  console.log(`  Token       : ${describeToken(token)}  ← su valor nunca se imprime`);

  let cuenta;
  try {
    cuenta = await getAccount(token);
  } catch (error) {
    console.error(`\n  ERROR consultando /me: ${error.message}`);
    if (error instanceof GraphError && error.code) console.error(`  código ${error.code}`);
    process.exitCode = 1;
    return;
  }

  const userId = cuenta.user_id ? String(cuenta.user_id) : null;
  console.log(`\n  USERNAME    : @${cuenta.username ?? '(desconocido)'}`);
  console.log(`  USER_ID     : ${userId ?? '(ausente)'}`);
  console.log(`  id app-scoped (NO se usa para publicar): ${cuenta.id ?? '(ausente)'}`);

  if (cuenta.username !== CUENTA_ESPERADA) {
    fallos.push(`El token pertenece a @${cuenta.username}, no a @${CUENTA_ESPERADA}.`);
  }
  if (!userId) fallos.push('La API no devolvió user_id.');

  /* ---------------------------------------------------------------- */
  /* Contenido                                                         */
  /* ---------------------------------------------------------------- */
  bloque('PROYECTO E IMAGEN');

  console.log(`  PROYECTO    : ${metadata.proyecto_nombre ?? '(sin nombre)'}`);
  console.log(`  TÍTULO      : ${metadata.titulo ?? '(sin título)'}`);
  console.log(`  ID PROPUESTA: ${trabajo.jobId}`);
  console.log(`  VARIANTE    : ${trabajo.variante}`);
  console.log(`  IMAGEN      : ${metadata.archivo ?? '(sin archivo)'}`);
  console.log(`  ORIGINAL    : ${metadata.ruta_original ?? '(desconocido)'}`);
  console.log(`                (el original no se toca; se publica un derivado JPEG)`);
  console.log(`\n  URL PÚBLICA : ${trabajo.imageUrl}`);

  const imagen = await checkPublicImage(trabajo.imageUrl);
  console.log(`    HTTP status     : ${imagen.status ?? '(sin respuesta)'}`);
  console.log(`    Content-Type    : ${imagen.contentType ?? '(ninguno)'}`);
  console.log(`    Peso            : ${imagen.bytes ?? '?'} bytes` +
    (imagen.bytes ? ` (${Math.round(imagen.bytes / 1024)} KB · máx ${IMAGE_RULES.maxBytes / 1024 / 1024} MB)` : ''));
  console.log(`    Dimensiones     : ${imagen.width ?? '?'}x${imagen.height ?? '?'} px` +
    ` (ancho máx ${IMAGE_RULES.maxWidth})`);
  console.log(`    Relación aspecto: ${imagen.ratio ? imagen.ratio.toFixed(4) : '?'}` +
    ` (admitido ${IMAGE_RULES.minRatio} – ${IMAGE_RULES.maxRatio})`);
  console.log(`    Sin autenticación: se pidió sin credenciales ni cabeceras especiales`);

  if (imagen.ok) {
    console.log(`\n    [${marca(true)}] La imagen cumple todos los requisitos de Meta.`);
  } else {
    for (const problema of imagen.problems) console.log(`    [${marca(false)}] ${problema}`);
    fallos.push(...imagen.problems.map((p) => `Imagen: ${p}`));
  }

  /* ---------------------------------------------------------------- */
  /* Caption                                                           */
  /* ---------------------------------------------------------------- */
  bloque('CAPTION COMPLETO  (literal, tal cual se enviaría)');

  console.log('┌──────────────────────────────────────────────────────────────');
  for (const linea of caption.split('\n')) console.log(`│ ${linea}`);
  console.log('└──────────────────────────────────────────────────────────────');

  const analisis = analyzeCaption(caption);
  console.log(`\n  NÚMERO DE CARACTERES : ${analisis.characters}  (máx ${CAPTION_RULES.maxCharacters})`);
  console.log(`  NÚMERO DE HASHTAGS   : ${analisis.hashtags.length}  (máx ${CAPTION_RULES.maxHashtags})`);
  console.log(`  NÚMERO DE MENCIONES  : ${analisis.mentions.length}  (máx ${CAPTION_RULES.maxMentions})`);
  if (analisis.hashtags.length) {
    console.log(`  HASHTAGS             : ${analisis.hashtags.join(' ')}`);
  }
  if (analisis.ok) {
    console.log(`\n  [${marca(true)}] El caption cumple los límites de Instagram.`);
  } else {
    for (const problema of analisis.problems) console.log(`  [${marca(false)}] ${problema}`);
    fallos.push(...analisis.problems.map((p) => `Caption: ${p}`));
  }

  /* ---------------------------------------------------------------- */
  /* Permiso y cuota                                                   */
  /* ---------------------------------------------------------------- */
  bloque('PERMISO DE PUBLICACIÓN Y CUOTA');

  if (!userId) {
    console.log('  Omitido: no hay user_id.');
  } else {
    try {
      const limite = await getPublishingLimit(userId, token);
      const fila = Array.isArray(limite.data) ? limite.data[0] ?? {} : limite;
      const config = fila.config ?? {};
      const usadas = fila.quota_usage;
      const total = config.quota_total;

      console.log(`  ESTADO DEL PERMISO   : instagram_business_content_publish CONCEDIDO`);
      console.log(`                         (el endpoint lo exige y ha respondido)`);
      console.log(`  Cuota total          : ${total ?? '(no informado)'} publicaciones`);
      console.log(`  Ventana              : ${config.quota_duration ?? '(no informado)'} segundos`);
      console.log(`  Consumidas           : ${usadas ?? '(no informado)'}`);
      if (typeof total === 'number' && typeof usadas === 'number') {
        const libre = total - usadas;
        console.log(`  CUOTA DISPONIBLE     : ${libre}`);
        if (libre <= 0) fallos.push('Sin cuota de publicación en esta ventana de 24 h.');
      }
    } catch (error) {
      console.log(`  [${marca(false)}] ${error.message}`);
      if (error instanceof GraphError && error.code) console.log(`           código ${error.code}`);
      fallos.push('El permiso de publicación no está operativo en este token.');
    }
  }

  /* ---------------------------------------------------------------- */
  /* Lo que se enviaría                                                */
  /* ---------------------------------------------------------------- */
  bloque('LLAMADAS QUE SE HARÍAN AL PUBLICAR  (no se ejecutan ahora)');

  console.log(`  1)  POST ${GRAPH_HOST}/${API_VERSION}/${userId ?? '<IG_ID>'}/media`);
  console.log(`        image_url = ${trabajo.imageUrl}`);
  console.log(`        caption   = (${analisis.characters} caracteres, mostrado arriba)`);
  console.log(`      → devolvería {"id": "<CONTAINER_ID>"}`);
  console.log(`\n  2)  GET  ${GRAPH_HOST}/${API_VERSION}/<CONTAINER_ID>?fields=status_code`);
  console.log(`      → esperar FINISHED`);
  console.log(`\n  3)  POST ${GRAPH_HOST}/${API_VERSION}/${userId ?? '<IG_ID>'}/media_publish`);
  console.log(`        creation_id = <CONTAINER_ID>`);
  console.log(`      → devolvería {"id": "<MEDIA_ID>"}  ← publicación VISIBLE`);
  console.log(`\n  4)  GET  ${GRAPH_HOST}/${API_VERSION}/<MEDIA_ID>?fields=permalink`);

  /* ---------------------------------------------------------------- */
  bloque('RESULTADO DEL ENSAYO');

  if (fallos.length === 0) {
    console.log('  ESTADO: LISTO PARA PUBLICAR');
    console.log('\n  No se ha creado ningún contenedor. No hay nada en Instagram.');
    console.log('  La publicación real requiere autorización explícita.\n');
  } else {
    console.log('  ESTADO: NO LISTO');
    for (const fallo of fallos) console.log(`    · ${fallo}`);
    console.log('');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\n  Error inesperado: ${error?.message ?? 'desconocido'}\n`);
  process.exitCode = 1;
});
