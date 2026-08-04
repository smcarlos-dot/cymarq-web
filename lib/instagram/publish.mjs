/**
 * Publicación de contenido en Instagram — utilidades.
 *
 * Producto Meta: "Instagram API with Instagram Login" (app CYMARQ Social-IG,
 * cuenta @cymarq.obras). Host `graph.instagram.com`, token de usuario de
 * Instagram. NO se usa `graph.facebook.com`: ese host corresponde al otro
 * producto ("Instagram API with Facebook Login"), que además exige una Página
 * de Facebook vinculada.
 *
 * Este módulo es independiente de `webhook.mjs` y no lo importa ni lo altera.
 *
 * OPERACIONES DE ESCRITURA: `createMediaContainer()` y `publishContainer()` son
 * las dos únicas funciones que escriben en la cuenta. Ninguna se ejecuta sola:
 * las invoca `scripts/instagram-publish.mjs`, que exige `--confirm` explícito y
 * lleva un registro en disco para no repetir una publicación ya hecha.
 *
 * Reglas de seguridad aplicadas aquí:
 *  - El token nunca se escribe en logs, mensajes de error ni respuestas.
 *  - El token viaja en la cabecera `Authorization: Bearer`, nunca en la query
 *    string (una URL puede acabar en logs de proxy, historiales o referrers).
 *  - Todo texto que se vaya a imprimir pasa antes por `scrubSecret()`.
 */

export const GRAPH_HOST = 'https://graph.instagram.com';
export const API_VERSION = 'v25.0';

/** Permisos que Meta exige para publicar con Instagram Login. */
export const REQUIRED_SCOPES = ['instagram_business_basic', 'instagram_business_content_publish'];

/**
 * Requisitos oficiales de la imagen para un post de feed.
 * Fuente: docs de Content Publishing y referencia del endpoint `/media`.
 */
export const IMAGE_RULES = {
  contentType: 'image/jpeg',
  maxBytes: 8 * 1024 * 1024,
  minWidth: 320,
  maxWidth: 1440,
  minRatio: 0.8, // 4:5
  maxRatio: 1.91, // 1.91:1
};

/* ------------------------------------------------------------------ */
/* Identidad de la cuenta de destino                                   */
/* ------------------------------------------------------------------ */

/**
 * Cuenta a la que se publica.
 *
 * QUE MANDA, Y POR QUE
 *
 * Manda el `user_id`, no el nombre. Un nombre de usuario se puede cambiar desde
 * la propia aplicacion en cualquier momento, y de hecho se cambio: la cuenta
 * paso de `cymarq_obras` a `cymarq.obras` sin avisar a nadie. Comprobar el
 * nombre habria abortado las publicaciones programadas a partir de ese momento,
 * sin que nada estuviera mal en realidad.
 *
 * El identificador numerico no cambia nunca. Comprobarlo a el es una garantia
 * MAS fuerte, no mas debil: es el que distingue de verdad una cuenta de otra.
 *
 * El nombre se sigue comprobando, pero como AVISO: si vuelve a cambiar, conviene
 * enterarse, no detener la publicacion.
 */
export const IG_USER_ID_ESPERADO = '17841466818245536';
export const CUENTA_ESPERADA = 'cymarq.obras';

/**
 * ¿El token es de la cuenta de CYMARQ?
 *
 * Devuelve `{ ok, motivo, aviso }`. `ok:false` obliga a abortar; `aviso` es
 * informativo y nunca detiene nada.
 */
export function comprobarIdentidad(cuenta) {
  const id = cuenta?.user_id ? String(cuenta.user_id) : null;
  if (!id) {
    return { ok: false, motivo: 'la API no devolvio user_id.', aviso: null };
  }
  if (id !== IG_USER_ID_ESPERADO) {
    return {
      ok: false,
      motivo: `el token es de la cuenta ${id}, no de la de CYMARQ (${IG_USER_ID_ESPERADO}).`,
      aviso: null,
    };
  }
  const aviso = cuenta.username && cuenta.username !== CUENTA_ESPERADA
    ? `la cuenta se llama ahora @${cuenta.username}, no @${CUENTA_ESPERADA}. `
      + 'Es la misma cuenta (mismo user_id): actualiza el nombre esperado cuando puedas.'
    : null;
  return { ok: true, motivo: null, aviso };
}

/** Límites oficiales del caption. */
export const CAPTION_RULES = {
  maxCharacters: 2200,
  maxHashtags: 30,
  maxMentions: 20,
};

/**
 * Sondeo del contenedor según el tipo de medio.
 *
 * Una imagen suele estar FINISHED al instante. Un Reel NO: Meta descarga el
 * MP4, lo transcodifica y genera la portada, y eso tarda de decenas de segundos
 * a varios minutos. Con los 60 s que bastan para una imagen, un Reel
 * perfectamente válido se abandonaría a medio procesar.
 */
export const SONDEO = {
  image: { intentos: 20, esperaMs: 3000 },
  reels: { intentos: 60, esperaMs: 5000 }, // hasta 5 minutos
  // Una historia es un vídeo corto (60 s como mucho), pero pasa por el mismo
  // transcodificado que un Reel. Se le da el mismo margen: lo que no puede
  // pasar es abandonar un contenedor que iba a estar listo.
  stories: { intentos: 60, esperaMs: 5000 },
};

/* ------------------------------------------------------------------ */
/* Protección del token                                                */
/* ------------------------------------------------------------------ */

/**
 * Elimina cualquier aparición del secreto en un texto antes de imprimirlo.
 *
 * Es una red de seguridad, no la defensa principal: la defensa principal es no
 * meter nunca el token en una URL ni en un mensaje. Pero si un día la API
 * devolviera el token dentro de un error, esto impide que llegue a la consola.
 */
export function scrubSecret(text, secret) {
  const str = typeof text === 'string' ? text : String(text ?? '');
  if (typeof secret !== 'string' || secret.length < 8) return str;
  return str.split(secret).join('«TOKEN OCULTO»');
}

/** Describe un token sin revelarlo: solo longitud y prefijo de tipo. */
export function describeToken(token) {
  if (typeof token !== 'string' || token.length === 0) return 'ausente';
  return `presente (${token.length} caracteres)`;
}

/* ------------------------------------------------------------------ */
/* Cliente de lectura de la Graph API                                  */
/* ------------------------------------------------------------------ */

export class GraphError extends Error {
  constructor(message, { status, code, subcode, type, fbtraceId } = {}) {
    super(message);
    this.name = 'GraphError';
    this.status = status ?? null;
    this.code = code ?? null;
    this.subcode = subcode ?? null;
    this.type = type ?? null;
    this.fbtraceId = fbtraceId ?? null;
  }
}

/**
 * GET contra la Graph API de Instagram.
 *
 * `path` es la parte que va después de la versión, p. ej. `me` o
 * `17841466818245536/content_publishing_limit`.
 */
export async function graphGet(path, { token, fields } = {}) {
  if (!token) throw new GraphError('No hay token disponible.');

  const url = new URL(`${GRAPH_HOST}/${API_VERSION}/${path}`);
  if (fields) url.searchParams.set('fields', fields);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    throw new GraphError(`Fallo de red: ${scrubSecret(error?.message ?? 'desconocido', token)}`);
  }

  const body = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new GraphError(
      `Respuesta no JSON (HTTP ${response.status}): ${scrubSecret(body.slice(0, 300), token)}`,
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

/**
 * POST contra la Graph API de Instagram.
 *
 * El cuerpo va como JSON, que es la forma documentada por Meta para este
 * producto, y evita tener que escapar el caption (saltos de línea, tildes,
 * almohadillas). El token va en la cabecera, nunca en el cuerpo ni en la URL.
 *
 * NO reintenta. Un reintento automático sobre una escritura podría crear dos
 * contenedores o publicar dos veces; quien decide reintentar es el operador.
 */
export async function graphPost(path, { token, body } = {}) {
  if (!token) throw new GraphError('No hay token disponible.');

  const url = new URL(`${GRAPH_HOST}/${API_VERSION}/${path}`);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (error) {
    // Un fallo de red aquí es ambiguo: la petición pudo llegar o no. Se marca
    // como tal para que quien lo lea NO reintente a ciegas.
    throw new GraphError(
      `Fallo de red (estado indeterminado, NO reintentar a ciegas): ` +
        scrubSecret(error?.message ?? 'desconocido', token)
    );
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

/**
 * Identidad de la cuenta asociada al token.
 *
 * Devuelve DOS identificadores distintos y no intercambiables:
 *  - `id`      → identificador con ámbito de app (el que llega en los webhooks).
 *  - `user_id` → Instagram professional account ID. ES ESTE el que se usa en
 *                los endpoints de publicación. Confundirlos da error.
 */
export async function getAccount(token, fields = 'id,user_id,username') {
  return graphGet('me', { token, fields });
}

/**
 * Cuota de publicación de las últimas 24 horas.
 *
 * Doble función: dice cuánta cuota queda Y confirma indirectamente que el
 * permiso `instagram_business_content_publish` está concedido en el token,
 * porque este endpoint lo exige. Si el permiso faltara, aquí saldría un error
 * OAuth en vez de una cifra.
 */
export async function getPublishingLimit(igId, token) {
  return graphGet(`${igId}/content_publishing_limit`, { token, fields: 'config,quota_usage' });
}

/* ------------------------------------------------------------------ */
/* Publicación (escritura)                                             */
/* ------------------------------------------------------------------ */

/**
 * PASO 1 del flujo — crea el contenedor de medios.
 *
 * Todavía NO publica nada: el contenedor es un borrador del lado de Meta que
 * caduca solo a las 24 horas si no se publica. Devuelve `{ id }`, que es el
 * `creation_id` del paso de publicación.
 */
export async function createMediaContainer({ igId, token, imageUrl, caption, altText }) {
  const body = { image_url: imageUrl };
  if (typeof caption === 'string' && caption.length > 0) body.caption = caption;
  if (typeof altText === 'string' && altText.length > 0) body.alt_text = altText;
  return graphPost(`${igId}/media`, { token, body });
}

/**
 * PASO 1 del flujo, variante REEL — crea el contenedor de vídeo.
 *
 * Mismo endpoint `/media` que una imagen, pero con `media_type=REELS` y
 * `video_url` en lugar de `image_url`. Meta descarga el MP4 de esa URL con
 * peticiones de rango, lo transcodifica y prepara la portada; hasta que eso
 * acaba, el contenedor está IN_PROGRESS.
 *
 * `share_to_feed` deja además el Reel en la pestaña de publicaciones del perfil,
 * no solo en la de Reels. Es lo que quiere un estudio: que el trabajo quede en
 * la cuadrícula.
 *
 * `thumbOffset` es el milisegundo del que se saca la portada. Se pasa solo si se
 * indica: sin él Meta elige el fotograma, y para un travelling de 8 s su
 * elección suele ser peor que el primer fotograma.
 *
 * NO publica: el contenedor es un borrador del lado de Meta que caduca solo a
 * las 24 horas.
 */
export async function createReelContainer({
  igId,
  token,
  videoUrl,
  caption,
  coverUrl,
  thumbOffset,
  shareToFeed = true,
}) {
  const body = { media_type: 'REELS', video_url: videoUrl };
  if (typeof caption === 'string' && caption.length > 0) body.caption = caption;
  if (typeof coverUrl === 'string' && coverUrl.length > 0) body.cover_url = coverUrl;
  if (Number.isFinite(thumbOffset)) body.thumb_offset = String(thumbOffset);
  if (shareToFeed) body.share_to_feed = 'true';
  return graphPost(`${igId}/media`, { token, body });
}

/**
 * PASO 1 del flujo, variante HISTORIA — crea el contenedor de una story.
 *
 * Mismo endpoint `/media` que un Reel, con `media_type=STORIES`. Meta descarga
 * el MP4 de la URL igual que en un Reel.
 *
 * NO LLEVA CAPTION, y no es un olvido: una historia no tiene pie de texto. La
 * API acepta el parámetro y lo descarta en silencio, así que enviarlo sólo
 * serviría para creer que se publicó un texto que nadie va a ver. Por eso esta
 * función ni siquiera lo admite.
 *
 * Tampoco admite portada: la historia se ve entera desde el primer fotograma.
 *
 * NO publica: el contenedor caduca solo a las 24 horas.
 */
export async function createStoryContainer({ igId, token, videoUrl }) {
  return graphPost(`${igId}/media`, {
    token,
    body: { media_type: 'STORIES', video_url: videoUrl },
  });
}

/**
 * PASO 2 del flujo — estado del contenedor.
 *
 * `status_code` es uno de: IN_PROGRESS, FINISHED, ERROR, EXPIRED, PUBLISHED.
 * Solo FINISHED autoriza a publicar.
 */
export async function getContainerStatus(containerId, token) {
  return graphGet(containerId, { token, fields: 'status_code' });
}

/**
 * Detalle textual del error de un contenedor. Es un campo secundario: si la
 * cuenta o la versión no lo exponen, se devuelve `null` en vez de fallar.
 */
export async function getContainerErrorDetail(containerId, token) {
  try {
    const data = await graphGet(containerId, { token, fields: 'status' });
    return data?.status ?? null;
  } catch {
    return null;
  }
}

/**
 * PASO 3 del flujo — publica el contenedor. ES IRREVERSIBLE: a partir de aquí
 * la publicación es visible para los seguidores y la API no permite borrarla.
 *
 * Devuelve `{ id }`, el `media_id` definitivo.
 */
export async function publishContainer({ igId, token, creationId }) {
  return graphPost(`${igId}/media_publish`, { token, body: { creation_id: creationId } });
}

/** Campos de una publicación de feed o Reel. */
export const CAMPOS_MEDIA = 'id,permalink,timestamp,media_type,caption';

/**
 * Campos de una historia. Sin `caption`: una historia no lo tiene, y pedir un
 * campo inexistente hace fallar la lectura entera, no sólo ese campo.
 */
export const CAMPOS_MEDIA_HISTORIA = 'id,permalink,timestamp,media_type';

/** PASO 4 del flujo — datos de la publicación ya creada, incluido el permalink. */
export async function getMedia(mediaId, token, campos = CAMPOS_MEDIA) {
  return graphGet(mediaId, { token, fields: campos });
}

/* ------------------------------------------------------------------ */
/* Validación local del caption                                        */
/* ------------------------------------------------------------------ */

/**
 * Analiza un caption contra los límites de Instagram.
 *
 * Los caracteres se cuentan por puntos de código (`[...str]`), no por unidades
 * UTF-16: así una tilde o un emoji cuentan como uno, igual que en la app.
 */
export function analyzeCaption(caption) {
  const text = typeof caption === 'string' ? caption : '';
  const characters = [...text].length;
  const hashtags = text.match(/(?<![\p{L}\p{N}_])#[\p{L}\p{N}_]+/gu) ?? [];
  const mentions = text.match(/(?<![\p{L}\p{N}_.])@[\p{L}\p{N}_.]+/gu) ?? [];

  const problems = [];
  if (characters === 0) problems.push('El caption está vacío.');
  if (characters > CAPTION_RULES.maxCharacters) {
    problems.push(`${characters} caracteres supera el máximo de ${CAPTION_RULES.maxCharacters}.`);
  }
  if (hashtags.length > CAPTION_RULES.maxHashtags) {
    problems.push(`${hashtags.length} hashtags supera el máximo de ${CAPTION_RULES.maxHashtags}.`);
  }
  if (mentions.length > CAPTION_RULES.maxMentions) {
    problems.push(`${mentions.length} menciones supera el máximo de ${CAPTION_RULES.maxMentions}.`);
  }

  return { characters, hashtags, mentions, problems, ok: problems.length === 0 };
}

/* ------------------------------------------------------------------ */
/* Validación de la URL pública de la imagen                           */
/* ------------------------------------------------------------------ */

/**
 * Lee ancho y alto de un JPEG recorriendo sus marcadores.
 *
 * Se hace a mano para no añadir ninguna dependencia al proyecto. Recorre los
 * segmentos hasta encontrar un marcador SOF (0xFFC0–0xFFCF, excluidos DHT
 * 0xC4, JPGA 0xC8 y DAC 0xCC, que no son SOF), donde el alto y el ancho van en
 * los bytes 5-8 del segmento. Devuelve `null` si no lo encuentra.
 */
export function readJpegSize(bytes) {
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1; // relleno entre segmentos
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2; // marcadores sin carga útil
      continue;
    }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return {
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
      };
    }
    offset += 2 + length;
  }
  return null;
}

/**
 * Comprueba la URL de la imagen tal y como la verá Meta.
 *
 * Meta hace un cURL de esta URL desde sus servidores: tiene que responder sin
 * autenticación, con `Content-Type: image/jpeg` y con un peso dentro de límite.
 * Se pide sin credenciales y sin cabeceras especiales a propósito, para
 * reproducir lo que ve un cliente anónimo.
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
    ratio: null,
    problems: [],
  };

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    result.problems.push('La URL no es válida.');
    return result;
  }
  if (parsedUrl.protocol !== 'https:') {
    result.problems.push('La URL debe ser HTTPS.');
  }

  let response;
  try {
    // GET, no HEAD: así se mide el peso real y se detecta cualquier redirección
    // o página de desafío que devolviera HTML en lugar de la imagen.
    response = await fetch(parsedUrl, { method: 'GET', redirect: 'follow' });
  } catch (error) {
    result.problems.push(`No se pudo descargar: ${error?.message ?? 'error de red'}`);
    return result;
  }

  result.status = response.status;
  result.contentType = response.headers.get('content-type');
  const bytes = new Uint8Array(await response.arrayBuffer());
  result.bytes = bytes.byteLength;

  if (response.status !== 200) {
    result.problems.push(`Responde HTTP ${response.status}, debe ser 200.`);
  }
  if (!result.contentType || !result.contentType.startsWith(IMAGE_RULES.contentType)) {
    result.problems.push(`Content-Type «${result.contentType}», debe ser ${IMAGE_RULES.contentType}.`);
  }
  if (result.bytes > IMAGE_RULES.maxBytes) {
    result.problems.push(`Pesa ${result.bytes} bytes, el máximo es ${IMAGE_RULES.maxBytes}.`);
  }
  // Firma JPEG (SOI marker FF D8 FF): confirma que los bytes recibidos son de
  // verdad un JPEG y no un HTML servido con la cabecera equivocada.
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    result.problems.push('Los bytes descargados no empiezan por la firma JPEG.');
  }

  const size = readJpegSize(bytes);
  if (!size) {
    result.problems.push('No se han podido leer las dimensiones del JPEG descargado.');
  } else {
    result.width = size.width;
    result.height = size.height;
    result.ratio = size.width / size.height;
    if (size.width < IMAGE_RULES.minWidth || size.width > IMAGE_RULES.maxWidth) {
      result.problems.push(
        `Ancho ${size.width} px fuera del rango ${IMAGE_RULES.minWidth}–${IMAGE_RULES.maxWidth}.`
      );
    }
    if (result.ratio < IMAGE_RULES.minRatio || result.ratio > IMAGE_RULES.maxRatio) {
      result.problems.push(
        `Relación de aspecto ${result.ratio.toFixed(4)} fuera del rango ` +
          `${IMAGE_RULES.minRatio}–${IMAGE_RULES.maxRatio}.`
      );
    }
  }

  result.ok = result.problems.length === 0;
  return result;
}
