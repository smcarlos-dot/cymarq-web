/**
 * Pruebas del webhook de Instagram.
 *   npm test
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeSignature,
  diagnoseSignature,
  handleInstagramWebhook,
  maskId,
  safeCompare,
  secretFingerprint,
  summarizeEvents,
} from '../lib/instagram/webhook.mjs';

const VERIFY_TOKEN = 'token-de-verificacion-de-prueba-suficientemente-largo';
const APP_SECRET = 'app-secret-de-prueba';
const APP_SECRET_ALT = 'app-secret-alternativo-de-prueba';
const ENV = { INSTAGRAM_VERIFY_TOKEN: VERIFY_TOKEN, INSTAGRAM_APP_SECRET: APP_SECRET };

const URL_BASE = 'https://www.cymarq.com.co/api/instagram/webhook';

/** Logger que captura todo lo registrado para poder auditarlo. */
function makeLogger() {
  const lines = [];
  const push = (...args) => lines.push(args.map((a) => JSON.stringify(a) ?? String(a)).join(' '));
  return { log: push, warn: push, error: push, lines };
}

function getRequest(params) {
  const url = new URL(URL_BASE);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new Request(url, { method: 'GET' });
}

async function postRequest(payload, { secret = APP_SECRET, signature } = {}) {
  const raw = JSON.stringify(payload);
  const header = signature ?? (secret ? await computeSignature(raw, secret) : undefined);
  return new Request(URL_BASE, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(header ? { 'x-hub-signature-256': header } : {}),
    },
    body: raw,
  });
}

/* ------------------------------------------------------------------ */
/* GET — handshake de verificación                                     */
/* ------------------------------------------------------------------ */

test('GET con verify_token correcto devuelve 200 y el challenge exacto', async () => {
  const res = await handleInstagramWebhook(
    getRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': '1158201444' }),
    ENV,
    makeLogger()
  );
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '1158201444');
});

test('GET con verify_token incorrecto devuelve 403 y no filtra el token', async () => {
  const logger = makeLogger();
  const res = await handleInstagramWebhook(
    getRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': 'token-equivocado', 'hub.challenge': '1158201444' }),
    ENV,
    logger
  );
  assert.equal(res.status, 403);
  const body = await res.text();
  assert.equal(body, 'Forbidden');
  assert.ok(!body.includes(VERIFY_TOKEN));
  assert.ok(!logger.lines.join('\n').includes(VERIFY_TOKEN));
});

test('GET con hub.mode distinto de subscribe devuelve 403', async () => {
  const res = await handleInstagramWebhook(
    getRequest({ 'hub.mode': 'unsubscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': '99' }),
    ENV,
    makeLogger()
  );
  assert.equal(res.status, 403);
});

test('GET sin INSTAGRAM_VERIFY_TOKEN configurado devuelve 500', async () => {
  const res = await handleInstagramWebhook(
    getRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': '99' }),
    {},
    makeLogger()
  );
  assert.equal(res.status, 500);
});

/* ------------------------------------------------------------------ */
/* POST — recepción de eventos                                         */
/* ------------------------------------------------------------------ */

// Payload real de mensajería de Instagram API with Instagram Login.
const MESSAGE_PAYLOAD = {
  object: 'instagram',
  entry: [
    {
      id: '17841466818245536',
      time: 1769000000000,
      messaging: [
        {
          sender: { id: '9876543210987654' },
          recipient: { id: '17841466818245536' },
          timestamp: 1769000000000,
          message: { mid: 'aWc6bWlkLjEyMzQ1', text: 'Hola, quiero información de un proyecto' },
        },
      ],
    },
  ],
};

test('POST con firma válida devuelve 200 EVENT_RECEIVED', async () => {
  const res = await handleInstagramWebhook(await postRequest(MESSAGE_PAYLOAD), ENV, makeLogger());
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'EVENT_RECEIVED');
});

test('POST con firma inválida devuelve 403', async () => {
  const res = await handleInstagramWebhook(
    await postRequest(MESSAGE_PAYLOAD, { secret: 'secreto-incorrecto' }),
    ENV,
    makeLogger()
  );
  assert.equal(res.status, 403);
});

test('POST sin cabecera de firma devuelve 403 cuando hay App Secret', async () => {
  const res = await handleInstagramWebhook(
    await postRequest(MESSAGE_PAYLOAD, { secret: null }),
    ENV,
    makeLogger()
  );
  assert.equal(res.status, 403);
});

test('POST con cuerpo que no es JSON devuelve 400', async () => {
  const raw = 'esto-no-es-json';
  const req = new Request(URL_BASE, {
    method: 'POST',
    headers: { 'x-hub-signature-256': await computeSignature(raw, APP_SECRET) },
    body: raw,
  });
  const res = await handleInstagramWebhook(req, ENV, makeLogger());
  assert.equal(res.status, 400);
});

test('POST con JSON válido pero sin array entry devuelve 400', async () => {
  const res = await handleInstagramWebhook(await postRequest({ object: 'instagram' }), ENV, makeLogger());
  assert.equal(res.status, 400);
});

test('los logs no contienen secretos ni el texto del mensaje', async () => {
  const logger = makeLogger();
  await handleInstagramWebhook(await postRequest(MESSAGE_PAYLOAD), ENV, logger);
  const output = logger.lines.join('\n');
  assert.ok(!output.includes(APP_SECRET), 'el App Secret apareció en los logs');
  assert.ok(!output.includes(VERIFY_TOKEN), 'el verify token apareció en los logs');
  assert.ok(!output.includes('quiero información'), 'el texto del mensaje apareció en los logs');
  assert.ok(!output.includes('9876543210987654'), 'el ID del remitente apareció sin enmascarar');
  assert.ok(output.includes('messaging.message'), 'no se registró el tipo de evento');
});

/* ------------------------------------------------------------------ */
/* Diagnóstico de la firma: dos candidatos a App Secret                */
/* ------------------------------------------------------------------ */

test('acepta la firma cuando coincide el candidato ALT y no el principal', async () => {
  const raw = JSON.stringify(MESSAGE_PAYLOAD);
  const req = new Request(URL_BASE, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': await computeSignature(raw, APP_SECRET_ALT),
    },
    body: raw,
  });
  const res = await handleInstagramWebhook(
    req,
    { ...ENV, INSTAGRAM_APP_SECRET: 'clave-equivocada', INSTAGRAM_APP_SECRET_ALT: APP_SECRET_ALT },
    makeLogger()
  );
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'EVENT_RECEIVED');
});

test('rechaza con 403 cuando NINGUNO de los dos candidatos coincide', async () => {
  const res = await handleInstagramWebhook(
    await postRequest(MESSAGE_PAYLOAD, { secret: 'un-tercer-secreto' }),
    { ...ENV, INSTAGRAM_APP_SECRET: APP_SECRET, INSTAGRAM_APP_SECRET_ALT: APP_SECRET_ALT },
    makeLogger()
  );
  assert.equal(res.status, 403);
});

test('un secreto con salto de línea al final se acepta tras trim()', async () => {
  const res = await handleInstagramWebhook(
    await postRequest(MESSAGE_PAYLOAD, { secret: APP_SECRET }),
    { ...ENV, INSTAGRAM_APP_SECRET: `${APP_SECRET}\n` },
    makeLogger()
  );
  assert.equal(res.status, 200);
});

test('diagnoseSignature informa de la longitud original y la recortada', async () => {
  const raw = JSON.stringify(MESSAGE_PAYLOAD);
  const { matched, secretos } = await diagnoseSignature(
    new TextEncoder().encode(raw),
    await computeSignature(raw, APP_SECRET),
    { INSTAGRAM_APP_SECRET: `  ${APP_SECRET}  ` }
  );
  const [principal] = secretos;
  assert.equal(principal.nombre, 'INSTAGRAM_APP_SECRET');
  assert.equal(principal.presente, true);
  assert.equal(principal.longitud, APP_SECRET.length + 4);
  assert.equal(principal.longitudTrim, APP_SECRET.length);
  assert.equal(principal.espaciosSobrantes, true);
  assert.equal(principal.coincide, false);
  assert.equal(principal.coincideTrim, true);
  assert.deepEqual(matched, { name: 'INSTAGRAM_APP_SECRET', usedTrim: true });
});

test('diagnoseSignature marca como ausentes los candidatos no configurados', async () => {
  const { matched, secretos } = await diagnoseSignature(new Uint8Array(), 'sha256=nada', {});
  assert.equal(matched, null);
  assert.equal(secretos.length, 2);
  assert.deepEqual(
    secretos.map((s) => [s.nombre, s.presente]),
    [
      ['INSTAGRAM_APP_SECRET', false],
      ['INSTAGRAM_APP_SECRET_ALT', false],
    ]
  );
});

test('el informe de diagnóstico NO contiene el valor de ningún secreto', async () => {
  const raw = JSON.stringify(MESSAGE_PAYLOAD);
  const { secretos } = await diagnoseSignature(
    new TextEncoder().encode(raw),
    await computeSignature(raw, APP_SECRET),
    { INSTAGRAM_APP_SECRET: APP_SECRET, INSTAGRAM_APP_SECRET_ALT: APP_SECRET_ALT }
  );
  const serializado = JSON.stringify(secretos);
  assert.ok(!serializado.includes(APP_SECRET), 'se filtró el App Secret principal');
  assert.ok(!serializado.includes(APP_SECRET_ALT), 'se filtró el App Secret alternativo');
});

test('la huella es estable, irreversible y de 12 hex', async () => {
  const a = await secretFingerprint(APP_SECRET);
  const b = await secretFingerprint(APP_SECRET);
  const c = await secretFingerprint(APP_SECRET_ALT);
  assert.match(a, /^[0-9a-f]{12}$/);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.ok(!APP_SECRET.includes(a));
});

test('INSTAGRAM_WEBHOOK_DEBUG activa el bloque [diag] y sin él no se emite', async () => {
  const conDebug = makeLogger();
  await handleInstagramWebhook(await postRequest(MESSAGE_PAYLOAD), { ...ENV, INSTAGRAM_WEBHOOK_DEBUG: '1' }, conDebug);
  const salida = conDebug.lines.join('\n');
  assert.ok(salida.includes('[instagram-webhook][diag]'), 'no se emitió el diagnóstico');
  assert.ok(salida.includes('rawBodyBytes'), 'falta la longitud del cuerpo en bytes');
  assert.ok(salida.includes('huella'), 'falta la huella del secreto');
  assert.ok(!salida.includes(APP_SECRET), 'el diagnóstico filtró el App Secret');
  assert.ok(!salida.includes(VERIFY_TOKEN), 'el diagnóstico filtró el verify token');
  assert.ok(!salida.includes('quiero información'), 'el diagnóstico filtró el texto del mensaje');

  const sinDebug = makeLogger();
  await handleInstagramWebhook(await postRequest(MESSAGE_PAYLOAD), ENV, sinDebug);
  assert.ok(!sinDebug.lines.join('\n').includes('[diag]'), 'se emitió el diagnóstico sin activarlo');
});

/* ------------------------------------------------------------------ */
/* Firma sobre los BYTES crudos                                        */
/* ------------------------------------------------------------------ */

test('computeSignature da el mismo resultado con cadena y con bytes', async () => {
  const raw = JSON.stringify(MESSAGE_PAYLOAD);
  const desdeCadena = await computeSignature(raw, APP_SECRET);
  const desdeBytes = await computeSignature(new TextEncoder().encode(raw), APP_SECRET);
  assert.equal(desdeCadena, desdeBytes);
});

test('valida la firma de un cuerpo con UTF-8 multibyte (tildes y emoji)', async () => {
  const payload = {
    object: 'instagram',
    entry: [
      {
        id: '17841466818245536',
        time: 1769000000000,
        messaging: [
          {
            sender: { id: '934175829696014' },
            recipient: { id: '17841466818245536' },
            timestamp: 1769000000000,
            message: { mid: 'aWc6bWlk', text: '¿Diseñáis también reformas? 🏗️🙌' },
          },
        ],
      },
    ],
  };
  const res = await handleInstagramWebhook(await postRequest(payload), ENV, makeLogger());
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'EVENT_RECEIVED');
});

/* ------------------------------------------------------------------ */
/* Otros métodos                                                       */
/* ------------------------------------------------------------------ */

test('DELETE devuelve 405', async () => {
  const res = await handleInstagramWebhook(new Request(URL_BASE, { method: 'DELETE' }), ENV, makeLogger());
  assert.equal(res.status, 405);
});

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

test('summarizeEvents identifica mensajes y comentarios', () => {
  const events = summarizeEvents({
    object: 'instagram',
    entry: [
      { id: '17841466818245536', time: 1, messaging: [{ sender: { id: 'a1b2c3d4e5' }, message: { mid: 'm1', text: 'hola' } }] },
      { id: '17841466818245536', time: 2, changes: [{ field: 'comments', value: { id: 'c1' } }] },
    ],
  });
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'messaging.message');
  assert.equal(events[0].isMessage, true);
  assert.equal(events[0].hasText, true);
  assert.equal(events[0].senderId, '***d4e5');
  assert.equal(events[1].type, 'changes.comments');
  assert.equal(events[1].isMessage, false);
});

test('summarizeEvents distingue los echo de la propia cuenta', () => {
  const [event] = summarizeEvents({
    entry: [{ id: '1', messaging: [{ message: { mid: 'm', text: 'x', is_echo: true } }] }],
  });
  assert.equal(event.type, 'messaging.echo');
  assert.equal(event.isMessage, false);
});

test('safeCompare y maskId se comportan como se espera', () => {
  assert.equal(safeCompare('abc', 'abc'), true);
  assert.equal(safeCompare('abc', 'abd'), false);
  assert.equal(safeCompare('abc', 'abcd'), false);
  assert.equal(maskId('123456789'), '***6789');
  assert.equal(maskId('12'), '***');
  assert.equal(maskId(undefined), null);
});

test('computeSignature produce el formato sha256=<hex de 64 caracteres>', async () => {
  const signature = await computeSignature('{}', APP_SECRET);
  assert.match(signature, /^sha256=[0-9a-f]{64}$/);
});
