/**
 * Publicación real controlada en la Página de Facebook "Cymarq".
 *
 * TRES FLUJOS, según `--media-type`:
 *
 * image (por defecto) — una sola llamada de escritura:
 *   POST /<PAGE_ID>/photos   (url + caption)  → { id, post_id }   IRREVERSIBLE
 *   GET  /<POST_ID>?fields=permalink_url,created_time
 *
 * video — vídeo de feed, también una sola llamada:
 *   POST /<PAGE_ID>/videos   (file_url + description) → { id }    IRREVERSIBLE
 *
 * reels — tres fases, y solo la última publica:
 *   1. POST /<PAGE_ID>/video_reels  upload_phase=start  → { video_id, upload_url }
 *   2. POST <upload_url>            file_url: <mp4>     ← Facebook descarga
 *   3. POST /<PAGE_ID>/video_reels  upload_phase=finish → IRREVERSIBLE
 *   4. GET  /<VIDEO_ID>?fields=status                   ← esperar a `ready`
 *
 * Que las dos primeras fases NO publiquen es lo que permite reutilizarlas: si el
 * proceso muere después del `start`, la ejecución siguiente retoma ese
 * `video_id` en vez de reservar otro, igual que Instagram reutiliza el
 * contenedor.
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

import { readFile, writeFile, stat } from 'node:fs/promises';

import {
  getTokenIdentity,
  getPage,
  publishPhoto,
  publishVideo,
  startReelUpload,
  uploadReelFromUrl,
  uploadReelBytes,
  finishReel,
  getReelStatus,
  getVideo,
  getPost,
  checkPublicImage,
  analyzeMessage,
  GraphError,
  SONDEO_REEL,
  GRAPH_HOST,
  API_VERSION,
} from '../lib/facebook/publish.mjs';
import {
  comprobarVideoPublico,
  describirVideo,
  REGLAS_FACEBOOK_REEL,
  REGLAS_FACEBOOK_VIDEO,
} from '../lib/social/video.mjs';
import {
  leerTrabajoFacebook,
  cargarPropuesta,
  requirePageToken,
  readPageId,
  DIARIO,
  PAGINA_ESPERADA,
} from './facebook-job.mjs';

import { exigirProduccion } from './entorno.mjs';

const USO =
  'npm run facebook:publish -- --job=<ID> --metadata=<ruta> ' +
  '(--image-url=<url> | --media-type=reels|video --video-url=<url>) [--confirm]';

const bloque = (t) => {
  console.log(`\n${t}`);
  console.log('═'.repeat(62));
};

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

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
  // BARRERA DE ENTORNO. Es lo mas abajo que puede estar: dentro del propio
  // publicador, antes del diario y antes de cualquier peticion. Invocar este
  // script a mano desde otra maquina no la salta.
  if (confirmar) exigirProduccion('facebook-publish');

  const trabajo = leerTrabajoFacebook(USO);
  const { jobId: JOB_ID, imageUrl: IMAGEN_URL, variante, mediaType: TIPO } = trabajo;
  const ES_REEL = TIPO === 'reels';
  const ES_VIDEO = TIPO === 'video';
  const MEDIO_URL = ES_REEL || ES_VIDEO ? trabajo.videoUrl : IMAGEN_URL;
  const token = await requirePageToken();
  const pageId = await readPageId();

  // Solo los Reels suben bytes: /videos no tiene endpoint de subida por trozos
  // en este flujo y sigue usando file_url.
  const ARCHIVO_LOCAL = ES_REEL ? (trabajo.videoFile ?? null) : null;

  const ETIQUETA_TIPO = ES_REEL ? 'REEL (vídeo)' : ES_VIDEO ? 'vídeo de feed' : 'foto de feed';

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  FACEBOOK — PUBLICACIÓN REAL CONTROLADA                      ║');
  console.log(`║  Modo: ${(confirmar ? 'PUBLICAR DE VERDAD' : 'ensayo (sin --confirm)').padEnd(53)}║`);
  console.log(`║  Tipo: ${ETIQUETA_TIPO.padEnd(53)}║`);
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
  console.log(`  tipo      : ${TIPO}`);
  console.log(`  ${ES_REEL || ES_VIDEO ? 'vídeo   ' : 'imagen  '}  : ${MEDIO_URL}`);
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

  if (ES_REEL || ES_VIDEO) {
    // Las reglas de un Reel son bastante más estrictas que las de un vídeo de
    // feed: 9:16 obligatorio y 90 s de tope. Se valida contra las del tipo que
    // se va a publicar de verdad, no contra las genéricas.
    const reglas = ES_REEL ? REGLAS_FACEBOOK_REEL : REGLAS_FACEBOOK_VIDEO;

    // Si se van a subir los bytes, el archivo local tiene que existir y coincidir
    // en tamaño con lo que sirve la URL. Comprobarlo aquí evita descubrirlo a
    // mitad del flujo, con una reserva ya hecha en Meta.
    let bytesLocales = null;
    if (ARCHIVO_LOCAL) {
      try {
        bytesLocales = (await stat(ARCHIVO_LOCAL)).size;
        console.log(`  archivo   : ${ARCHIVO_LOCAL} (${bytesLocales} bytes)`);
      } catch (error) {
        console.error(`\n  ABORTADO: no se puede leer --video-file: ${ARCHIVO_LOCAL}`);
        console.error(`    ${error?.message ?? 'error'}`);
        process.exitCode = 1;
        return;
      }
    }

    const video = await comprobarVideoPublico(MEDIO_URL, reglas);
    console.log(`  vídeo     : HTTP ${video.status}, ${video.contentType}`);
    console.log(`  medidas   : ${describirVideo(video.info, video.bytes)}`);
    console.log(`  rangos    : ${video.aceptaRangos ?? '(no anunciado)'}`);
    for (const a of video.avisos) console.log(`  aviso     : ${a}`);
    if (!video.ok) {
      console.error(
        `\n  ABORTADO: el vídeo no cumple los requisitos de Facebook ${ES_REEL ? 'Reels' : 'vídeo'}.`
      );
      for (const p of video.problemas) console.error(`    · ${p}`);
      process.exitCode = 1;
      return;
    }
    if (bytesLocales !== null && video.bytes !== null && bytesLocales !== video.bytes) {
      console.error('\n  ABORTADO: el archivo local y el que sirve la URL no coinciden.');
      console.error(`    local: ${bytesLocales} bytes · URL: ${video.bytes} bytes`);
      console.error('    Se publicaría un vídeo distinto del revisado.');
      process.exitCode = 1;
      return;
    }
  } else {
    const imagen = await checkPublicImage(IMAGEN_URL);
    console.log(`  imagen    : HTTP ${imagen.status}, ${imagen.contentType}, ` +
      `${imagen.width}x${imagen.height}, ${Math.round(imagen.bytes / 1024)} KB`);
    if (!imagen.ok) {
      console.error('\n  ABORTADO: la imagen no cumple los requisitos.');
      for (const p of imagen.problems) console.error(`    · ${p}`);
      process.exitCode = 1;
      return;
    }
  }
  console.log('  [OK] Todo listo.');

  if (!confirmar) {
    bloque('ENSAYO — NO SE HA EJECUTADO NINGUNA ESCRITURA');
    console.log('  Para publicar de verdad:');
    console.log('      npm run facebook:publish -- --confirm\n');
    return;
  }

  /* --- Datos comunes del diario ------------------------------------- */
  const comunes = {
    job: JOB_ID,
    page_id: String(pageId),
    page_name: pagina.name,
    media_type: TIPO,
    ...(ES_REEL || ES_VIDEO ? { video_url: MEDIO_URL } : { image_url: IMAGEN_URL }),
    caption_variante: variante,
    caption_caracteres: analisis.characters,
  };

  let photoId = null;
  let postId = null;
  let videoId = null;

  if (ES_REEL) {
    /* ============ REEL: tres fases, solo la última publica ========== */

    // --- Fase 1: reservar. No publica nada, así que se puede reutilizar.
    //
    // Solo se reutiliza si la SUBIDA tambien se completo. Un video_id cuya
    // subida fallo no tiene medio detras: llamar a `finish` sobre el publicaria
    // un Reel vacio o daria un error opaco. En ese caso se reserva uno nuevo y
    // el anterior se abandona — una reserva sin publicar caduca sola y no deja
    // nada visible en la Pagina.
    const subidaPrevia = Boolean(previo.reel_subida);
    videoId = subidaPrevia ? (previo.video_id ?? null) : null;

    if (previo.video_id && !subidaPrevia) {
      bloque('1/4  DESCARTAR   reserva anterior sin subida completada');
      console.log(`  video_id anterior : ${previo.video_id}`);
      console.log('  Su subida no consta como completada, asi que NO se reutiliza:');
      console.log('  publicar sobre esa reserva daria un Reel sin video.');
      console.log('  Se reserva una nueva. La anterior caduca sola sin publicar nada.');
    }

    if (videoId) {
      bloque('1/4  REUTILIZAR   video_id de un intento anterior');
      console.log(`  Ya existía un video_id con la subida hecha: ${videoId}`);
      console.log('  Se REUTILIZA. No se reserva otro.');
    } else {
      bloque(`1/4  INICIAR   POST ${GRAPH_HOST}/${API_VERSION}/${pageId}/video_reels`);
      console.log('  Reserva el hueco. Todavía NO publica nada.');
      try {
        const inicio = await startReelUpload({ pageId, token });
        videoId = inicio?.video_id ? String(inicio.video_id) : null;
        const uploadUrl = inicio?.upload_url ?? null;
        if (!videoId || !uploadUrl) {
          throw new GraphError('La respuesta no incluyó video_id y upload_url.');
        }
        // Se anota ANTES de subir: si el proceso muere ahora, la ejecución
        // siguiente retoma este video_id en vez de reservar otro.
        await anotar(JOB_ID, { ...comunes, video_id: videoId, reel_iniciado_en: new Date().toISOString() });
        console.log(`  VIDEO_ID  : ${videoId}`);

        // --- Fase 2: se entrega el MP4. Tampoco publica.
        //
        // Por defecto se SUBEN LOS BYTES. La alternativa (`file_url`) hace que
        // Facebook descargue el archivo de nuestro sitio, y su descargador
        // obedece robots.txt: el robots.txt gestionado de Cloudflare bloquea
        // `meta-externalagent` y la descarga falla con 403. Subir los bytes
        // evita depender de eso.
        let subida;
        if (ARCHIVO_LOCAL) {
          bloque('2/4  SUBIR   POST <upload_url>   (bytes desde disco)');
          console.log(`  archivo   : ${ARCHIVO_LOCAL}`);
          const bytes = await readFile(ARCHIVO_LOCAL);
          console.log(`  tamaño    : ${bytes.byteLength} bytes`);
          console.log('  Se envían los bytes. Facebook no descarga nada. NO publica.');
          subida = await uploadReelBytes({ uploadUrl, token, bytes });
        } else {
          bloque('2/4  SUBIR   POST <upload_url>   (file_url, subida alojada)');
          console.log('  Facebook descarga el MP4 desde la URL pública. NO publica.');
          console.log('  AVISO: esta vía exige que robots.txt permita meta-externalagent.');
          subida = await uploadReelFromUrl({ uploadUrl, token, videoUrl: MEDIO_URL });
        }
        await anotar(JOB_ID, {
          reel_subida: true,
          reel_subida_via: ARCHIVO_LOCAL ? 'bytes' : 'file_url',
          reel_subido_en: new Date().toISOString(),
        });
        console.log(`  respuesta : ${JSON.stringify(subida)}`);
      } catch (error) {
        console.error('\n  FALLO antes de publicar. NO se ha publicado nada.');
        mostrarError(error);
        console.error('\n  Ninguna de estas dos fases publica: es seguro reintentar.');
        process.exitCode = 1;
        return;
      }
    }

    // --- Fase 3: publicar. IRREVERSIBLE.
    bloque(`3/4  PUBLICAR   POST ${GRAPH_HOST}/${API_VERSION}/${pageId}/video_reels  (finish)`);
    console.log('  Esta llamada es IRREVERSIBLE.');

    await anotar(JOB_ID, {
      ...comunes,
      video_id: videoId,
      publish_attempted: true,
      publish_intentado_en: new Date().toISOString(),
    });

    try {
      const fin = await finishReel({ pageId, token, videoId, description: caption });
      if (fin?.success === false) {
        throw new GraphError('Facebook devolvió success=false en la fase finish.');
      }
      // El identificador del Reel es el video_id: /video_reels no devuelve un
      // post_id aparte. Se guarda también como post_id porque es el campo que
      // el envoltorio consulta para saber si algo quedó publicado.
      postId = videoId;
      await anotar(JOB_ID, { post_id: postId, publicado_en: new Date().toISOString() });
      console.log(`  respuesta : ${JSON.stringify(fin)}`);
      console.log(`  VIDEO_ID  : ${videoId}`);
    } catch (error) {
      console.error('\n  FALLO en la fase finish.');
      mostrarError(error);
      console.error('\n  El diario ha quedado marcado como intento sin confirmar.');
      console.error('  Comprueba manualmente en la Página si el Reel existe.');
      console.error('  NO vuelvas a ejecutar el script sin comprobarlo antes.');
      process.exitCode = 1;
      return;
    }

    // --- Fase 4: esperar a que termine de procesarse.
    bloque(`4/4  ESTADO   GET ${GRAPH_HOST}/${API_VERSION}/${videoId}?fields=status`);
    console.log(
      `  sondeo    : hasta ${SONDEO_REEL.intentos} intentos cada ${SONDEO_REEL.esperaMs / 1000} s`
    );
    console.log('  El Reel ya está publicado; esto solo confirma el procesado.');

    let estadoVideo = null;
    for (let intento = 1; intento <= SONDEO_REEL.intentos; intento += 1) {
      let respuesta;
      try {
        respuesta = await getReelStatus(videoId, token);
      } catch (error) {
        console.error('  No se pudo consultar el estado (el Reel sigue publicado):');
        mostrarError(error);
        break;
      }
      estadoVideo = respuesta?.status?.video_status ?? null;
      console.log(`  intento ${String(intento).padStart(2)}: ${estadoVideo ?? '(sin estado)'}`);
      if (estadoVideo === 'ready' || estadoVideo === 'error') break;
      if (intento < SONDEO_REEL.intentos) await esperar(SONDEO_REEL.esperaMs);
    }
    await anotar(JOB_ID, { reel_estado_final: estadoVideo });
    if (estadoVideo === 'error') {
      console.error('\n  ATENCIÓN: Facebook informa de error al procesar el Reel.');
      console.error('  La fase finish se ejecutó: revisa la Página a mano.');
      process.exitCode = 1;
    }
  } else if (ES_VIDEO) {
    /* ============ VÍDEO DE FEED: una sola llamada =================== */
    bloque(`1/2  PUBLICAR   POST ${GRAPH_HOST}/${API_VERSION}/${pageId}/videos`);
    console.log('  Esta llamada es IRREVERSIBLE.');

    await anotar(JOB_ID, {
      ...comunes,
      publish_attempted: true,
      publish_intentado_en: new Date().toISOString(),
    });

    try {
      const resultado = await publishVideo({
        pageId,
        token,
        videoUrl: MEDIO_URL,
        description: caption,
      });
      videoId = resultado?.id ? String(resultado.id) : null;
      if (!videoId) throw new GraphError('La respuesta no incluyó el id del vídeo.');
      postId = videoId;
      await anotar(JOB_ID, {
        video_id: videoId,
        post_id: postId,
        publicado_en: new Date().toISOString(),
      });
      console.log(`  VIDEO_ID : ${videoId}`);
    } catch (error) {
      console.error('\n  FALLO al publicar el vídeo.');
      mostrarError(error);
      console.error('\n  El diario ha quedado marcado como intento sin confirmar.');
      console.error('  Comprueba manualmente en la Página si el vídeo existe.');
      console.error('  NO vuelvas a ejecutar el script sin comprobarlo antes.');
      process.exitCode = 1;
      return;
    }
  } else {
    /* ============ FOTO: el camino de siempre, sin cambios =========== */
    bloque(`1/2  PUBLICAR   POST ${GRAPH_HOST}/${API_VERSION}/${pageId}/photos`);
    console.log('  Esta llamada es IRREVERSIBLE.');

    await anotar(JOB_ID, {
      ...comunes,
      publish_attempted: true,
      publish_intentado_en: new Date().toISOString(),
    });

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
  }

  /* --- Permalink ----------------------------------------------------- */
  const idParaEnlace = postId ?? photoId ?? videoId;
  bloque(`PERMALINK   GET ${GRAPH_HOST}/${API_VERSION}/${idParaEnlace}`);

  let post = null;
  try {
    // Un objeto de vídeo y un post no exponen los mismos campos: pedirle
    // `message` a un vídeo hace fallar la llamada entera.
    post = ES_REEL || ES_VIDEO
      ? await getVideo(idParaEnlace, token)
      : await getPost(idParaEnlace, token);
    await anotar(JOB_ID, { permalink: post?.permalink_url ?? null, created_time: post?.created_time ?? null });
    console.log(`  permalink : ${post?.permalink_url ?? '(no devuelto)'}`);
    console.log(`  creado    : ${post?.created_time ?? '(no devuelto)'}`);
  } catch (error) {
    console.error('  La publicación SÍ se creó, pero no se pudo leer el permalink:');
    mostrarError(error);
  }

  /* --- Resultado ------------------------------------------------------ */
  bloque('RESULTADO');
  console.log(`  PÁGINA DESTINO : ${pagina.name}`);
  console.log(`  PAGE_ID        : ${pageId}`);
  console.log(`  PROYECTO       : ${metadata.proyecto_nombre}`);
  console.log(`  TIPO           : ${TIPO}`);
  console.log(`  ${ES_REEL || ES_VIDEO ? 'VÍDEO         ' : 'IMAGEN        '} : ${MEDIO_URL}`);
  if (videoId) console.log(`  VIDEO_ID       : ${videoId}`);
  if (photoId) console.log(`  PHOTO_ID       : ${photoId}`);
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
