/**
 * Ensayo de vídeo. NO publica, NO escribe y NO habla con Meta.
 *
 * Responde a una sola pregunta: ¿este MP4 lo aceptarían Instagram Reels y
 * Facebook Reels? Se puede contestar antes de desplegar nada, que es el punto:
 * si el archivo no cumple, no hace falta subirlo a producción para descubrirlo.
 *
 *   node scripts/social-video-dry-run.mjs --file="C:\ruta\video.mp4"
 *   node scripts/social-video-dry-run.mjs --url=https://www.cymarq.com.co/social/video/x.mp4
 *
 * Con `--file` se lee del disco: sirve en el PC, sin red y sin despliegue.
 * Con `--url` se descarga igual que hará Meta, comprobando además el HTTP, el
 * Content-Type y el soporte de rangos. Ese es el ensayo que de verdad demuestra
 * que la publicación va a funcionar.
 *
 * Se puede pasar `--platform=instagram|facebook` para ver solo una. Sin ella se
 * evalúan las tres configuraciones (IG Reel, FB Reel y FB vídeo de feed).
 *
 * Código de salida: 0 si todo lo evaluado cumple; 1 si algo no cumple. Así el
 * ensayo sirve tanto para leerlo como para encadenarlo.
 */

import {
  comprobarVideoLocal,
  comprobarVideoPublico,
  describirVideo,
  REGLAS_INSTAGRAM_REEL,
  REGLAS_FACEBOOK_REEL,
  REGLAS_FACEBOOK_VIDEO,
} from '../lib/social/video.mjs';

function arg(nombre) {
  const p = `--${nombre}=`;
  const encontrado = process.argv.find((a) => a.startsWith(p));
  return encontrado ? encontrado.slice(p.length) : undefined;
}

const bloque = (t) => {
  console.log(`\n${t}`);
  console.log('═'.repeat(62));
};

const CONFIGURACIONES = [
  { clave: 'instagram', etiqueta: 'INSTAGRAM — Reel', reglas: REGLAS_INSTAGRAM_REEL },
  { clave: 'facebook', etiqueta: 'FACEBOOK — Reel', reglas: REGLAS_FACEBOOK_REEL },
  { clave: 'facebook', etiqueta: 'FACEBOOK — vídeo de feed', reglas: REGLAS_FACEBOOK_VIDEO },
];

async function main() {
  const archivo = arg('file');
  const url = arg('url');
  const plataforma = arg('platform');

  if (!archivo && !url) {
    console.error('\n  Hace falta --file=<ruta> o --url=<url>.\n');
    console.error('  Uso:');
    console.error('      node scripts/social-video-dry-run.mjs --file="C:\\ruta\\video.mp4"');
    console.error('      node scripts/social-video-dry-run.mjs --url=https://…/video.mp4\n');
    process.exit(1);
  }
  if (archivo && url) {
    console.error('\n  --file y --url son excluyentes: elige uno.\n');
    process.exit(1);
  }
  if (plataforma && !['instagram', 'facebook'].includes(plataforma)) {
    console.error(`\n  --platform debe ser instagram o facebook, no "${plataforma}".\n`);
    process.exit(1);
  }

  const configuraciones = plataforma
    ? CONFIGURACIONES.filter((c) => c.clave === plataforma)
    : CONFIGURACIONES;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ENSAYO DE VÍDEO — no publica, no escribe, no llama a Meta    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  bloque('ORIGEN');
  console.log(`  ${archivo ? 'archivo local' : 'URL pública  '} : ${archivo ?? url}`);

  // El primer resultado sirve además para imprimir el análisis del archivo: las
  // medidas no dependen de las reglas, solo el veredicto.
  let cabecera = null;
  let todoOk = true;

  for (const conf of configuraciones) {
    const r = archivo
      ? await comprobarVideoLocal(archivo, conf.reglas)
      : await comprobarVideoPublico(url, conf.reglas);

    if (!cabecera) {
      cabecera = r;
      bloque('ARCHIVO');
      if (r.status !== undefined && r.status !== null) {
        console.log(`  HTTP          : ${r.status}`);
        console.log(`  Content-Type  : ${r.contentType ?? '(ninguno)'}`);
        console.log(`  Accept-Ranges : ${r.aceptaRangos ?? '(no anunciado)'}`);
      }
      console.log(`  medidas       : ${describirVideo(r.info, r.bytes)}`);
      if (r.info) {
        console.log(`  marca ftyp    : ${r.info.marca}`);
        console.log(`  audio         : ${r.info.tieneAudio ? 'sí' : 'no'}`);
        console.log(`  giro          : ${r.info.girado ? 'sí' : 'no'}`);
      }
    }

    bloque(conf.etiqueta);
    console.log(`  veredicto     : ${r.ok ? '[OK] cumple' : '[NO] no cumple'}`);
    for (const p of r.problemas) console.log(`  problema      : ${p}`);
    for (const a of r.avisos) console.log(`  aviso         : ${a}`);
    if (!r.ok) todoOk = false;
  }

  bloque('RESULTADO DEL ENSAYO');
  console.log(`  ${todoOk ? 'Todo lo evaluado cumple.' : 'Hay configuraciones que NO cumplen.'}`);
  console.log('  No se ha publicado nada. No se ha escrito nada. Meta no ha sido llamado.\n');

  process.exitCode = todoOk ? 0 : 1;
}

main().catch((error) => {
  console.error(`\n  Error inesperado: ${error?.message ?? 'desconocido'}\n`);
  process.exitCode = 1;
});
