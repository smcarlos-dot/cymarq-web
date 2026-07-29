/**
 * Definición compartida de la publicación de Facebook y de sus credenciales.
 *
 * Lo usan `facebook-verify.mjs`, `facebook-dry-run.mjs` y
 * `facebook-publish.mjs` para no repetir tres veces los mismos datos.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { readSecret, requireSecret } from './instagram-env.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Diario propio de Facebook. Separado del de Instagram a propósito. */
export const DIARIO = join(REPO, '.facebook-publish-state.json');

/** Clave del trabajo. Es la misma propuesta que ya se publicó en Instagram. */
export const JOB_ID = 'CYM-2026-0001';

export const METADATA = resolve(
  REPO,
  '../CYMARQ_SOCIAL/PENDIENTES/2026-07-30_CASA_MODERNA_CON_PATIO_CUBIERTO/metadata.json'
);

export const IMAGEN_URL = 'https://www.cymarq.com.co/social/casa-moderna-patio-interno.jpg';

/** Página de destino, ya verificada manualmente. */
export const PAGE_ID_ESPERADO = '316223305905796';
export const PAGINA_ESPERADA = 'Cymarq';

/**
 * Qué texto de la propuesta se usa.
 *
 * La propuesta trae DOS versiones redactadas: `texto.instagram` (con 18
 * hashtags y llamada a la acción de IG) y `texto.facebook` (con el título
 * delante, el enlace al vídeo y 6 hashtags). Por defecto se usa la de
 * Facebook, que es la que el sistema redactó para esta plataforma.
 *
 * Se puede forzar la otra con `--caption=instagram`.
 */
export function elegirVariante() {
  const arg = process.argv.find((a) => a.startsWith('--caption='));
  const valor = arg ? arg.slice('--caption='.length) : 'facebook';
  if (valor !== 'facebook' && valor !== 'instagram') {
    throw new Error(`--caption debe ser "facebook" o "instagram", no "${valor}".`);
  }
  return valor;
}

/** Carga la propuesta y devuelve el texto de la variante elegida. */
export async function cargarPropuesta() {
  const metadata = JSON.parse(await readFile(METADATA, 'utf8'));
  const variante = elegirVariante();
  return { metadata, variante, caption: metadata?.texto?.[variante] ?? '' };
}

/** Page Access Token. Aborta con instrucciones claras si falta. */
export function requirePageToken() {
  return requireSecret('FACEBOOK_PAGE_ACCESS_TOKEN');
}

/**
 * PAGE_ID. Se lee del entorno igual que el token; si no está configurado en
 * local se usa el valor ya verificado, para no bloquear las comprobaciones.
 */
export async function readPageId() {
  return (await readSecret('FACEBOOK_PAGE_ID')) ?? PAGE_ID_ESPERADO;
}
