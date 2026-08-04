/**
 * Publicación de contenido en la Página de Facebook "Cymarq".
 *
 * Host `graph.facebook.com` y Page Access Token. Es una integración DISTINTA
 * de la de Instagram: otro host, otro token, otro flujo y otro diario de
 * estado. Nada de este archivo toca el flujo de Instagram.
 *
 * Diferencia de flujo respecto a Instagram: Facebook NO usa contenedores. Una
 * foto nativa se crea y se publica en una sola llamada a `/<PAGE_ID>/photos`,
 * pasándole la URL pública de la imagen. Por eso aquí no hay ni `creation_id`
 * ni sondeo de `status_code`.
 *
 * Se reutilizan de `../instagram/publish.mjs` las piezas que no dependen de
 * plataforma (clase de error, ocultación del token, lectura de tamaño JPEG y
 * recuento de caption). Es una importación de solo lectura: no se modifica ni
 * se altera el comportamiento del módulo de Instagram.
 *
 * Reglas de seguridad, idénticas a las de Instagram:
 *  - El token nunca se escribe en logs, errores ni respuestas.
 *  - Viaja en la cabecera `Authorization: Bearer`, nunca en la query string.
 *  - Todo texto imprimible pasa antes por `scrubSecret()`.
 */

import { GraphError, scrubSecret, readJpegSize, analyzeCaption } from '../instagram/publish.mjs';

export { GraphError, scrubSecret, describeToken, analyzeCaption } from '../instagram/publish.mjs';

export const GRAPH_HOST = 'https://graph.facebook.com';
export const API_VERSION = 'v25.0';

/** Permisos que ya están concedidos para publicar en la Página. */
export const REQUIRED_SCOPES = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'];

/**
 * Requisitos de la imagen en Facebook.
 *
 * Son bastante más laxos que los de Instagram: admite JPEG y PNG, no impone
 * relación de aspecto ni ancho máximo. Solo se comprueba lo que de verdad
 * puede hacer fallar la llamada.
 */
export const IMAGE_RULES = {
  contentTypes: ['image/jpeg', 'image/png'],
  maxBytes: 10 * 1024 * 1024,
};

/** Límite real del texto de una publicación de Página. */
export const CAPTION_RULES = { maxCharacters: 63206 };

/**
 * Host de subida de medios. NO es `graph.facebook.com`: los Reels se suben por
 * `rupload.facebook.com`, que además autentica con `Authorization: OAuth` en vez
 * de `Bearer`. Confundir host o esquema da un 401 sin explicación.
 */
export const RUPLOAD_HOST = 'https://rupload.facebook.com';

/** Sondeo del estado de un Reel. Transcodificar tarda; no se abandona pronto. */
export const SONDEO_REEL = { intentos: 60, esperaMs: 5000 }; // hasta 5 minutos

/* ------------------------------------------------------------------ */
/* Cliente de la Graph API                                             */
/* ------------------------------------------------------------------ */

async function request(method, path, { token, fields, body } = {}) {
  if (!token) throw new GraphError('No hay Page Access Token disponible.');

  const url = new URL(`${GRAPH_HOST}/${API_VERSION}/${path}`);
  if (fields) url.searchParams.set('fields', fields);

  const init = { method, headers: { Authorization: `Bearer ${token}` } };
  if (body) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    const detalle = scrubSecret(error?.message ?? 'desconocido', token);
    if (method === 'POST') {
      // Un fallo de red en una escritura es ambiguo: la petición pudo llegar.
      throw new GraphError(
        `Fallo de red (estado indeterminado, NO reintentar a ciegas): ${detalle}`
      );
    }
    throw new GraphError(`Fallo de red: ${detalle}`);
  }

  const raw = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GraphError(
      `Respuesta no JSON (HTTP ${response.status}): ${scrubSecret(raw.slice(0, 300), token)}`,
      { status: response.status }
    );
  }

  if (!response.ok || parsed?.error) {
    const err = parsed?.error ?? {};
    throw new GraphError(scrubSecret(err.message ?? `HTTP ${response.status}`, token), {
      status: response.status,
      code: err.code,
      subcode: err.error_subcode,
      type: err.type,
      fbtraceId: err.fbtrace_id,
    });
  }

  return parsed;
}

export const graphGet = (path, opciones) => request('GET', path, opciones);

/** POST. No reintenta nunca: un reintento a ciegas podría duplicar el post. */
export const graphPost = (path, opciones) => request('POST', path, opciones);

/* ------------------------------------------------------------------ */
/* Lecturas                                                            */
/* ------------------------------------------------------------------ */

/**
 * Identidad del token. Con un Page Access Token, `/me` devuelve la propia
 * Página, no la persona: es la forma directa de comprobar que el token es de
 * Página y de cuál.
 */
export async function getTokenIdentity(token) {
  return graphGet('me', { token, fields: 'id,name' });
}

/** Datos públicos de la Página. */
export async function getPage(pageId, token) {
  return graphGet(pageId, { token, fields: 'id,name,username,link,category,is_published' });
}

/** Datos de una publicación ya creada, incluido su enlace permanente. */
export async function getPost(postId, token) {
  return graphGet(postId, { token, fields: 'id,permalink_url,created_time,message' });
}

/**
 * Datos de un vídeo o Reel ya creado.
 *
 * Los campos no son los de un post: un objeto de vídeo expone `permalink_url` y
 * `created_time`, pero no `message`. Pedir campos que no existen hace fallar la
 * llamada entera, así que esta lectura es distinta de `getPost()`.
 */
export async function getVideo(videoId, token) {
  return graphGet(videoId, { token, fields: 'id,permalink_url,created_time,description,length' });
}

/**
 * Estado de procesamiento de un Reel.
 *
 * `status.video_status` es lo que decide: `ready` es publicable/publicado,
 * `processing` sigue en curso y `error` es definitivo. Las fases interiores
 * (`uploading_phase`, `processing_phase`, `publishing_phase`) sirven para saber
 * DÓNDE se quedó cuando algo falla.
 */
export async function getReelStatus(videoId, token) {
  return graphGet(videoId, { token, fields: 'status' });
}

/* ------------------------------------------------------------------ */
/* Escritura                                                           */
/* ------------------------------------------------------------------ */

/**
 * Publica una foto nativa en la Página. ES IRREVERSIBLE: queda visible al
 * instante.
 *
 * Endpoint oficial: POST /<PAGE_ID>/photos con `url` (la imagen la descarga
 * Facebook desde ese enlace público) y `caption` (el texto del post).
 *
 * Devuelve `{ id, post_id }`: `id` es el de la foto y `post_id` el de la
 * publicación en la biografía de la Página, que es el que da el permalink.
 */
export async function publishPhoto({ pageId, token, imageUrl, caption }) {
  const body = { url: imageUrl, published: true };
  if (typeof caption === 'string' && caption.length > 0) body.caption = caption;
  return graphPost(`${pageId}/photos`, { token, body });
}

/**
 * Publica un vídeo de feed en la Página. ES IRREVERSIBLE.
 *
 * POST /<PAGE_ID>/videos con `file_url`: Facebook descarga el MP4 desde ese
 * enlace público, igual que hace con `url` en `/photos`. Una sola llamada.
 *
 * Es la vía LAXA: acepta cualquier relación de aspecto y duración, pero el
 * resultado es un vídeo de feed, no un Reel. Para 9:16 se prefiere `/video_reels`.
 *
 * Devuelve `{ id }`, el identificador del vídeo. Ojo: NO es un `post_id`; el
 * enlace se obtiene con `getVideo()`.
 */
export async function publishVideo({ pageId, token, videoUrl, description }) {
  const body = { file_url: videoUrl, published: true };
  if (typeof description === 'string' && description.length > 0) {
    body.description = description;
  }
  return graphPost(`${pageId}/videos`, { token, body });
}

/* --- Reels: subida en tres fases -------------------------------------- */

/**
 * FASE 1 de un Reel — reserva el hueco.
 *
 * No sube nada y no publica nada: devuelve `{ video_id, upload_url }`. El
 * `video_id` es el identificador con el que se seguirá el resto del flujo, y
 * conviene anotarlo en el diario antes de continuar.
 */
export async function startReelUpload({ pageId, token }) {
  return graphPost(`${pageId}/video_reels`, { token, body: { upload_phase: 'start' } });
}

/**
 * FASE 2 de un Reel — le dice a Facebook de dónde descargar el MP4.
 *
 * Va contra `upload_url` (host `rupload.facebook.com`), no contra la Graph API,
 * y todo viaja en CABECERAS, no en el cuerpo:
 *
 *   Authorization: OAuth <token>     ← OAuth, no Bearer
 *   file_url: <url pública del MP4>  ← subida alojada: la descarga Facebook
 *
 * Con `file_url` no se transfieren bytes desde aquí: es el mismo modelo que
 * `/photos` y `/videos`, y por eso encaja con el catálogo público que ya existe.
 * La alternativa (subir bytes con `offset`/`file_size`) obligaría a que la VM
 * cargara el archivo entero en memoria y a gestionar reanudaciones.
 *
 * Esta llamada NO publica todavía.
 */
export async function uploadReelFromUrl({ uploadUrl, token, videoUrl }) {
  if (!token) throw new GraphError('No hay Page Access Token disponible.');
  if (!uploadUrl) throw new GraphError('Facebook no devolvió upload_url en la fase de inicio.');

  // El upload_url lo da Meta. Se comprueba el host para no enviar el token a un
  // destino inesperado si la respuesta viniera manipulada o mal formada.
  let destino;
  try {
    destino = new URL(uploadUrl);
  } catch {
    throw new GraphError('El upload_url devuelto por Facebook no es una URL válida.');
  }
  if (destino.protocol !== 'https:' || !destino.hostname.endsWith('.facebook.com')) {
    throw new GraphError(
      `El upload_url apunta a ${destino.protocol}//${destino.hostname}, que no es de Facebook. ` +
        'No se envía el token.'
    );
  }

  let respuesta;
  try {
    respuesta = await fetch(destino, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${token}`,
        file_url: videoUrl,
      },
    });
  } catch (error) {
    throw new GraphError(
      'Fallo de red al iniciar la descarga del vídeo (estado indeterminado, NO reintentar ' +
        `a ciegas): ${scrubSecret(error?.message ?? 'desconocido', token)}`
    );
  }

  const raw = await respuesta.text();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GraphError(
      `Respuesta no JSON de rupload (HTTP ${respuesta.status}): ` +
        scrubSecret(raw.slice(0, 300), token),
      { status: respuesta.status }
    );
  }

  if (!respuesta.ok || parsed?.error || parsed?.debug_info) {
    const err = parsed?.error ?? {};
    // rupload no usa `error` para los fallos de medio: los pone en `debug_info`.
    // Sin leerlo, un 422 llega sin ningún motivo aprovechable.
    const detalle = parsed?.debug_info
      ? `${parsed.debug_info.type}: ${parsed.debug_info.message}`
      : err.message ?? `HTTP ${respuesta.status}`;
    throw new GraphError(scrubSecret(detalle, token), {
      status: respuesta.status,
      code: err.code,
      subcode: err.error_subcode,
      type: parsed?.debug_info?.type ?? err.type,
      fbtraceId: err.fbtrace_id,
    });
  }

  return parsed;
}

/**
 * FASE 2 de un Reel, variante BYTES — sube el MP4 desde el disco.
 *
 * POR QUE EXISTE, Y POR QUE ES LA VIA POR DEFECTO
 *
 * La variante `file_url` obliga a Facebook a descargar el archivo de nuestro
 * sitio, y su descargador (`meta-externalagent`) OBEDECE robots.txt. El
 * robots.txt gestionado de Cloudflare bloquea justamente ese agente, así que la
 * descarga devuelve:
 *
 *   FileUrlProcessingError: Unable to fetch media from URL,
 *   got status code: 403 Restricted by robots.txt
 *
 * Subir los bytes elimina la dependencia entera: Facebook no rastrea nada, y no
 * hay que relajar el robots.txt del sitio ni tocar la configuración de
 * Cloudflare para publicar un Reel. (El descargador de Instagram no está
 * bloqueado, y por eso allí `video_url` sí funciona.)
 *
 * Cabeceras: `offset: 0` y `file_size` con el tamaño exacto. Se sube de una vez
 * — un Reel de 9:16 y pocos segundos son megabytes, no gigabytes, y trocear
 * añadiría estados intermedios que no hacen falta.
 *
 * NO publica: eso sigue siendo solo la fase `finish`.
 */
export async function uploadReelBytes({ uploadUrl, token, bytes }) {
  if (!token) throw new GraphError('No hay Page Access Token disponible.');
  if (!uploadUrl) throw new GraphError('Facebook no devolvió upload_url en la fase de inicio.');
  if (!bytes || bytes.byteLength === 0) throw new GraphError('No hay bytes que subir.');

  let destino;
  try {
    destino = new URL(uploadUrl);
  } catch {
    throw new GraphError('El upload_url devuelto por Facebook no es una URL válida.');
  }
  if (destino.protocol !== 'https:' || !destino.hostname.endsWith('.facebook.com')) {
    throw new GraphError(
      `El upload_url apunta a ${destino.protocol}//${destino.hostname}, que no es de Facebook. ` +
        'No se envía el token ni el archivo.'
    );
  }

  let respuesta;
  try {
    respuesta = await fetch(destino, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${token}`,
        offset: '0',
        file_size: String(bytes.byteLength),
        'Content-Type': 'application/octet-stream',
      },
      body: bytes,
    });
  } catch (error) {
    throw new GraphError(
      'Fallo de red subiendo el vídeo (estado indeterminado, NO reintentar a ciegas): ' +
        scrubSecret(error?.message ?? 'desconocido', token)
    );
  }

  const raw = await respuesta.text();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GraphError(
      `Respuesta no JSON de rupload (HTTP ${respuesta.status}): ` +
        scrubSecret(raw.slice(0, 300), token),
      { status: respuesta.status }
    );
  }

  if (!respuesta.ok || parsed?.error || parsed?.debug_info) {
    const err = parsed?.error ?? {};
    // rupload informa de los fallos de medio en `debug_info`, no en `error`.
    const detalle = parsed?.debug_info
      ? `${parsed.debug_info.type}: ${parsed.debug_info.message}`
      : err.message ?? `HTTP ${respuesta.status}`;
    throw new GraphError(scrubSecret(detalle, token), {
      status: respuesta.status,
      code: err.code,
      subcode: err.error_subcode,
      type: parsed?.debug_info?.type ?? err.type,
      fbtraceId: err.fbtrace_id,
    });
  }

  return parsed;
}

/**
 * FASE 3 de un Reel — publica. ES IRREVERSIBLE.
 *
 * `video_state=PUBLISHED` es lo que lo hace visible. Con `SCHEDULED` o `DRAFT`
 * no se publicaría, pero este sistema no los usa: quien decide el cuándo es el
 * calendario de CYMARQ_SOCIAL, no Meta.
 */
export async function finishReel({ pageId, token, videoId, description }) {
  const body = {
    upload_phase: 'finish',
    video_id: videoId,
    video_state: 'PUBLISHED',
  };
  if (typeof description === 'string' && description.length > 0) {
    body.description = description;
  }
  return graphPost(`${pageId}/video_reels`, { token, body });
}

/* --- Historias: las mismas tres fases, otro borde ---------------------- */

/**
 * FASE 1 de una historia — reserva el hueco en `/video_stories`.
 *
 * Es el mismo protocolo que `/video_reels`: devuelve `{ video_id, upload_url }`
 * y no publica nada. La FASE 2 tampoco cambia — se reutiliza `uploadReelBytes()`
 * tal cual, porque el host de subida y sus cabeceras son idénticos y duplicar
 * ese código sólo crearía dos sitios donde arreglar el mismo fallo.
 *
 * Lo único que de verdad difiere es el borde de la Graph API y la fase `finish`.
 */
export async function startStoryUpload({ pageId, token }) {
  return graphPost(`${pageId}/video_stories`, { token, body: { upload_phase: 'start' } });
}

/**
 * FASE 3 de una historia — publica. ES IRREVERSIBLE.
 *
 * Diferencias con `finishReel()`, y por qué:
 *
 *  - NO lleva `description`. Una historia no tiene texto; el parámetro se
 *    descartaría en silencio.
 *  - NO lleva `video_state`. `/video_stories` no admite borradores ni
 *    programación: la fase `finish` publica, y punto.
 *
 * Devuelve `{ success, post_id }`. Aquí sí hay `post_id` propio, a diferencia de
 * los Reels, donde el identificador acaba siendo el `video_id`.
 */
export async function finishStory({ pageId, token, videoId }) {
  return graphPost(`${pageId}/video_stories`, {
    token,
    body: { upload_phase: 'finish', video_id: videoId },
  });
}

/* ------------------------------------------------------------------ */
/* Validaciones locales                                                */
/* ------------------------------------------------------------------ */

/** Analiza el texto con los límites de Facebook, no con los de Instagram. */
export function analyzeMessage(caption) {
  const base = analyzeCaption(caption);
  const problems = [];
  if (base.characters === 0) problems.push('El texto está vacío.');
  if (base.characters > CAPTION_RULES.maxCharacters) {
    problems.push(`${base.characters} caracteres supera el máximo de ${CAPTION_RULES.maxCharacters}.`);
  }
  return { ...base, problems, ok: problems.length === 0 };
}

/**
 * Comprueba la imagen tal y como la descargará Facebook: sin credenciales,
 * siguiendo redirecciones, y verificando que lo que llega es una imagen.
 */
export async function checkPublicImage(url) {
  const result = {
    url,
    ok: false,
    status: null,
    contentType: null,
    bytes: null,
    width: null,
    height: null,
    problems: [],
  };

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    result.problems.push('La URL no es válida.');
    return result;
  }
  if (parsedUrl.protocol !== 'https:') result.problems.push('La URL debe ser HTTPS.');

  let response;
  try {
    response = await fetch(parsedUrl, { method: 'GET', redirect: 'follow' });
  } catch (error) {
    result.problems.push(`No se pudo descargar: ${error?.message ?? 'error de red'}`);
    return result;
  }

  result.status = response.status;
  result.contentType = response.headers.get('content-type');
  const bytes = new Uint8Array(await response.arrayBuffer());
  result.bytes = bytes.byteLength;

  if (response.status !== 200) result.problems.push(`Responde HTTP ${response.status}, debe ser 200.`);

  const tipo = (result.contentType ?? '').split(';')[0].trim();
  if (!IMAGE_RULES.contentTypes.includes(tipo)) {
    result.problems.push(
      `Content-Type «${result.contentType}», admitidos: ${IMAGE_RULES.contentTypes.join(', ')}.`
    );
  }
  if (result.bytes > IMAGE_RULES.maxBytes) {
    result.problems.push(`Pesa ${result.bytes} bytes, el máximo es ${IMAGE_RULES.maxBytes}.`);
  }

  const size = readJpegSize(bytes);
  if (size) {
    result.width = size.width;
    result.height = size.height;
  }

  result.ok = result.problems.length === 0;
  return result;
}
