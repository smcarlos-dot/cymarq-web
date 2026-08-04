/**
 * Webhook de Instagram — lógica de negocio.
 *
 * Producto Meta: "Instagram API with Instagram Login" (app CYMARQ Social-IG,
 * cuenta @cymarq.obras). Permisos: instagram_business_basic,
 * instagram_business_manage_comments, instagram_business_manage_messages.
 *
 * Este módulo solo usa APIs web estándar (Request, Response, WebCrypto), por lo
 * que funciona igual en Cloudflare Pages Functions (producción) y en Node 18+
 * (pruebas y servidor local). No importa nada de `node:*`.
 *
 * Reglas de seguridad aplicadas aquí:
 *  - Ningún secreto se escribe nunca en los logs ni en las respuestas HTTP.
 *  - Los identificadores de usuario se enmascaran antes de registrarse.
 *  - El contenido de los mensajes NO se registra (dato personal).
 *  - Una firma que no valida SIEMPRE produce 403.
 *
 * NOTA HISTÓRICA — no revertir: durante la puesta en marcha, el webhook
 * rechazaba con 403 todos los eventos reales de Meta. La causa NO era el App
 * Secret, sino leer el cuerpo con `request.text()`: el viaje
 * decodificar→recodificar en UTF-8 alteraba los bytes y el HMAC dejaba de
 * cuadrar. Se firma sobre `request.arrayBuffer()`. Cambiarlo rompe el webhook.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SIGNATURE_HEADER = 'x-hub-signature-256';

/* ------------------------------------------------------------------ */
/* Entorno                                                             */
/* ------------------------------------------------------------------ */

/**
 * Lee una variable de entorno.
 *
 * En Cloudflare Pages Functions los secretos llegan en `context.env`, no en
 * `process.env`. En Node local (pruebas, servidor de desarrollo) llegan en
 * `process.env`. Se consultan los dos, en ese orden.
 */
export function readEnv(env, name) {
  const fromBinding = env && typeof env === 'object' ? env[name] : undefined;
  if (typeof fromBinding === 'string' && fromBinding.length > 0) return fromBinding;

  const proc = globalThis.process;
  const fromProcess = proc && proc.env ? proc.env[name] : undefined;
  if (typeof fromProcess === 'string' && fromProcess.length > 0) return fromProcess;

  return undefined;
}

/* ------------------------------------------------------------------ */
/* Utilidades de comparación y firma                                   */
/* ------------------------------------------------------------------ */

/** Comparación de cadenas en tiempo constante (evita ataques de temporización). */
export function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

/**
 * Normaliza el cuerpo a bytes.
 *
 * Lo correcto es firmar los BYTES EXACTOS recibidos. Si se pasa por una cadena
 * (`request.text()`) se hace un viaje decodificar→recodificar en UTF-8 que, aun
 * siendo normalmente exacto, puede alterar el contenido si llegan secuencias
 * UTF-8 inválidas. Por eso el manejador usa `request.arrayBuffer()`.
 */
function toBytes(body) {
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  return encoder.encode(String(body));
}

/**
 * Calcula la firma que Meta envía en la cabecera `X-Hub-Signature-256`:
 * HMAC-SHA256 del cuerpo crudo de la petición, con el App Secret como clave.
 * Devuelve el valor completo con el prefijo `sha256=`.
 *
 * `rawBody` acepta tanto bytes (`Uint8Array`/`ArrayBuffer`) como cadena.
 */
export async function computeSignature(rawBody, appSecret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, toBytes(rawBody));
  return `sha256=${toHex(signature)}`;
}

/**
 * Verifica la cabecera `X-Hub-Signature-256` contra el cuerpo crudo.
 *
 * IMPORTANTE: hay que firmar los BYTES tal cual llegaron. Ni re-serializar el
 * JSON ni pasar por una cadena intermedia: fue exactamente eso lo que rompía la
 * validación en producción.
 *
 * El App Secret se recorta con `trim()` porque pegar un valor en un panel web
 * arrastra con frecuencia un espacio o un salto de línea invisible que
 * invalidaría el HMAC por completo. Recortar el secreto no debilita nada: una
 * firma ajena sigue sin poder validar.
 */
export async function verifySignature(rawBody, headerValue, appSecret) {
  if (!headerValue || !appSecret) return false;
  const expected = await computeSignature(rawBody, appSecret.trim());
  return safeCompare(expected, headerValue.trim());
}

/* ------------------------------------------------------------------ */
/* Registro seguro                                                     */
/* ------------------------------------------------------------------ */

/** Enmascara un identificador dejando solo los últimos 4 caracteres. */
export function maskId(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const str = String(value);
  if (str.length <= 4) return '***';
  return `***${str.slice(-4)}`;
}

/**
 * Extrae de un payload de Instagram una descripción de los eventos apta para
 * registrar: solo metadatos (tipo, identificadores enmascarados, marcas de
 * tiempo). Nunca incluye el texto del mensaje ni ningún token.
 *
 * Estructura real de los webhooks de Instagram API with Instagram Login:
 *
 *  - Mensajería  → entry[].messaging[]  con { sender, recipient, timestamp, message }
 *  - Comentarios → entry[].changes[]    con { field, value }
 *
 * El campo `object` de nivel superior vale "instagram" en esta configuración
 * (las integraciones antiguas de Instagram Basic Display usaban "user"), así
 * que el enrutado se hace por estructura y no por ese valor.
 */
export function summarizeEvents(payload) {
  const events = [];
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];

  for (const entry of entries) {
    const accountId = maskId(entry?.id);
    const entryTime = typeof entry?.time === 'number' ? entry.time : null;

    // --- Eventos de mensajería ---
    const messaging = Array.isArray(entry?.messaging) ? entry.messaging : [];
    for (const item of messaging) {
      let type = 'messaging.unknown';
      const details = {};

      if (item?.message) {
        // `is_echo` marca los mensajes enviados por la propia cuenta.
        type = item.message.is_echo ? 'messaging.echo' : 'messaging.message';
        details.messageId = item.message.mid ?? null;
        details.hasText = typeof item.message.text === 'string' && item.message.text.length > 0;
        details.attachmentCount = Array.isArray(item.message.attachments)
          ? item.message.attachments.length
          : 0;
        details.isDeleted = item.message.is_deleted === true;
        details.isUnsupported = item.message.is_unsupported === true;
      } else if (item?.reaction) {
        type = 'messaging.reaction';
        details.action = item.reaction.action ?? null;
      } else if (item?.postback) {
        type = 'messaging.postback';
      } else if (item?.read) {
        type = 'messaging.seen';
      } else if (item?.referral) {
        type = 'messaging.referral';
      } else if (item?.optin) {
        type = 'messaging.optin';
      }

      events.push({
        type,
        category: 'messaging',
        isMessage: type === 'messaging.message',
        accountId,
        senderId: maskId(item?.sender?.id),
        recipientId: maskId(item?.recipient?.id),
        timestamp: typeof item?.timestamp === 'number' ? item.timestamp : entryTime,
        ...details,
      });
    }

    // --- Eventos de campo (comentarios, menciones, etc.) ---
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      events.push({
        type: `changes.${change?.field ?? 'unknown'}`,
        category: 'changes',
        isMessage: false,
        accountId,
        timestamp: entryTime,
      });
    }
  }

  return events;
}

/* ------------------------------------------------------------------ */
/* Manejadores HTTP                                                    */
/* ------------------------------------------------------------------ */

function textResponse(body, status) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

/**
 * GET — handshake de verificación que Meta lanza al guardar la URL de
 * devolución de llamada en el panel de la app.
 */
export function handleVerification(request, env, logger = console) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const verifyToken = readEnv(env, 'INSTAGRAM_VERIFY_TOKEN');

  if (!verifyToken) {
    // No se registra ningún valor, solo el hecho de que falta la configuración.
    logger.error('[instagram-webhook] INSTAGRAM_VERIFY_TOKEN no está configurado.');
    return textResponse('Webhook not configured', 500);
  }

  if (mode === 'subscribe' && safeCompare(token ?? '', verifyToken) && challenge !== null) {
    logger.log('[instagram-webhook] Verificación correcta.');
    return textResponse(challenge, 200);
  }

  logger.warn('[instagram-webhook] Verificación rechazada.', { mode: mode ?? null });
  return textResponse('Forbidden', 403);
}

/**
 * POST — recepción de notificaciones de eventos.
 *
 * Meta reintenta la entrega si no recibe un 2xx, así que se responde 200 en
 * cuanto el evento queda validado y registrado. El procesamiento pesado (futuro)
 * debe ir en `context.waitUntil()`, nunca bloqueando esta respuesta.
 */
export async function handleEvent(request, env, logger = console) {
  const appSecret = readEnv(env, 'INSTAGRAM_APP_SECRET');
  const signature = request.headers.get(SIGNATURE_HEADER);

  // Bytes EXACTOS recibidos: la firma se calcula sobre esto, antes de decodificar
  // a texto y antes de cualquier JSON.parse.
  let rawBytes;
  try {
    rawBytes = new Uint8Array(await request.arrayBuffer());
  } catch {
    logger.error('[instagram-webhook] No se pudo leer el cuerpo de la petición.');
    return textResponse('Bad Request', 400);
  }

  // --- Validación de firma (X-Hub-Signature-256, HMAC-SHA256 con App Secret) ---
  if (appSecret) {
    const valid = await verifySignature(rawBytes, signature, appSecret);
    if (!valid) {
      logger.warn('[instagram-webhook] Firma inválida o ausente. Petición descartada.');
      return textResponse('Forbidden', 403);
    }
  } else {
    logger.warn(
      '[instagram-webhook] INSTAGRAM_APP_SECRET no configurado: la firma NO se está verificando.'
    );
  }

  // --- Validación del cuerpo ---
  const rawBody = decoder.decode(rawBytes);
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.warn('[instagram-webhook] Cuerpo no es JSON válido.');
    return textResponse('Bad Request', 400);
  }

  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.entry)) {
    logger.warn('[instagram-webhook] Payload sin array "entry".');
    return textResponse('Bad Request', 400);
  }

  // --- Registro seguro ---
  const events = summarizeEvents(payload);
  logger.log('[instagram-webhook] Evento recibido', {
    object: typeof payload.object === 'string' ? payload.object : null,
    entries: payload.entry.length,
    events: events.map((e) => e.type),
  });

  for (const event of events) {
    // Punto de extensión: aquí se enganchará el procesamiento de mensajes
    // (responder vía POST https://graph.instagram.com/v23.0/me/messages).
    logger.log('[instagram-webhook] Detalle de evento', event);
  }

  return textResponse('EVENT_RECEIVED', 200);
}

/**
 * Punto de entrada único del webhook. Devuelve siempre una Response.
 */
export async function handleInstagramWebhook(request, env, logger = console) {
  try {
    if (request.method === 'GET') return handleVerification(request, env, logger);
    if (request.method === 'POST') return await handleEvent(request, env, logger);
    return textResponse('Method Not Allowed', 405);
  } catch (error) {
    // Se registra el mensaje del error, nunca el entorno ni las cabeceras.
    logger.error('[instagram-webhook] Error inesperado:', error?.message ?? 'desconocido');
    return textResponse('Internal Server Error', 500);
  }
}
