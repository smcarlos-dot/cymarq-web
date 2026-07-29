/**
 * Comprobacion de salud de las credenciales de Meta. SOLO LECTURA.
 *
 * Reutiliza los clientes ya probados de `lib/instagram/publish.mjs` y
 * `lib/facebook/publish.mjs`: no es un segundo cliente de Meta, son los mismos
 * modulos, usando unicamente sus funciones de consulta. Ninguna llamada de este
 * archivo escribe nada, ni en Meta ni en disco.
 *
 *   node scripts/social-health.mjs [--platform=instagram|facebook]
 *
 * Escribe UNA linea de JSON en stdout. Los tokens nunca se imprimen: solo su
 * longitud, que basta para distinguir "ausente" de "presente" sin revelarlos.
 *
 * SOBRE LA CADUCIDAD DE LOS TOKENS
 * --------------------------------
 * Se informa de lo que Meta dice, no de lo que dice la documentacion. Si no hay
 * forma fiable de conocer la fecha de expiracion con las credenciales actuales,
 * se devuelve `expira_en: null` y `expiracion_determinable: false`. Un token que
 * funciona hoy es un hecho comprobable; su fecha de muerte, con esta
 * configuracion, a menudo no lo es. Inventarla seria peor que no darla.
 */

import {
  getAccount, getPublishingLimit,
  GRAPH_HOST as IG_HOST, API_VERSION as IG_VER,
} from '../lib/instagram/publish.mjs';
import {
  getTokenIdentity, getPage, graphGet as fbGet,
  GRAPH_HOST as FB_HOST, API_VERSION as FB_VER,
} from '../lib/facebook/publish.mjs';
import { readSecret } from './instagram-env.mjs';
import { PAGE_ID_ESPERADO, PAGINA_ESPERADA } from './facebook-job.mjs';

const CUENTA_IG_ESPERADA = 'cymarq_obras';

function arg(nombre) {
  const p = `--${nombre}=`;
  const e = process.argv.find((a) => a.startsWith(p));
  return e ? e.slice(p.length) : undefined;
}

/** Un componente comprobado: estado normalizado + detalles sin secretos. */
function comp(estado, mensaje, extra = {}) {
  return { estado, mensaje, ...extra };
}

/* ------------------------------------------------------------------ */

async function saludInstagram() {
  const token = await readSecret('INSTAGRAM_PUBLISH_TOKEN');
  const r = {
    plataforma: 'instagram',
    host: IG_HOST,
    version: IG_VER,
    credencial: null,
    token: null,
    cuenta: null,
    permisos: null,
    cuota: null,
  };

  if (!token) {
    r.credencial = comp('ERROR', 'INSTAGRAM_PUBLISH_TOKEN ausente en .env.local');
    r.estado = 'ERROR';
    return r;
  }
  r.credencial = comp('OK', 'credencial presente', { longitud: token.length });

  let cuenta;
  try {
    cuenta = await getAccount(token, 'id,user_id,username');
  } catch (error) {
    // Un fallo aqui es de autenticacion: el token no sirve para nada mas.
    r.token = comp('ERROR', `token rechazado por Meta: ${error.message}`,
                   { codigo: error.code ?? null });
    r.estado = 'ERROR';
    return r;
  }

  r.token = comp('OK', 'token valido ahora mismo', {
    expira_en: null,
    expiracion_determinable: false,
    nota: 'graph.instagram.com no expone la expiracion de un token de '
      + 'Instagram Login. Se comprueba que funciona, no cuanto le queda.',
  });

  const usuario = cuenta.username ?? null;
  r.cuenta = usuario === CUENTA_IG_ESPERADA
    ? comp('OK', `cuenta correcta: @${usuario}`,
           { username: usuario, user_id: cuenta.user_id ?? null })
    : comp('ERROR', `el token es de @${usuario}, se esperaba @${CUENTA_IG_ESPERADA}`,
           { username: usuario, user_id: cuenta.user_id ?? null });

  // La cuota exige instagram_business_content_publish: si responde, el permiso
  // esta concedido. Es la comprobacion mas directa que existe.
  try {
    const limite = await getPublishingLimit(String(cuenta.user_id), token);
    const fila = Array.isArray(limite.data) ? limite.data[0] ?? {} : limite;
    const total = fila.config?.quota_total ?? null;
    const usadas = fila.quota_usage ?? null;
    const libre = (typeof total === 'number' && typeof usadas === 'number')
      ? total - usadas : null;

    r.permisos = comp('OK', 'instagram_business_content_publish concedido',
                      { comprobado_con: 'content_publishing_limit' });
    r.cuota = (libre !== null && libre <= 0)
      ? comp('ADVERTENCIA', 'sin cuota disponible en esta ventana de 24 h',
             { total, usadas, disponible: libre })
      : comp('OK', `cuota disponible: ${libre ?? 'no informada'}`,
             { total, usadas, disponible: libre });
  } catch (error) {
    r.permisos = comp('ERROR',
      `no se pudo leer la cuota: falta el permiso de publicacion o el token no lo lleva: ${error.message}`,
      { codigo: error.code ?? null });
    r.cuota = comp('ERROR', 'no determinable');
  }

  r.estado = peor([r.credencial, r.token, r.cuenta, r.permisos, r.cuota]);
  return r;
}

/* ------------------------------------------------------------------ */

async function saludFacebook() {
  const token = await readSecret('FACEBOOK_PAGE_ACCESS_TOKEN');
  const pageId = (await readSecret('FACEBOOK_PAGE_ID')) ?? PAGE_ID_ESPERADO;
  const r = {
    plataforma: 'facebook',
    host: FB_HOST,
    version: FB_VER,
    page_id_configurado: pageId,
    credencial: null,
    token: null,
    identidad: null,
    pagina: null,
    publicada: null,
  };

  if (!token) {
    r.credencial = comp('ERROR', 'FACEBOOK_PAGE_ACCESS_TOKEN ausente en .env.local');
    r.estado = 'ERROR';
    return r;
  }
  r.credencial = comp('OK', 'credencial presente', { longitud: token.length });

  let identidad;
  try {
    identidad = await getTokenIdentity(token);
  } catch (error) {
    // El caso que ya nos paso de verdad: el Page Access Token caducado.
    const caducado = error.code === 190;
    r.token = comp('ERROR',
      caducado ? `token caducado o invalido: ${error.message}`
               : `error de autenticacion: ${error.message}`,
      { codigo: error.code ?? null, caducado });
    r.estado = 'ERROR';
    return r;
  }

  // Se pregunta a Meta por la caducidad en vez de suponerla.
  //
  // `debug_token` exige el token como parametro `input_token`: es el unico
  // endpoint donde no hay alternativa por cabecera. Se acepta esa excepcion a
  // proposito, sobre HTTPS y solo contra Meta, porque el dato que devuelve
  // (`data_access_expires_at`) es exactamente el que ya nos dejo sin publicar
  // una vez. El valor nunca se imprime ni se registra.
  let expira = null;
  let determinable = false;
  let scopes = null;
  let notaExp = 'Meta no devolvio informacion de expiracion utilizable.';
  let estadoToken = 'OK';
  let mensajeToken = 'token valido ahora mismo';

  try {
    const d = await fbGet(`debug_token?input_token=${encodeURIComponent(token)}`, { token });
    const info = d?.data ?? {};
    scopes = Array.isArray(info.scopes) ? info.scopes : null;

    if (info.is_valid === false) {
      estadoToken = 'ERROR';
      mensajeToken = 'Meta informa que el token NO es valido';
    }

    // Dos relojes distintos, y el que importa es el segundo: el token de Pagina
    // no caduca por si mismo (expires_at=0), pero el acceso a datos si.
    const partes = [];
    if (typeof info.expires_at === 'number') {
      partes.push(info.expires_at === 0
        ? 'expires_at=0 (el token no caduca por si mismo)'
        : `expires_at=${new Date(info.expires_at * 1000).toISOString()}`);
    }
    if (typeof info.data_access_expires_at === 'number' && info.data_access_expires_at > 0) {
      expira = new Date(info.data_access_expires_at * 1000).toISOString();
      determinable = true;
      partes.push(`data_access_expires_at=${expira}`);
    } else if (typeof info.expires_at === 'number' && info.expires_at > 0) {
      expira = new Date(info.expires_at * 1000).toISOString();
      determinable = true;
    }
    if (partes.length) notaExp = `Segun Meta (debug_token): ${partes.join('; ')}.`;
    if (info.type) notaExp += ` Tipo de token: ${info.type}.`;
  } catch (error) {
    notaExp = `debug_token no utilizable con esta credencial (${error.message}). `
      + 'No se inventa ninguna fecha.';
  }

  // Avisa cuando queda poco, para que se renueve antes de una publicacion.
  let diasRestantes = null;
  if (expira) {
    diasRestantes = Math.floor((new Date(expira) - Date.now()) / 86400000);
    if (diasRestantes <= 7 && estadoToken === 'OK') {
      estadoToken = 'ADVERTENCIA';
      mensajeToken = `token valido, pero el acceso a datos caduca en ${diasRestantes} dias`;
    }
  }

  r.token = comp(estadoToken, mensajeToken, {
    expira_en: expira,
    expiracion_determinable: determinable,
    dias_restantes: diasRestantes,
    permisos_del_token: scopes,
    nota: notaExp,
  });

  r.identidad = String(identidad.id) === String(pageId)
    ? comp('OK', `el token es de la Pagina ${pageId}`,
           { id: identidad.id, nombre: identidad.name ?? null })
    : comp('ERROR',
           `/me devuelve ${identidad.id}, distinto del PAGE_ID ${pageId}: `
           + 'puede ser un token de usuario en vez de Pagina',
           { id: identidad.id, nombre: identidad.name ?? null });

  let pagina;
  try {
    pagina = await getPage(pageId, token);
  } catch (error) {
    r.pagina = comp('ERROR', `no se pudo leer la Pagina ${pageId}: ${error.message}`,
                    { codigo: error.code ?? null });
    r.publicada = comp('ERROR', 'no determinable');
    r.estado = 'ERROR';
    return r;
  }

  r.pagina = (String(pagina.id) === PAGE_ID_ESPERADO && pagina.name === PAGINA_ESPERADA)
    ? comp('OK', `Pagina correcta: ${pagina.name} (${pagina.id})`,
           { id: pagina.id, nombre: pagina.name, usuario: pagina.username ?? null,
             enlace: pagina.link ?? null })
    : comp('ERROR',
           `Pagina inesperada: ${pagina.name} (${pagina.id}), se esperaba `
           + `${PAGINA_ESPERADA} (${PAGE_ID_ESPERADO})`,
           { id: pagina.id, nombre: pagina.name });

  r.publicada = pagina.is_published === false
    ? comp('ADVERTENCIA', 'la Pagina no esta publicada: el post no seria visible')
    : comp('OK', 'la Pagina esta publicada', { is_published: pagina.is_published ?? null });

  r.estado = peor([r.credencial, r.token, r.identidad, r.pagina, r.publicada]);
  return r;
}

/* ------------------------------------------------------------------ */

const ORDEN = { OK: 0, ADVERTENCIA: 1, ERROR: 2 };

/** El estado de un conjunto es el del peor de sus componentes. */
function peor(componentes) {
  let n = 0;
  for (const c of componentes) {
    if (!c) continue;
    n = Math.max(n, ORDEN[c.estado] ?? 0);
  }
  return Object.keys(ORDEN).find((k) => ORDEN[k] === n) ?? 'OK';
}

async function main() {
  const solo = arg('platform');
  const salida = { comprobado_en: new Date().toISOString(), plataformas: {} };

  if (!solo || solo === 'instagram') {
    salida.plataformas.instagram = await saludInstagram();
  }
  if (!solo || solo === 'facebook') {
    salida.plataformas.facebook = await saludFacebook();
  }

  salida.estado = peor(Object.values(salida.plataformas).map((p) => ({ estado: p.estado })));
  process.stdout.write(`${JSON.stringify(salida)}\n`);
  process.exitCode = salida.estado === 'ERROR' ? 1 : 0;
}

main().catch((error) => {
  process.stdout.write(`${JSON.stringify({
    comprobado_en: new Date().toISOString(),
    estado: 'ERROR',
    plataformas: {},
    error: `fallo inesperado en la comprobacion: ${error?.message ?? 'desconocido'}`,
  })}\n`);
  process.exitCode = 1;
});
