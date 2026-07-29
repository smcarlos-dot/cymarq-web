/**
 * Envoltorio de maquina para los publicadores de Instagram y Facebook.
 *
 * Existe para que el orquestador (CYMARQ_SOCIAL, en Python) tenga un contrato
 * explicito en vez de leer frases pensadas para una persona.
 *
 * NO REIMPLEMENTA NADA. Lanza el publicador real tal cual, sin tocarlo, y
 * despues deduce el resultado del DIARIO en disco, que es la fuente de verdad
 * que esos scripts ya mantienen. Los publicadores siguen siendo byte a byte los
 * que se probaron con publicaciones reales.
 *
 *   node scripts/social-publish.mjs --platform=instagram --job=... \
 *        --metadata=... --image-url=... [--confirm]
 *
 * Escribe UNA linea de JSON en stdout. La salida humana del publicador va a
 * stderr, para que no se mezcle con el contrato.
 *
 * CONTRATO
 * --------
 *   ok                 true solo si la plataforma quedo publicada.
 *   platform           "instagram" | "facebook"
 *   job_id             identificador de la propuesta
 *   status             published | already_published | failed
 *                      | verification_required | not_attempted
 *   retry_safe         ¿es seguro volver a intentarlo automaticamente?
 *   media_id/post_id   identificadores devueltos por Meta
 *   permalink          enlace publico
 *   published_at       cuando quedo publicada
 *   exit_code          codigo de salida del publicador
 *   message            texto informativo. NUNCA se usa para decidir.
 *
 * COMO SE DEDUCE `status`, y por que asi
 * --------------------------------------
 * El diario guarda `publish_attempted` ANTES de llamar a Meta, y el id DESPUES
 * de recibir respuesta. Esa pareja distingue los tres casos que importan:
 *
 *   hay id                        -> published (o already_published si ya
 *                                    estaba antes de esta ejecucion)
 *   publish_attempted y sin id    -> verification_required. La peticion salio;
 *                                    no se sabe si Meta la creo. NO se reintenta.
 *   ni intento ni id, con error   -> failed y retry_safe: se fallo ANTES de
 *                                    enviar nada, asi que reintentar no duplica.
 *
 * Nada de esto depende de interpretar mensajes de error.
 */

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

const PUBLICADORES = {
  instagram: { script: 'scripts/instagram-publish.mjs', diario: '.instagram-publish-state.json' },
  facebook: { script: 'scripts/facebook-publish.mjs', diario: '.facebook-publish-state.json' },
};

function arg(nombre) {
  const p = `--${nombre}=`;
  const encontrado = process.argv.find((a) => a.startsWith(p));
  return encontrado ? encontrado.slice(p.length) : undefined;
}

function emitir(resultado) {
  process.stdout.write(`${JSON.stringify(resultado)}\n`);
  process.exitCode = resultado.ok ? 0 : 1;
}

async function leerEntrada(diario, jobId) {
  try {
    const datos = JSON.parse(await readFile(join(REPO, diario), 'utf8'));
    return datos[jobId] ?? null;
  } catch {
    return null;
  }
}

function ejecutar(script, argumentos) {
  return new Promise((resolve) => {
    const hijo = spawn(process.execPath, [join(REPO, script), ...argumentos], {
      cwd: REPO,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let salida = '';
    let errores = '';
    // La salida humana del publicador se reenvia a stderr: informativa, nunca
    // parte del contrato.
    hijo.stdout.on('data', (d) => { salida += d; process.stderr.write(d); });
    hijo.stderr.on('data', (d) => { errores += d; process.stderr.write(d); });
    hijo.on('error', (e) => resolve({ code: null, salida, errores: `${errores}\n${e.message}` }));
    hijo.on('close', (code) => resolve({ code, salida, errores }));
  });
}

async function main() {
  const platform = arg('platform');
  const jobId = arg('job');
  const metadata = arg('metadata');
  const imageUrl = arg('image-url');
  const confirmar = process.argv.includes('--confirm');

  const base = { ok: false, platform: platform ?? null, job_id: jobId ?? null };

  if (!platform || !PUBLICADORES[platform]) {
    emitir({ ...base, status: 'failed', retry_safe: true,
             message: `--platform debe ser instagram o facebook, no "${platform}"` });
    return;
  }
  if (!jobId || !metadata || !imageUrl) {
    emitir({ ...base, status: 'failed', retry_safe: true,
             message: 'faltan --job, --metadata o --image-url' });
    return;
  }

  const { script, diario } = PUBLICADORES[platform];
  const idCampo = platform === 'instagram' ? 'media_id' : 'post_id';

  // Estado ANTES de ejecutar: distingue "ya estaba publicada" de "la acabamos
  // de publicar", y detecta un intento anterior sin confirmar.
  const antes = await leerEntrada(diario, jobId);

  if (antes && antes[idCampo]) {
    emitir({
      ...base, ok: true, status: 'already_published', retry_safe: false,
      [idCampo]: String(antes[idCampo]),
      permalink: antes.permalink ?? null,
      published_at: antes.publicado_en ?? null,
      exit_code: 0,
      message: 'Ya constaba publicada en el diario. No se ha invocado al publicador.',
    });
    return;
  }

  if (antes && antes.publish_attempted) {
    emitir({
      ...base, status: 'verification_required', retry_safe: false,
      exit_code: 0,
      message: 'Existe un intento anterior sin resultado confirmado. '
        + 'Hay que comprobar a mano si la publicacion existe antes de reintentar.',
    });
    return;
  }

  const argumentos = [`--job=${jobId}`, `--metadata=${metadata}`, `--image-url=${imageUrl}`];
  const varianteCaption = arg('caption');
  if (varianteCaption) argumentos.push(`--caption=${varianteCaption}`);
  if (confirmar) argumentos.push('--confirm');

  const { code, errores } = await ejecutar(script, argumentos);
  const despues = await leerEntrada(diario, jobId);

  const resumenError = (errores || '').trim().split('\n').slice(-4).join(' | ').slice(0, 400);

  if (despues && despues[idCampo]) {
    emitir({
      ...base, ok: true, status: 'published', retry_safe: false,
      [idCampo]: String(despues[idCampo]),
      photo_id: despues.photo_id ?? undefined,
      container_id: despues.container_id ?? undefined,
      permalink: despues.permalink ?? null,
      published_at: despues.publicado_en ?? null,
      exit_code: code,
      message: 'Publicada.',
    });
    return;
  }

  if (despues && despues.publish_attempted) {
    // Se llamo a Meta y no hay identificador: estado indeterminado.
    emitir({
      ...base, status: 'verification_required', retry_safe: false,
      container_id: despues.container_id ?? undefined,
      exit_code: code,
      message: 'La peticion de publicacion salio y no se registro resultado. '
        + `NO reintentar automaticamente. ${resumenError}`,
    });
    return;
  }

  if (code === 0) {
    // Termino bien sin escribir: es el caso del ensayo sin --confirm.
    emitir({
      ...base, status: 'not_attempted', retry_safe: true, exit_code: code,
      message: confirmar
        ? 'El publicador termino sin publicar y sin registrar intento.'
        : 'Ensayo sin --confirm: no se ha publicado nada.',
    });
    return;
  }

  // Fallo antes de enviar nada a Meta: reintentar no puede duplicar.
  emitir({
    ...base, status: 'failed', retry_safe: true, exit_code: code,
    message: `Fallo antes de publicar. ${resumenError}`,
  });
}

main().catch((error) => {
  emitir({
    ok: false, platform: arg('platform') ?? null, job_id: arg('job') ?? null,
    status: 'verification_required', retry_safe: false,
    message: `Error inesperado en el envoltorio: ${error?.message ?? 'desconocido'}. `
      + 'Se marca para verificacion en vez de suponer que no paso nada.',
  });
});
