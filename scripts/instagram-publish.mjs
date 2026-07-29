/**
 * PASO 4 — Publicación real controlada en @cymarq_obras.
 *
 * Flujo oficial (Instagram API with Instagram Login, graph.instagram.com):
 *
 *   1. POST /<IG_ID>/media                      → CONTAINER_ID
 *   2. GET  /<CONTAINER_ID>?fields=status_code  → esperar FINISHED
 *   3. POST /<IG_ID>/media_publish              → MEDIA_ID   ← IRREVERSIBLE
 *   4. GET  /<MEDIA_ID>?fields=permalink        → enlace final
 *
 * PROTECCIONES CONTRA DUPLICADOS
 *
 * El script lleva un diario en `.instagram-publish-state.json` (ignorado por
 * git) con una entrada por publicación. Ese diario es la única fuente de
 * verdad sobre si algo ya se hizo:
 *
 *   - Si la entrada ya tiene `media_id`  → se niega a ejecutar. No republica.
 *   - Si ya hay `container_id` sin publicar → REUTILIZA ese contenedor.
 *     Nunca crea un segundo contenedor para la misma publicación.
 *   - Antes de llamar a `media_publish` marca `publish_attempted`. Si la
 *     respuesta se pierde por red, el script NO reintentará solo: haría falta
 *     comprobar a mano si la publicación existe.
 *
 * Además exige el indicador `--confirm`. Sin él no toca la red de escritura.
 *
 * El token se lee de `.env.local` y no se imprime nunca, en ningún camino.
 *
 *   npm run instagram:publish -- --job=<ID> --metadata=<ruta> --image-url=<url>
 *   ... añadiendo --confirm para publicar de verdad.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  getAccount,
  createMediaContainer,
  getContainerStatus,
  getContainerErrorDetail,
  publishContainer,
  getMedia,
  checkPublicImage,
  analyzeCaption,
  GraphError,
  API_VERSION,
  GRAPH_HOST,
} from '../lib/instagram/publish.mjs';
import { requireSecret } from './instagram-env.mjs';
import { leerTrabajo, cargarPropuesta } from './job-args.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIARIO = join(REPO, '.instagram-publish-state.json');

const CUENTA_ESPERADA = 'cymarq_obras';

const USO =
  'npm run instagram:publish -- --job=<ID> --metadata=<ruta> --image-url=<url> [--confirm]';

/** Sondeo del estado del contenedor. Una imagen suele estar lista al instante. */
const SONDEO_MAX_INTENTOS = 20;
const SONDEO_ESPERA_MS = 3000;

/* ------------------------------------------------------------------ */
/* Diario                                                              */
/* ------------------------------------------------------------------ */

async function leerDiario() {
  try {
    return JSON.parse(await readFile(DIARIO, 'utf8'));
  } catch {
    return {};
  }
}

async function guardarDiario(diario) {
  await writeFile(DIARIO, `${JSON.stringify(diario, null, 2)}\n`, 'utf8');
}

/** Actualiza la entrada del trabajo indicado y la persiste inmediatamente. */
async function anotar(jobId, cambios) {
  const diario = await leerDiario();
  diario[jobId] = { ...(diario[jobId] ?? {}), ...cambios, actualizado: new Date().toISOString() };
  await guardarDiario(diario);
  return diario[jobId];
}

/* ------------------------------------------------------------------ */

const bloque = (t) => {
  console.log(`\n${t}`);
  console.log('═'.repeat(62));
};

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

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
  const trabajo = leerTrabajo({ varianteCaption: 'instagram', uso: USO });
  const JOB_ID = trabajo.jobId;
  const IMAGEN_URL = trabajo.imageUrl;
  const token = await requireSecret('INSTAGRAM_PUBLISH_TOKEN');

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  PASO 4 — PUBLICACIÓN REAL CONTROLADA                        ║');
  console.log(`║  Modo: ${(confirmar ? 'PUBLICAR DE VERDAD' : 'ensayo (sin --confirm)').padEnd(53)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  /* --- Diario: ¿ya se hizo esto? --------------------------------- */
  const previo = (await leerDiario())[JOB_ID] ?? {};

  if (previo.media_id) {
    bloque('DETENIDO — ESTA PUBLICACIÓN YA EXISTE');
    console.log(`  job         : ${JOB_ID}`);
    console.log(`  media_id    : ${previo.media_id}`);
    console.log(`  permalink   : ${previo.permalink ?? '(no registrado)'}`);
    console.log(`  publicada   : ${previo.publicado_en ?? '(desconocido)'}`);
    console.log('\n  No se republica. Instagram no permite borrar por API.\n');
    return;
  }

  if (previo.publish_attempted && !previo.media_id) {
    bloque('DETENIDO — INTENTO DE PUBLICACIÓN ANTERIOR SIN RESPUESTA');
    console.log(`  container_id: ${previo.container_id ?? '(desconocido)'}`);
    console.log('\n  Ya se llamó a media_publish y no se registró el resultado.');
    console.log('  Reintentar podría duplicar la publicación.');
    console.log('  Comprueba a mano en Instagram si la publicación existe antes');
    console.log('  de tocar el diario .instagram-publish-state.json.\n');
    process.exitCode = 1;
    return;
  }

  /* --- Contenido -------------------------------------------------- */
  const { metadata, caption } = await cargarPropuesta(trabajo);
  const analisis = analyzeCaption(caption);

  bloque('CONTENIDO A PUBLICAR');
  console.log(`  job         : ${JOB_ID}`);
  console.log(`  proyecto    : ${metadata.proyecto_nombre}`);
  console.log(`  imagen      : ${IMAGEN_URL}`);
  console.log(`  caption     : ${analisis.characters} caracteres, ${analisis.hashtags.length} hashtags`);

  if (!analisis.ok) {
    console.error('\n  ABORTADO: el caption no cumple los límites.');
    for (const p of analisis.problems) console.error(`    · ${p}`);
    process.exitCode = 1;
    return;
  }

  /* --- Comprobaciones previas ------------------------------------ */
  bloque('COMPROBACIONES PREVIAS');

  const cuenta = await getAccount(token);
  const igId = cuenta.user_id ? String(cuenta.user_id) : null;
  console.log(`  cuenta      : @${cuenta.username}`);
  console.log(`  user_id     : ${igId}`);

  if (cuenta.username !== CUENTA_ESPERADA) {
    console.error(`\n  ABORTADO: el token es de @${cuenta.username}, no de @${CUENTA_ESPERADA}.`);
    process.exitCode = 1;
    return;
  }
  if (!igId) {
    console.error('\n  ABORTADO: la API no devolvió user_id.');
    process.exitCode = 1;
    return;
  }

  const imagen = await checkPublicImage(IMAGEN_URL);
  console.log(`  imagen      : HTTP ${imagen.status}, ${imagen.contentType}, ` +
    `${imagen.width}x${imagen.height}, ${Math.round(imagen.bytes / 1024)} KB`);
  if (!imagen.ok) {
    console.error('\n  ABORTADO: la imagen no cumple los requisitos de Meta.');
    for (const p of imagen.problems) console.error(`    · ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log('  [OK] Todo listo.');

  if (!confirmar) {
    bloque('ENSAYO — NO SE HA EJECUTADO NINGUNA ESCRITURA');
    console.log('  Para publicar de verdad:');
    console.log('      npm run instagram:publish -- --confirm\n');
    return;
  }

  /* --- 1. Contenedor --------------------------------------------- */
  bloque(`1/4  CONTENEDOR   POST ${GRAPH_HOST}/${API_VERSION}/${igId}/media`);

  let containerId = previo.container_id ?? null;

  if (containerId) {
    console.log(`  Ya existía un contenedor de un intento anterior: ${containerId}`);
    console.log('  Se REUTILIZA. No se crea uno nuevo.');
  } else {
    try {
      const contenedor = await createMediaContainer({
        igId,
        token,
        imageUrl: IMAGEN_URL,
        caption,
      });
      containerId = contenedor?.id ? String(contenedor.id) : null;
      if (!containerId) throw new GraphError('La respuesta no incluyó el id del contenedor.');
      // Se anota ANTES de cualquier otra cosa: si el proceso muere ahora, la
      // próxima ejecución reutilizará este contenedor en vez de crear otro.
      await anotar(JOB_ID, {
        job: JOB_ID,
        container_id: containerId,
        creado_en: new Date().toISOString(),
        image_url: IMAGEN_URL,
        caption_caracteres: analisis.characters,
        ig_user_id: igId,
        username: cuenta.username,
      });
      console.log(`  CONTAINER_ID: ${containerId}`);
      console.log('  (todavía no hay nada visible en Instagram)');
    } catch (error) {
      console.error('\n  FALLO al crear el contenedor. NO se continúa.');
      mostrarError(error);
      process.exitCode = 1;
      return;
    }
  }

  /* --- 2. Estado -------------------------------------------------- */
  bloque(`2/4  ESTADO   GET ${GRAPH_HOST}/${API_VERSION}/${containerId}?fields=status_code`);

  let estado = null;
  for (let intento = 1; intento <= SONDEO_MAX_INTENTOS; intento += 1) {
    let respuesta;
    try {
      respuesta = await getContainerStatus(containerId, token);
    } catch (error) {
      console.error(`\n  FALLO consultando el estado. NO se publica.`);
      mostrarError(error);
      process.exitCode = 1;
      return;
    }

    estado = respuesta?.status_code ?? null;
    console.log(`  intento ${String(intento).padStart(2)}: ${estado}`);

    if (estado === 'FINISHED') break;

    if (estado === 'ERROR' || estado === 'EXPIRED' || estado === 'PUBLISHED') {
      console.error(`\n  ABORTADO: el contenedor está en ${estado}. NO se publica.`);
      const detalle = await getContainerErrorDetail(containerId, token);
      if (detalle) console.error(`  Detalle de Meta: ${detalle}`);
      await anotar(JOB_ID, { estado_final_contenedor: estado });
      process.exitCode = 1;
      return;
    }

    if (intento < SONDEO_MAX_INTENTOS) await esperar(SONDEO_ESPERA_MS);
  }

  if (estado !== 'FINISHED') {
    console.error(`\n  ABORTADO: el contenedor no llegó a FINISHED (último: ${estado}).`);
    console.error('  NO se publica. El contenedor caducará solo en 24 h.');
    await anotar(JOB_ID, { estado_final_contenedor: estado });
    process.exitCode = 1;
    return;
  }

  console.log('  Estado FINISHED: el contenedor está listo.');

  /* --- 3. Publicar ------------------------------------------------ */
  bloque(`3/4  PUBLICAR   POST ${GRAPH_HOST}/${API_VERSION}/${igId}/media_publish`);
  console.log('  Esta llamada es IRREVERSIBLE.');

  // Marca previa: si la respuesta se pierde, el script se negará a reintentar.
  await anotar(JOB_ID, { publish_attempted: true, publish_intentado_en: new Date().toISOString() });

  let mediaId = null;
  try {
    const publicado = await publishContainer({ igId, token, creationId: containerId });
    mediaId = publicado?.id ? String(publicado.id) : null;
    if (!mediaId) throw new GraphError('La respuesta no incluyó el media_id.');
    await anotar(JOB_ID, { media_id: mediaId, publicado_en: new Date().toISOString() });
    console.log(`  MEDIA_ID: ${mediaId}`);
  } catch (error) {
    console.error('\n  FALLO en media_publish.');
    mostrarError(error);
    console.error('\n  El diario ha quedado marcado como intento sin confirmar.');
    console.error('  Comprueba manualmente en Instagram si la publicación existe.');
    console.error('  NO vuelvas a ejecutar el script sin comprobarlo antes.');
    process.exitCode = 1;
    return;
  }

  /* --- 4. Permalink ----------------------------------------------- */
  bloque(`4/4  PERMALINK   GET ${GRAPH_HOST}/${API_VERSION}/${mediaId}`);

  let media = null;
  try {
    media = await getMedia(mediaId, token);
    await anotar(JOB_ID, { permalink: media?.permalink ?? null, timestamp_meta: media?.timestamp ?? null });
    console.log(`  permalink : ${media?.permalink ?? '(no devuelto)'}`);
    console.log(`  tipo      : ${media?.media_type ?? '(no devuelto)'}`);
    console.log(`  timestamp : ${media?.timestamp ?? '(no devuelto)'}`);
  } catch (error) {
    console.error('  La publicación SÍ se creó, pero no se pudo leer el permalink:');
    mostrarError(error);
  }

  /* --- Resultado --------------------------------------------------- */
  bloque('RESULTADO');
  console.log(`  CUENTA DESTINO : @${cuenta.username}`);
  console.log(`  IG USER_ID     : ${igId}`);
  console.log(`  PROYECTO       : ${metadata.proyecto_nombre}`);
  console.log(`  IMAGEN         : ${IMAGEN_URL}`);
  console.log(`  CONTAINER_ID   : ${containerId}`);
  console.log(`  ESTADO         : FINISHED`);
  console.log(`  MEDIA_ID       : ${mediaId}`);
  console.log(`  PERMALINK      : ${media?.permalink ?? '(no devuelto)'}`);
  console.log(`  FECHA/HORA     : ${new Date().toISOString()}  (UTC)`);
  console.log(`                   ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}  (Bogotá)`);
  console.log(`\n  RESULTADO FINAL: PUBLICACIÓN REALIZADA CORRECTAMENTE.`);
  console.log(`  Registrada en el diario. Una segunda ejecución se negará a repetirla.\n`);
}

main().catch((error) => {
  console.error(`\n  Error inesperado: ${error?.message ?? 'desconocido'}\n`);
  process.exitCode = 1;
});
