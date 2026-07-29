/**
 * Verificación de solo lectura de la integración con la Página de Facebook.
 *
 * Solo peticiones GET contra graph.facebook.com:
 *
 *   GET /v25.0/me?fields=id,name          → a quién pertenece el token
 *   GET /v25.0/<PAGE_ID>?fields=...       → datos de la Página
 *
 * No publica nada. El token no se imprime nunca.
 *
 *   npm run facebook:verify
 */

import {
  getTokenIdentity,
  getPage,
  describeToken,
  GraphError,
  GRAPH_HOST,
  API_VERSION,
} from '../lib/facebook/publish.mjs';
import { requirePageToken, readPageId, PAGE_ID_ESPERADO, PAGINA_ESPERADA } from './facebook-job.mjs';

function titulo(texto) {
  console.log(`\n${texto}`);
  console.log('─'.repeat(texto.length));
}

function mostrarError(error) {
  console.error(`  ${error?.message ?? 'error desconocido'}`);
  if (error instanceof GraphError) {
    if (error.status !== null) console.error(`    HTTP    : ${error.status}`);
    if (error.code !== null) console.error(`    código  : ${error.code}`);
    if (error.subcode !== null) console.error(`    subcode : ${error.subcode}`);
    if (error.fbtraceId) console.error(`    fbtrace : ${error.fbtraceId}`);
    if (error.code === 190) {
      console.error('\n    Diagnóstico: el Page Access Token no es válido o ha caducado.');
    }
  }
}

async function main() {
  const token = await requirePageToken();
  const pageId = await readPageId();
  const comprobaciones = [];

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  FACEBOOK — VERIFICACIÓN DE SOLO LECTURA                     ║');
  console.log('║  Ninguna escritura. No se publica nada.                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  console.log(`\n  Host      : ${GRAPH_HOST}`);
  console.log(`  Versión   : ${API_VERSION}`);
  console.log(`  PAGE_ID   : ${pageId}`);
  console.log(`  Token     : ${describeToken(token)}  ← nunca se imprime su valor`);

  /* ---------------------------------------------------------------- */
  titulo('1/2  Identidad del token   GET /me');

  let identidad;
  try {
    identidad = await getTokenIdentity(token);
  } catch (error) {
    mostrarError(error);
    process.exitCode = 1;
    return;
  }

  console.log(`  id     : ${identidad.id ?? '(ausente)'}`);
  console.log(`  nombre : ${identidad.name ?? '(ausente)'}`);

  if (String(identidad.id) === String(pageId)) {
    comprobaciones.push(['OK', 'El token es un Page Access Token de la Página indicada.']);
  } else {
    comprobaciones.push([
      'FALLO',
      `/me devuelve id ${identidad.id}, distinto del PAGE_ID ${pageId}. ` +
        'Puede ser un token de usuario en vez de un token de Página.',
    ]);
  }

  /* ---------------------------------------------------------------- */
  titulo('2/2  Datos de la Página   GET /<PAGE_ID>');

  let pagina;
  try {
    pagina = await getPage(pageId, token);
  } catch (error) {
    mostrarError(error);
    comprobaciones.push(['FALLO', 'No se pudo leer la Página con este token.']);
    process.exitCode = 1;
  }

  if (pagina) {
    console.log(`  id           : ${pagina.id ?? '(ausente)'}`);
    console.log(`  nombre       : ${pagina.name ?? '(ausente)'}`);
    console.log(`  usuario      : ${pagina.username ? `@${pagina.username}` : '(sin alias)'}`);
    console.log(`  categoría    : ${pagina.category ?? '(no informada)'}`);
    console.log(`  enlace       : ${pagina.link ?? '(no informado)'}`);
    console.log(`  publicada    : ${pagina.is_published === undefined ? '(no informado)' : pagina.is_published}`);

    comprobaciones.push(
      String(pagina.id) === PAGE_ID_ESPERADO
        ? ['OK', `PAGE_ID coincide con el verificado (${PAGE_ID_ESPERADO}).`]
        : ['FALLO', `PAGE_ID devuelto ${pagina.id}, se esperaba ${PAGE_ID_ESPERADO}.`]
    );
    comprobaciones.push(
      pagina.name === PAGINA_ESPERADA
        ? ['OK', `La Página es «${PAGINA_ESPERADA}».`]
        : ['AVISO', `La Página se llama «${pagina.name}», se esperaba «${PAGINA_ESPERADA}».`]
    );
    if (pagina.is_published === false) {
      comprobaciones.push(['AVISO', 'La Página no está publicada: el post no sería visible al público.']);
    }
  }

  /* ---------------------------------------------------------------- */
  titulo('RESULTADO');
  for (const [estado, mensaje] of comprobaciones) console.log(`  [${estado.padEnd(5)}] ${mensaje}`);

  if (comprobaciones.some(([e]) => e === 'FALLO')) {
    console.log('\n  VERIFICACIÓN: NO SUPERADA.\n');
    process.exitCode = 1;
  } else {
    console.log('\n  VERIFICACIÓN: SUPERADA.\n');
  }
}

main().catch((error) => {
  console.error(`\n  Error inesperado: ${error?.message ?? 'desconocido'}\n`);
  process.exitCode = 1;
});
