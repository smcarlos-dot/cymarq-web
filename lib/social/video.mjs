/**
 * Video para redes sociales — inspeccion del MP4 y validacion de la URL publica.
 *
 * Este modulo es COMUN a Instagram y Facebook, y no habla con Meta: solo lee
 * bytes y decide si cumplen. Es el equivalente para video de lo que
 * `readJpegSize` + `checkPublicImage` son para las imagenes.
 *
 * SIN DEPENDENCIAS. El MP4 se recorre a mano, caja por caja (ISO/IEC 14496-12),
 * igual que el JPEG se recorre marcador por marcador en `instagram/publish.mjs`.
 * En la VM no hay ffmpeg ni se quiere anadir: una validacion que dependiera de
 * un binario externo fallaria justo donde importa.
 *
 * QUE SE COMPRUEBA Y POR QUE
 * --------------------------
 * Meta descarga el video desde una URL publica con peticiones de rango. Un
 * fallo ahi no da un error claro: da un contenedor en ERROR varios minutos
 * despues, sin explicacion util. Por eso aqui se reproduce exactamente lo que
 * hara Meta (GET anonimo, siguiendo redirecciones) y se mide el archivo real,
 * no el que se supone que hay.
 *
 * Los limites de cada plataforma estan separados a proposito: los de Facebook
 * Reels son mas estrictos en relacion de aspecto y duracion que los de
 * Instagram, y confundirlos publica en un sitio y falla en el otro.
 */

import { readFile } from 'node:fs/promises';

/* ------------------------------------------------------------------ */
/* Limites por plataforma                                              */
/* ------------------------------------------------------------------ */

/**
 * Instagram Reels. Fuente: Content Publishing / especificaciones de Reels.
 *
 * `ratio` es ancho/alto. Instagram admite un rango amplisimo (0.01–10) pero
 * solo 9:16 ocupa la pantalla completa; fuera de eso se avisa, no se aborta.
 */
export const REGLAS_INSTAGRAM_REEL = {
  plataforma: 'instagram',
  formato: 'reels',
  contentTypes: ['video/mp4', 'video/quicktime'],
  maxBytes: 1024 * 1024 * 1024,
  minDuracion: 3,
  maxDuracion: 900,
  minRatio: 0.01,
  maxRatio: 10,
  maxAncho: 1920,
  minFps: 23,
  maxFps: 60,
  ratioRecomendado: 9 / 16,
  codecsVideo: ['avc1', 'hvc1', 'hev1'],
  codecsAudio: ['mp4a'],
};

/**
 * Facebook Reels. Mas estricto que Instagram: 9:16 obligatorio, 90 s de tope y
 * un minimo real de 540x960.
 */
export const REGLAS_FACEBOOK_REEL = {
  plataforma: 'facebook',
  formato: 'reels',
  contentTypes: ['video/mp4', 'video/quicktime'],
  maxBytes: 1024 * 1024 * 1024,
  minDuracion: 3,
  maxDuracion: 90,
  minRatio: 0.5525, // 9:16 con una tolerancia estrecha
  maxRatio: 0.5725,
  minAncho: 540,
  minAlto: 960,
  maxAncho: 1920,
  minFps: 24,
  maxFps: 60,
  ratioRecomendado: 9 / 16,
  codecsVideo: ['avc1', 'hvc1', 'hev1'],
  codecsAudio: ['mp4a'],
};

/**
 * Video de feed en la Pagina (POST /<PAGE_ID>/videos). Es la via laxa: sirve
 * para material que no cumple 9:16 y por tanto no puede ser Reel.
 */
export const REGLAS_FACEBOOK_VIDEO = {
  plataforma: 'facebook',
  formato: 'video',
  contentTypes: ['video/mp4', 'video/quicktime'],
  maxBytes: 4 * 1024 * 1024 * 1024,
  minDuracion: 1,
  maxDuracion: 14400,
  minRatio: 0.01,
  maxRatio: 10,
  codecsVideo: ['avc1', 'hvc1', 'hev1'],
  codecsAudio: ['mp4a'],
};

export const REGLAS = {
  'instagram:reels': REGLAS_INSTAGRAM_REEL,
  'facebook:reels': REGLAS_FACEBOOK_REEL,
  'facebook:video': REGLAS_FACEBOOK_VIDEO,
};

/* ------------------------------------------------------------------ */
/* Recorrido de cajas MP4                                              */
/* ------------------------------------------------------------------ */

const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u16 = (b, o) => (b[o] << 8) | b[o + 1];

/** Enteros de 64 bits mediante BigInt: una duracion larga desborda un u32. */
function u64(b, o) {
  let v = 0n;
  for (let i = 0; i < 8; i += 1) v = (v << 8n) | BigInt(b[o + i]);
  return Number(v);
}

const tipo = (b, o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

/**
 * Itera las cajas contenidas entre `inicio` y `fin`.
 *
 * Devuelve `{ tipo, inicioDatos, finDatos }`. Tolera un archivo truncado: si
 * una cabecera no cabe, se detiene en vez de leer fuera del buffer.
 */
function* cajas(bytes, inicio, fin) {
  let o = inicio;
  while (o + 8 <= fin) {
    let tam = u32(bytes, o);
    const nombre = tipo(bytes, o + 4);
    let cabecera = 8;

    if (tam === 1) {
      if (o + 16 > fin) return;
      tam = u64(bytes, o + 8);
      cabecera = 16;
    } else if (tam === 0) {
      tam = fin - o; // ultima caja: se extiende hasta el final
    }

    if (tam < cabecera || o + tam > fin) {
      // Caja incoherente o cortada. Se entrega lo que hay y se para: es mejor
      // devolver datos parciales que inventarse un tamano.
      yield { tipo: nombre, inicioDatos: o + cabecera, finDatos: fin };
      return;
    }

    yield { tipo: nombre, inicioDatos: o + cabecera, finDatos: o + tam };
    o += tam;
  }
}

/** Busca una caja por tipo en un nivel concreto. */
function buscarCaja(bytes, inicio, fin, nombre) {
  for (const c of cajas(bytes, inicio, fin)) {
    if (c.tipo === nombre) return c;
  }
  return null;
}

/** Recorre una ruta de cajas anidadas, p. ej. ['mdia', 'minf', 'stbl']. */
function seguirRuta(bytes, inicio, fin, ruta) {
  let actual = { inicioDatos: inicio, finDatos: fin };
  for (const nombre of ruta) {
    const siguiente = buscarCaja(bytes, actual.inicioDatos, actual.finDatos, nombre);
    if (!siguiente) return null;
    actual = siguiente;
  }
  return actual;
}

/* ------------------------------------------------------------------ */
/* Lectura de las cajas que interesan                                  */
/* ------------------------------------------------------------------ */

/** `mvhd` → escala de tiempo y duracion global. */
function leerMvhd(bytes, c) {
  const version = bytes[c.inicioDatos];
  const base = c.inicioDatos + 4; // version (1) + flags (3)
  if (version === 1) {
    return { timescale: u32(bytes, base + 16), duration: u64(bytes, base + 20) };
  }
  return { timescale: u32(bytes, base + 8), duration: u32(bytes, base + 12) };
}

/**
 * `tkhd` → dimensiones de presentacion y matriz de transformacion.
 *
 * El ancho y el alto son coma fija 16.16, y NO son necesariamente las
 * dimensiones codificadas: la matriz puede girar el video 90 grados, que es lo
 * que hace cualquier movil. Si hay giro, se intercambian: lo que Meta mide es
 * lo que se ve, no lo que hay en el flujo.
 */
function leerTkhd(bytes, c) {
  const version = bytes[c.inicioDatos];
  let o = c.inicioDatos + 4;
  o += version === 1 ? 32 : 20; // creation, modification, track_id, reserved, duration
  o += 8; // reserved
  o += 8; // layer, alternate_group, volume, reserved

  // Matriz 3x3 en coma fija: solo hacen falta a, b, c, d para detectar el giro.
  const a = u32(bytes, o) | 0;
  const b = u32(bytes, o + 4) | 0;
  const cc = u32(bytes, o + 8) | 0;
  const d = u32(bytes, o + 12) | 0;
  o += 36;

  const ancho = u32(bytes, o) / 65536;
  const alto = u32(bytes, o + 4) / 65536;

  // Giro de 90/270 grados: la diagonal es cero y la antidiagonal no.
  const girado = a === 0 && d === 0 && (b !== 0 || cc !== 0);

  return {
    ancho: Math.round(girado ? alto : ancho),
    alto: Math.round(girado ? ancho : alto),
    girado,
  };
}

/** `hdlr` → tipo de pista: 'vide', 'soun', … */
function leerHdlr(bytes, c) {
  return tipo(bytes, c.inicioDatos + 8); // version+flags (4) + pre_defined (4)
}

/** `stsd` → formato de la primera entrada de muestra (el codec). */
function leerStsd(bytes, c) {
  // version+flags (4) + entry_count (4) + tamano de la entrada (4)
  return tipo(bytes, c.inicioDatos + 12);
}

/** `stsz` → numero de muestras, del que sale la tasa de fotogramas. */
function leerStsz(bytes, c) {
  return u32(bytes, c.inicioDatos + 8); // version+flags (4) + sample_size (4)
}

/** `mdhd` → escala de tiempo y duracion de la pista. */
function leerMdhd(bytes, c) {
  const version = bytes[c.inicioDatos];
  const base = c.inicioDatos + 4;
  if (version === 1) {
    return { timescale: u32(bytes, base + 16), duration: u64(bytes, base + 20) };
  }
  return { timescale: u32(bytes, base + 8), duration: u32(bytes, base + 12) };
}

/**
 * Extrae de un MP4 todo lo que hace falta para validarlo.
 *
 * Devuelve `null` si los bytes no son un MP4 reconocible. Si es un MP4 pero le
 * falta alguna caja, devuelve lo que haya encontrado con el resto en `null`:
 * quien valida decide si eso es suficiente.
 */
export function leerInfoMp4(bytes) {
  if (!bytes || bytes.length < 16) return null;

  const ftyp = buscarCaja(bytes, 0, bytes.length, 'ftyp');
  if (!ftyp) return null;

  const marca = tipo(bytes, ftyp.inicioDatos);
  const moov = buscarCaja(bytes, 0, bytes.length, 'moov');

  const info = {
    marca,
    duracion: null,
    ancho: null,
    alto: null,
    ratio: null,
    girado: false,
    fps: null,
    codecVideo: null,
    codecAudio: null,
    tieneAudio: false,
    moovPresente: Boolean(moov),
  };

  if (!moov) return info;

  const mvhd = buscarCaja(bytes, moov.inicioDatos, moov.finDatos, 'mvhd');
  if (mvhd) {
    const { timescale, duration } = leerMvhd(bytes, mvhd);
    if (timescale > 0) info.duracion = duration / timescale;
  }

  for (const trak of cajas(bytes, moov.inicioDatos, moov.finDatos)) {
    if (trak.tipo !== 'trak') continue;

    const hdlr = seguirRuta(bytes, trak.inicioDatos, trak.finDatos, ['mdia', 'hdlr']);
    const clase = hdlr ? leerHdlr(bytes, hdlr) : null;

    const stbl = seguirRuta(bytes, trak.inicioDatos, trak.finDatos, ['mdia', 'minf', 'stbl']);
    const stsd = stbl ? buscarCaja(bytes, stbl.inicioDatos, stbl.finDatos, 'stsd') : null;
    const codec = stsd ? leerStsd(bytes, stsd) : null;

    if (clase === 'soun') {
      info.tieneAudio = true;
      if (codec) info.codecAudio = codec;
      continue;
    }
    if (clase !== 'vide') continue;

    if (codec) info.codecVideo = codec;

    const tkhd = buscarCaja(bytes, trak.inicioDatos, trak.finDatos, 'tkhd');
    if (tkhd) {
      const medidas = leerTkhd(bytes, tkhd);
      if (medidas.ancho > 0 && medidas.alto > 0) {
        info.ancho = medidas.ancho;
        info.alto = medidas.alto;
        info.ratio = medidas.ancho / medidas.alto;
        info.girado = medidas.girado;
      }
    }

    // Fotogramas por segundo: muestras de la pista / duracion de la pista.
    const stsz = stbl ? buscarCaja(bytes, stbl.inicioDatos, stbl.finDatos, 'stsz') : null;
    const mdhd = seguirRuta(bytes, trak.inicioDatos, trak.finDatos, ['mdia', 'mdhd']);
    if (stsz && mdhd) {
      const muestras = leerStsz(bytes, stsz);
      const { timescale, duration } = leerMdhd(bytes, mdhd);
      const segundos = timescale > 0 ? duration / timescale : 0;
      if (muestras > 0 && segundos > 0) info.fps = muestras / segundos;
    }
  }

  return info;
}

/* ------------------------------------------------------------------ */
/* Validacion contra las reglas                                        */
/* ------------------------------------------------------------------ */

/**
 * Compara la informacion de un MP4 con las reglas de una plataforma.
 *
 * Separa `problemas` (abortan) de `avisos` (no abortan). El criterio: si Meta
 * lo va a rechazar, es problema; si solo afecta a como se ve, es aviso.
 */
export function validarInfo(info, reglas, bytesTotales = null) {
  const problemas = [];
  const avisos = [];

  if (!info) {
    problemas.push('Los bytes descargados no son un MP4 reconocible (falta la caja ftyp).');
    return { problemas, avisos, ok: false };
  }
  if (!info.moovPresente) {
    problemas.push('El MP4 no tiene caja moov: el archivo esta incompleto o mal generado.');
  }

  if (bytesTotales !== null && reglas.maxBytes && bytesTotales > reglas.maxBytes) {
    problemas.push(`Pesa ${bytesTotales} bytes, el maximo es ${reglas.maxBytes}.`);
  }

  if (info.duracion === null) {
    problemas.push('No se ha podido leer la duracion.');
  } else {
    if (info.duracion < reglas.minDuracion) {
      problemas.push(
        `Dura ${info.duracion.toFixed(2)} s, por debajo del minimo de ${reglas.minDuracion} s.`
      );
    }
    if (info.duracion > reglas.maxDuracion) {
      problemas.push(
        `Dura ${info.duracion.toFixed(2)} s, por encima del maximo de ${reglas.maxDuracion} s.`
      );
    }
  }

  if (info.ancho === null || info.alto === null) {
    problemas.push('No se han podido leer las dimensiones del video.');
  } else {
    if (reglas.minAncho && info.ancho < reglas.minAncho) {
      problemas.push(`Ancho ${info.ancho} px por debajo del minimo de ${reglas.minAncho}.`);
    }
    if (reglas.minAlto && info.alto < reglas.minAlto) {
      problemas.push(`Alto ${info.alto} px por debajo del minimo de ${reglas.minAlto}.`);
    }
    if (reglas.maxAncho && info.ancho > reglas.maxAncho) {
      problemas.push(`Ancho ${info.ancho} px por encima del maximo de ${reglas.maxAncho}.`);
    }
    if (info.ratio < reglas.minRatio || info.ratio > reglas.maxRatio) {
      problemas.push(
        `Relacion de aspecto ${info.ratio.toFixed(4)} fuera del rango ` +
          `${reglas.minRatio}–${reglas.maxRatio} que admite ${reglas.plataforma} en ${reglas.formato}.`
      );
    } else if (
      reglas.ratioRecomendado &&
      Math.abs(info.ratio - reglas.ratioRecomendado) > 0.02
    ) {
      avisos.push(
        `Relacion de aspecto ${info.ratio.toFixed(4)}; la recomendada es 9:16 ` +
          `(${reglas.ratioRecomendado.toFixed(4)}). Se publicara con bandas.`
      );
    }
    // 1080x1920 es lo que recomienda Meta. Por debajo se ve blando, pero se acepta.
    if (info.alto < 1920 && info.ratio >= 0.5 && info.ratio <= 0.6) {
      avisos.push(
        `Resolucion ${info.ancho}x${info.alto}, por debajo del 1080x1920 recomendado por Meta.`
      );
    }
  }

  if (info.fps !== null) {
    if (reglas.minFps && info.fps < reglas.minFps - 0.5) {
      problemas.push(`${info.fps.toFixed(2)} fps por debajo del minimo de ${reglas.minFps}.`);
    }
    if (reglas.maxFps && info.fps > reglas.maxFps + 0.5) {
      problemas.push(`${info.fps.toFixed(2)} fps por encima del maximo de ${reglas.maxFps}.`);
    }
  }

  if (info.codecVideo && !reglas.codecsVideo.includes(info.codecVideo)) {
    problemas.push(
      `Codec de video «${info.codecVideo}»; admitidos: ${reglas.codecsVideo.join(', ')}.`
    );
  }
  if (info.codecAudio && !reglas.codecsAudio.includes(info.codecAudio)) {
    problemas.push(
      `Codec de audio «${info.codecAudio}»; admitidos: ${reglas.codecsAudio.join(', ')}.`
    );
  }
  if (!info.tieneAudio) {
    avisos.push('El video no tiene pista de audio. Meta lo acepta, pero rinde peor.');
  }
  if (info.girado) {
    avisos.push('La pista lleva matriz de giro: las dimensiones son las de presentacion.');
  }

  return { problemas, avisos, ok: problemas.length === 0 };
}

/* ------------------------------------------------------------------ */
/* Comprobacion de un archivo local                                    */
/* ------------------------------------------------------------------ */

/**
 * Valida un MP4 del disco. Es el ensayo que se puede hacer ANTES de desplegar
 * nada: si el archivo no cumple, no hace falta subirlo para averiguarlo.
 */
export async function comprobarVideoLocal(ruta, reglas) {
  const resultado = {
    origen: ruta,
    ok: false,
    bytes: null,
    info: null,
    problemas: [],
    avisos: [],
  };

  let datos;
  try {
    datos = await readFile(ruta);
  } catch (error) {
    resultado.problemas.push(`No se pudo leer el archivo: ${error?.message ?? 'error'}`);
    return resultado;
  }

  const bytes = new Uint8Array(datos);
  resultado.bytes = bytes.byteLength;
  resultado.info = leerInfoMp4(bytes);

  const veredicto = validarInfo(resultado.info, reglas, resultado.bytes);
  resultado.problemas = veredicto.problemas;
  resultado.avisos = veredicto.avisos;
  resultado.ok = veredicto.ok;
  return resultado;
}

/* ------------------------------------------------------------------ */
/* Comprobacion de la URL publica                                      */
/* ------------------------------------------------------------------ */

/**
 * Comprueba la URL del video tal y como la vera Meta.
 *
 * Se pide sin credenciales y siguiendo redirecciones, a proposito: reproduce lo
 * que ve un cliente anonimo, que es lo unico que Meta va a ser.
 *
 * `Accept-Ranges` se comprueba porque el descargador de Meta usa peticiones de
 * rango. Su ausencia no siempre rompe la descarga, asi que es aviso y no
 * problema; Cloudflare Pages lo sirve siempre.
 */
export async function comprobarVideoPublico(url, reglas) {
  const resultado = {
    url,
    ok: false,
    status: null,
    contentType: null,
    aceptaRangos: null,
    bytes: null,
    info: null,
    problemas: [],
    avisos: [],
  };

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    resultado.problemas.push('La URL no es valida.');
    return resultado;
  }
  if (parsed.protocol !== 'https:') {
    resultado.problemas.push('La URL debe ser HTTPS. Meta no descarga por http://');
  }

  let respuesta;
  try {
    respuesta = await fetch(parsed, { method: 'GET', redirect: 'follow' });
  } catch (error) {
    resultado.problemas.push(`No se pudo descargar: ${error?.message ?? 'error de red'}`);
    return resultado;
  }

  resultado.status = respuesta.status;
  resultado.contentType = respuesta.headers.get('content-type');
  resultado.aceptaRangos = respuesta.headers.get('accept-ranges');

  const bytes = new Uint8Array(await respuesta.arrayBuffer());
  resultado.bytes = bytes.byteLength;

  if (respuesta.status !== 200) {
    resultado.problemas.push(`Responde HTTP ${respuesta.status}, debe ser 200.`);
  }

  const tipoMime = (resultado.contentType ?? '').split(';')[0].trim();
  if (!reglas.contentTypes.includes(tipoMime)) {
    resultado.problemas.push(
      `Content-Type «${resultado.contentType}»; admitidos: ${reglas.contentTypes.join(', ')}.`
    );
  }
  if (!resultado.aceptaRangos || resultado.aceptaRangos === 'none') {
    resultado.avisos.push(
      'La respuesta no anuncia Accept-Ranges. El descargador de Meta usa rangos.'
    );
  }

  resultado.info = leerInfoMp4(bytes);
  const veredicto = validarInfo(resultado.info, reglas, resultado.bytes);
  resultado.problemas.push(...veredicto.problemas);
  resultado.avisos.push(...veredicto.avisos);
  resultado.ok = resultado.problemas.length === 0;
  return resultado;
}

/** Resumen de una linea, para los informes de los publicadores. */
export function describirVideo(info, bytes) {
  if (!info) return 'MP4 no reconocible';
  const partes = [];
  if (info.ancho && info.alto) partes.push(`${info.ancho}x${info.alto}`);
  if (info.ratio) partes.push(`ratio ${info.ratio.toFixed(4)}`);
  if (info.duracion !== null) partes.push(`${info.duracion.toFixed(2)} s`);
  if (info.fps !== null) partes.push(`${info.fps.toFixed(1)} fps`);
  if (info.codecVideo) partes.push(info.codecVideo);
  if (info.codecAudio) partes.push(info.codecAudio);
  if (bytes) partes.push(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
  return partes.join(' · ');
}
