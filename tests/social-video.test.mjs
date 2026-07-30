/**
 * Pruebas del soporte de vídeo/Reels. No tocan la red ni Meta.
 *
 * Dos mitades:
 *
 *  1. El lector de MP4 y las reglas de cada plataforma, contra los archivos
 *     REALES de PUBLICAR/JUL_29_0001. Se comparan con los valores que da
 *     ffprobe: si el parser se desvía, aquí se ve.
 *
 *  2. Las barreras. Que `--media-type` no acepte basura, que un job de vídeo sin
 *     `--video-url` se niegue a arrancar, y —lo importante— que la barrera de
 *     entorno siga cortando `--confirm` en una máquina de desarrollo.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import {
  leerInfoMp4,
  validarInfo,
  comprobarVideoLocal,
  describirVideo,
  REGLAS_INSTAGRAM_REEL,
  REGLAS_FACEBOOK_REEL,
  REGLAS_FACEBOOK_VIDEO,
} from '../lib/social/video.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO_WEB = resolve(AQUI, '..');
// Los MP4 de origen viven fuera del repositorio web, en la carpeta PUBLICAR del
// proyecto. Si no están, las pruebas que los usan se saltan en vez de fallar.
const CARPETA_VIDEOS = resolve(AQUI, '..', '..', 'PUBLICAR', 'JUL_29_0001');

const COCINA = join(CARPETA_VIDEOS, 'Render Cocina.mp4');
const PISCINA = join(CARPETA_VIDEOS, 'Render Piscina.mp4');

const hayVideos = existsSync(COCINA) && existsSync(PISCINA);

/* ------------------------------------------------------------------ */
/* 1. Lector de MP4                                                    */
/* ------------------------------------------------------------------ */

test('lee las medidas reales de los dos MP4 (contrastado con ffprobe)', { skip: !hayVideos }, async () => {
  for (const ruta of [COCINA, PISCINA]) {
    const r = await comprobarVideoLocal(ruta, REGLAS_INSTAGRAM_REEL);
    assert.ok(r.info, `no se pudo leer ${ruta}`);
    assert.equal(r.info.ancho, 720);
    assert.equal(r.info.alto, 1280);
    assert.equal(r.info.duracion, 8);
    assert.equal(Math.round(r.info.fps), 24);
    assert.equal(r.info.codecVideo, 'avc1');
    assert.equal(r.info.codecAudio, 'mp4a');
    assert.equal(r.info.tieneAudio, true);
    assert.equal(r.info.girado, false);
    assert.equal(r.info.moovPresente, true);
    // 9:16 exacto
    assert.ok(Math.abs(r.info.ratio - 9 / 16) < 1e-6);
  }
});

test('los dos MP4 cumplen las tres configuraciones de publicación', { skip: !hayVideos }, async () => {
  for (const ruta of [COCINA, PISCINA]) {
    for (const reglas of [REGLAS_INSTAGRAM_REEL, REGLAS_FACEBOOK_REEL, REGLAS_FACEBOOK_VIDEO]) {
      const r = await comprobarVideoLocal(ruta, reglas);
      assert.equal(r.ok, true, `${ruta} incumple ${reglas.plataforma}:${reglas.formato}: ${r.problemas.join(' | ')}`);
    }
  }
});

test('avisa de que 720x1280 está por debajo del 1080x1920 recomendado', { skip: !hayVideos }, async () => {
  const r = await comprobarVideoLocal(COCINA, REGLAS_INSTAGRAM_REEL);
  assert.ok(r.avisos.some((a) => a.includes('1080x1920')));
});

test('unos bytes que no son MP4 devuelven null', () => {
  assert.equal(leerInfoMp4(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])), null);
  assert.equal(leerInfoMp4(new Uint8Array(4)), null);
  assert.equal(leerInfoMp4(null), null);
});

test('describirVideo resume sin reventar con datos incompletos', () => {
  assert.equal(describirVideo(null), 'MP4 no reconocible');
  const texto = describirVideo(
    { ancho: 720, alto: 1280, ratio: 0.5625, duracion: 8, fps: 24, codecVideo: 'avc1', codecAudio: null },
    3194549
  );
  assert.ok(texto.includes('720x1280'));
  assert.ok(texto.includes('8.00 s'));
});

/* ------------------------------------------------------------------ */
/* 2. Reglas por plataforma                                            */
/* ------------------------------------------------------------------ */

/** Vídeo sintético que cumple todo, para ir estropeando un campo cada vez. */
const CONFORME = {
  marca: 'isom',
  duracion: 8,
  ancho: 1080,
  alto: 1920,
  ratio: 1080 / 1920,
  girado: false,
  fps: 30,
  codecVideo: 'avc1',
  codecAudio: 'mp4a',
  tieneAudio: true,
  moovPresente: true,
};

test('el vídeo sintético de referencia cumple en las tres configuraciones', () => {
  for (const reglas of [REGLAS_INSTAGRAM_REEL, REGLAS_FACEBOOK_REEL, REGLAS_FACEBOOK_VIDEO]) {
    const v = validarInfo(CONFORME, reglas, 5_000_000);
    assert.equal(v.ok, true, `${reglas.plataforma}:${reglas.formato} → ${v.problemas.join(' | ')}`);
  }
});

test('rechaza un vídeo más corto que el mínimo', () => {
  const v = validarInfo({ ...CONFORME, duracion: 2 }, REGLAS_INSTAGRAM_REEL, 1000);
  assert.equal(v.ok, false);
  assert.ok(v.problemas.some((p) => p.includes('minimo')));
});

test('Facebook Reels rechaza más de 90 s; Instagram lo acepta', () => {
  const largo = { ...CONFORME, duracion: 120 };
  assert.equal(validarInfo(largo, REGLAS_FACEBOOK_REEL, 1000).ok, false);
  assert.equal(validarInfo(largo, REGLAS_INSTAGRAM_REEL, 1000).ok, true);
});

test('Facebook Reels exige 9:16; Instagram admite 1:1 con aviso', () => {
  const cuadrado = { ...CONFORME, ancho: 1080, alto: 1080, ratio: 1 };
  const fb = validarInfo(cuadrado, REGLAS_FACEBOOK_REEL, 1000);
  assert.equal(fb.ok, false);
  assert.ok(fb.problemas.some((p) => p.includes('aspecto')));

  const ig = validarInfo(cuadrado, REGLAS_INSTAGRAM_REEL, 1000);
  assert.equal(ig.ok, true);
  assert.ok(ig.avisos.some((a) => a.includes('9:16')));
});

test('Facebook Reels rechaza por debajo de 540x960', () => {
  const pequeno = { ...CONFORME, ancho: 360, alto: 640, ratio: 0.5625 };
  const v = validarInfo(pequeno, REGLAS_FACEBOOK_REEL, 1000);
  assert.equal(v.ok, false);
  assert.ok(v.problemas.some((p) => p.includes('minimo')));
});

test('rechaza un codec de vídeo que Meta no admite', () => {
  const v = validarInfo({ ...CONFORME, codecVideo: 'vp09' }, REGLAS_INSTAGRAM_REEL, 1000);
  assert.equal(v.ok, false);
  assert.ok(v.problemas.some((p) => p.includes('vp09')));
});

test('rechaza un archivo sin moov y uno que pesa demasiado', () => {
  assert.equal(validarInfo({ ...CONFORME, moovPresente: false }, REGLAS_INSTAGRAM_REEL, 1000).ok, false);
  const enorme = validarInfo(CONFORME, REGLAS_FACEBOOK_REEL, 2 * 1024 * 1024 * 1024);
  assert.equal(enorme.ok, false);
  assert.ok(enorme.problemas.some((p) => p.includes('maximo')));
});

test('un vídeo sin audio se avisa pero no se rechaza', () => {
  const v = validarInfo({ ...CONFORME, tieneAudio: false, codecAudio: null }, REGLAS_INSTAGRAM_REEL, 1000);
  assert.equal(v.ok, true);
  assert.ok(v.avisos.some((a) => a.includes('audio')));
});

test('rechaza fuera del rango de fotogramas por segundo', () => {
  assert.equal(validarInfo({ ...CONFORME, fps: 12 }, REGLAS_INSTAGRAM_REEL, 1000).ok, false);
  assert.equal(validarInfo({ ...CONFORME, fps: 120 }, REGLAS_INSTAGRAM_REEL, 1000).ok, false);
});

/* ------------------------------------------------------------------ */
/* 3. Barreras de los publicadores                                     */
/* ------------------------------------------------------------------ */

/** Lanza un publicador y devuelve su salida combinada. Nunca con --confirm. */
function ejecutar(script, argumentos) {
  const r = spawnSync(process.execPath, [join(REPO_WEB, script), ...argumentos], {
    cwd: REPO_WEB,
    encoding: 'utf8',
    timeout: 60_000,
  });
  return { code: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

const METADATA_FALSA = join(AQUI, 'no-existe-metadata.json');

for (const script of ['scripts/instagram-publish.mjs', 'scripts/facebook-publish.mjs']) {
  test(`${script}: rechaza un --media-type desconocido`, () => {
    const r = ejecutar(script, [
      '--job=TEST-0001',
      `--metadata=${METADATA_FALSA}`,
      '--media-type=carrusel',
      '--video-url=https://example.com/v.mp4',
    ]);
    assert.equal(r.code, 1);
    assert.ok(r.salida.includes('--media-type'));
  });

  test(`${script}: un job de vídeo sin --video-url no arranca`, () => {
    const r = ejecutar(script, [
      '--job=TEST-0001',
      `--metadata=${METADATA_FALSA}`,
      '--media-type=reels',
    ]);
    assert.equal(r.code, 1);
    assert.ok(r.salida.includes('--video-url'));
  });

  test(`${script}: exige que la URL del vídeo sea HTTPS`, () => {
    const r = ejecutar(script, [
      '--job=TEST-0001',
      `--metadata=${METADATA_FALSA}`,
      '--media-type=reels',
      '--video-url=http://example.com/v.mp4',
    ]);
    assert.equal(r.code, 1);
    assert.ok(r.salida.includes('HTTPS'));
  });

  // La prueba que más importa: --confirm sigue bloqueado por la barrera de
  // entorno, y se corta ANTES de leer credenciales o tocar la red.
  test(`${script}: --confirm sigue bloqueado en máquina de desarrollo`, () => {
    const r = ejecutar(script, [
      '--job=TEST-0001',
      `--metadata=${METADATA_FALSA}`,
      '--media-type=reels',
      '--video-url=https://example.com/v.mp4',
      '--confirm',
    ]);
    assert.equal(r.code, 1);
    assert.ok(
      r.salida.includes('BLOQUEADO POR ENTORNO'),
      `se esperaba el bloqueo de entorno, se obtuvo: ${r.salida.slice(0, 400)}`
    );
    assert.ok(r.salida.includes('No se ha enviado nada a Meta'));
  });
}

test('instagram: --media-type=video se rechaza porque en IG el vídeo es Reel', () => {
  const r = ejecutar('scripts/instagram-publish.mjs', [
    '--job=TEST-0001',
    `--metadata=${METADATA_FALSA}`,
    '--media-type=video',
    '--video-url=https://example.com/v.mp4',
  ]);
  assert.equal(r.code, 1);
  assert.ok(r.salida.includes('--media-type=reels'));
});

test('el envoltorio rechaza un job de vídeo sin --video-url y no ejecuta nada', () => {
  const r = ejecutar('scripts/social-publish.mjs', [
    '--platform=instagram',
    '--job=TEST-0001',
    `--metadata=${METADATA_FALSA}`,
    '--media-type=reels',
  ]);
  assert.equal(r.code, 1);
  const contrato = JSON.parse(r.salida.trim().split('\n').find((l) => l.startsWith('{')));
  assert.equal(contrato.ok, false);
  assert.equal(contrato.status, 'failed');
  assert.equal(contrato.retry_safe, true);
  assert.ok(contrato.message.includes('--video-url'));
});

test('el envoltorio rechaza un --media-type desconocido', () => {
  const r = ejecutar('scripts/social-publish.mjs', [
    '--platform=facebook',
    '--job=TEST-0001',
    `--metadata=${METADATA_FALSA}`,
    '--media-type=historia',
    '--video-url=https://example.com/v.mp4',
  ]);
  assert.equal(r.code, 1);
  const contrato = JSON.parse(r.salida.trim().split('\n').find((l) => l.startsWith('{')));
  assert.equal(contrato.status, 'failed');
  assert.ok(contrato.message.includes('media-type'));
});

/* ------------------------------------------------------------------ */
/* 4. El camino de las imágenes no ha cambiado                         */
/* ------------------------------------------------------------------ */

test('sin --media-type sigue exigiendo --image-url, como antes del vídeo', () => {
  for (const script of ['scripts/instagram-publish.mjs', 'scripts/facebook-publish.mjs']) {
    const r = ejecutar(script, ['--job=TEST-0001', `--metadata=${METADATA_FALSA}`]);
    assert.equal(r.code, 1);
    assert.ok(r.salida.includes('--image-url'), `${script}: ${r.salida.slice(0, 200)}`);
  }
});

test('el ensayo de vídeo cumple con los MP4 reales y sale con 0', { skip: !hayVideos }, () => {
  const r = ejecutar('scripts/social-video-dry-run.mjs', [`--file=${COCINA}`]);
  assert.equal(r.code, 0);
  assert.ok(r.salida.includes('Todo lo evaluado cumple'));
  assert.ok(r.salida.includes('Meta no ha sido llamado'));
});
