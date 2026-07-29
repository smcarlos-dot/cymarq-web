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
