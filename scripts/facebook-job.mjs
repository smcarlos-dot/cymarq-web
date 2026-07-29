/**
 * Datos comunes de los scripts de Facebook: Página, credenciales y diario.
 *
 * El trabajo concreto (propuesta, metadata e imagen) ya NO vive aquí: llega
 * por línea de órdenes a través de `job-args.mjs`. Este módulo solo conserva
 * lo que es fijo de la integración: la Página de destino y dónde se guarda el
 * diario de publicaciones.
 *
 * `facebook-verify.mjs` lo importa sin pasar ningún argumento de trabajo, así
 * que aquí no puede haber validación de argumentos en el nivel superior.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { readSecret, requireSecret } from './instagram-env.mjs';
import { leerTrabajo, cargarPropuesta as cargarPropuestaBase } from './job-args.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Diario propio de Facebook. Separado del de Instagram a propósito. */
export const DIARIO = join(REPO, '.facebook-publish-state.json');

/** Página de destino, verificada en su día contra la Graph API. */
export const PAGE_ID_ESPERADO = '316223305905796';
export const PAGINA_ESPERADA = 'Cymarq';

/**
 * Lee el trabajo de la línea de órdenes.
 *
 * La variante de texto por defecto es `facebook`, que es la que el generador
 * redacta para esta plataforma (título delante, enlace al vídeo y menos
 * hashtags). Se puede forzar la de Instagram con `--caption=instagram`.
 */
export function leerTrabajoFacebook(uso) {
  return leerTrabajo({ varianteCaption: 'facebook', uso });
}

/** Carga la propuesta y devuelve el texto de la variante elegida. */
export const cargarPropuesta = cargarPropuestaBase;

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
