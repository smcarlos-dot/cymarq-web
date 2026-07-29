/**
 * Lectura del token de publicación para los scripts locales.
 *
 * El token vive en Cloudflare Pages como secreto. Para ejecutar los scripts de
 * verificación desde este equipo hace falta también en `.env.local`, que está
 * cubierto por `.gitignore` (`.env*`) y nunca se versiona.
 *
 * Este módulo NO imprime el valor en ningún caso: solo lo devuelve.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Parser mínimo de `.env`: `CLAVE=valor`, ignora comentarios y líneas vacías,
 * y quita comillas envolventes si las hay.
 */
function parseEnv(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) values[key] = value;
  }
  return values;
}

/**
 * Devuelve el valor de una variable buscando primero en el entorno del proceso
 * y después en `.env.local`. Devuelve `undefined` si no está en ninguno.
 */
export async function readSecret(name) {
  const fromProcess = process.env[name];
  if (typeof fromProcess === 'string' && fromProcess.trim().length > 0) {
    return fromProcess.trim();
  }

  let contents;
  try {
    contents = await readFile(join(REPO, '.env.local'), 'utf8');
  } catch {
    return undefined;
  }

  const value = parseEnv(contents)[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/** Igual que `readSecret`, pero aborta con un mensaje claro si falta. */
export async function requireSecret(name) {
  const value = await readSecret(name);
  if (!value) {
    console.error(`\n  FALTA LA VARIABLE ${name}.\n`);
    console.error(`  El token está en Cloudflare Pages, pero este script se ejecuta en local.`);
    console.error(`  Añade la línea siguiente a "09 WEB/.env.local" (ya ignorado por git):\n`);
    console.error(`      ${name}=<el token generado en el panel de Meta>\n`);
    console.error(`  O bien pásalo solo para esta ejecución, sin dejarlo en disco:\n`);
    console.error(`      $env:${name}="..."; npm run instagram:verify\n`);
    process.exit(1);
  }
  return value;
}
