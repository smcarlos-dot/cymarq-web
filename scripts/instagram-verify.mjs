/**
 * PASO 1 — Verificación de solo lectura de la integración de publicación.
 *
 * Ejecuta ÚNICAMENTE dos peticiones GET contra graph.instagram.com:
 *
 *   GET /v25.0/me?fields=id,user_id,username
 *   GET /v25.0/<IG_ID>/content_publishing_limit?fields=config,quota_usage
 *
 * No crea contenedores, no publica y no modifica nada en la cuenta.
 * El token no se imprime nunca.
 *
 *   npm run instagram:verify
 */

import {
  getAccount,
  getPublishingLimit,
  describeToken,
  GraphError,
  API_VERSION,
  GRAPH_HOST,
} from '../lib/instagram/publish.mjs';
import { requireSecret } from './instagram-env.mjs';

const CUENTA_ESPERADA = 'cymarq_obras';
/** Valor documentado en `.env.example`. Se contrasta con lo que diga la API. */
const IG_ID_DOCUMENTADO = '17841466818245536';

function titulo(texto) {
  console.log(`\n${texto}`);
  console.log('─'.repeat(texto.length));
}

function explicarError(error) {
  if (!(error instanceof GraphError)) {
    console.error(`  ERROR: ${error?.message ?? 'desconocido'}`);
    return;
  }
  console.error(`  ERROR de la Graph API`);
  console.error(`    mensaje : ${error.message}`);
  if (error.status !== null) console.error(`    HTTP    : ${error.status}`);
  if (error.code !== null) console.error(`    código  : ${error.code}`);
  if (error.subcode !== null) console.error(`    subcode : ${error.subcode}`);
  if (error.type) console.error(`    tipo    : ${error.type}`);
  if (error.fbtraceId) console.error(`    fbtrace : ${error.fbtraceId}`);

  // Códigos que aparecen cuando el token no lleva el permiso de publicación.
  if (error.code === 190) {
    console.error(`\n    Diagnóstico: el token no es válido o ha caducado.`);
    console.error(`    Regenera el token en Meta → Instagram → API setup.`);
  } else if (error.code === 10 || error.code === 200 || error.code === 3) {
    console.error(`\n    Diagnóstico: el token es válido pero le falta un permiso.`);
    console.error(`    Comprueba que instagram_business_content_publish estaba`);
    console.error(`    añadido ANTES de generar el token; los permisos quedan`);
    console.error(`    grabados en el token en el momento de generarlo.`);
  }
}

async function main() {
  const token = await requireSecret('INSTAGRAM_PUBLISH_TOKEN');

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  PASO 1 — VERIFICACIÓN DE SOLO LECTURA                       ║');
  console.log('║  Ninguna operación de escritura. No se publica nada.         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  console.log(`\n  Host      : ${GRAPH_HOST}`);
  console.log(`  Versión   : ${API_VERSION}`);
  console.log(`  Token     : ${describeToken(token)}  ← nunca se imprime su valor`);

  /* ---------------------------------------------------------------- */
  titulo('1/2  Identidad de la cuenta   GET /me');

  let cuenta;
  try {
    cuenta = await getAccount(token);
  } catch (error) {
    explicarError(error);
    process.exitCode = 1;
    return;
  }

  const userId = cuenta.user_id ? String(cuenta.user_id) : null;
  console.log(`  username            : @${cuenta.username ?? '(desconocido)'}`);
  console.log(`  user_id  (PUBLICAR) : ${userId ?? '(ausente)'}`);
  console.log(`  id       (webhooks) : ${cuenta.id ?? '(ausente)'}`);

  // Campos opcionales: si la cuenta o el permiso no los expone, no es un fallo.
  try {
    const extra = await getAccount(token, 'account_type,name,media_count,followers_count');
    console.log(`  tipo de cuenta      : ${extra.account_type ?? '(no informado)'}`);
    if (extra.name) console.log(`  nombre              : ${extra.name}`);
    if (extra.media_count !== undefined) console.log(`  publicaciones       : ${extra.media_count}`);
    if (extra.followers_count !== undefined) console.log(`  seguidores          : ${extra.followers_count}`);
  } catch {
    console.log(`  tipo de cuenta      : (no consultable con este token)`);
  }

  const comprobaciones = [];

  if (cuenta.username === CUENTA_ESPERADA) {
    comprobaciones.push(['OK', `El token pertenece a @${CUENTA_ESPERADA}.`]);
  } else {
    comprobaciones.push([
      'FALLO',
      `El token pertenece a @${cuenta.username}, no a @${CUENTA_ESPERADA}. DETENERSE.`,
    ]);
  }

  if (!userId) {
    comprobaciones.push(['FALLO', 'La API no ha devuelto user_id. No se puede publicar sin él.']);
  } else if (userId === IG_ID_DOCUMENTADO) {
    comprobaciones.push(['OK', `user_id coincide con el documentado (${IG_ID_DOCUMENTADO}).`]);
  } else {
    comprobaciones.push([
      'AVISO',
      `user_id real = ${userId}, pero .env.example documenta ${IG_ID_DOCUMENTADO}. ` +
        'Manda el valor real; hay que corregir la documentación.',
    ]);
  }

  if (userId && cuenta.id && userId === String(cuenta.id)) {
    comprobaciones.push(['AVISO', 'user_id e id coinciden; comprobar cuál acepta /media.']);
  }

  /* ---------------------------------------------------------------- */
  titulo('2/2  Permiso y cuota   GET /<IG_ID>/content_publishing_limit');

  if (!userId) {
    console.log('  Omitido: no hay user_id.');
    process.exitCode = 1;
  } else {
    try {
      const limite = await getPublishingLimit(userId, token);
      const fila = Array.isArray(limite.data) ? limite.data[0] ?? {} : limite;
      const config = fila.config ?? {};
      const usadas = fila.quota_usage;
      const total = config.quota_total;

      console.log(`  cuota total         : ${total ?? '(no informado)'} publicaciones`);
      console.log(`  ventana             : ${config.quota_duration ?? '(no informado)'} segundos`);
      console.log(`  consumidas          : ${usadas ?? '(no informado)'}`);
      if (typeof total === 'number' && typeof usadas === 'number') {
        console.log(`  DISPONIBLES         : ${total - usadas}`);
      }

      comprobaciones.push([
        'OK',
        'El endpoint respondió: instagram_business_content_publish SÍ está en el token.',
      ]);
      if (typeof total === 'number' && typeof usadas === 'number' && total - usadas <= 0) {
        comprobaciones.push(['FALLO', 'No queda cuota de publicación en esta ventana de 24 h.']);
      } else {
        comprobaciones.push(['OK', 'Hay cuota disponible para publicar.']);
      }
    } catch (error) {
      explicarError(error);
      comprobaciones.push([
        'FALLO',
        'No se pudo leer la cuota: el permiso de publicación NO está operativo.',
      ]);
      process.exitCode = 1;
    }
  }

  /* ---------------------------------------------------------------- */
  titulo('RESULTADO');
  for (const [estado, mensaje] of comprobaciones) {
    console.log(`  [${estado.padEnd(5)}] ${mensaje}`);
  }

  const hayFallo = comprobaciones.some(([estado]) => estado === 'FALLO');
  if (hayFallo) {
    console.log('\n  PASO 1: NO SUPERADO. No continuar con la preparación.\n');
    process.exitCode = 1;
  } else {
    console.log('\n  PASO 1: SUPERADO.\n');
  }
}

main().catch((error) => {
  // Salvaguarda final: nunca volcar el objeto de error completo, podría
  // arrastrar la petición y con ella la cabecera de autorización.
  console.error(`\n  Error inesperado: ${error?.message ?? 'desconocido'}\n`);
  process.exitCode = 1;
});
