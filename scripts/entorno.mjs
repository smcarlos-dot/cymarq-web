/**
 * Identidad del entorno, lado Node. Espejo exacto de `cymarq_social/entorno.py`.
 *
 * Existe para que la barrera este tambien en el punto MAS BAJO del flujo: justo
 * dentro de los publicadores, antes de escribir en Meta. Asi no se puede saltar
 * invocando un script suelto por debajo del orquestador de Python.
 *
 * Autoridad: `CYMARQ_SOCIAL/CONFIG/entorno.json`, que solo existe en la VM y
 * lleva dentro el machine-id de la maquina donde se creo. Si el marcador viaja
 * a otra maquina, deja de valer.
 *
 * `CYMARQ_ENV` solo puede degradar a desarrollo, nunca ascender a produccion.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const MARCADOR = join(REPO, 'CYMARQ_SOCIAL', 'CONFIG', 'entorno.json');

export const PRODUCCION = 'production';
export const DESARROLLO = 'development';

function machineId() {
  for (const ruta of ['/etc/machine-id', '/var/lib/dbus/machine-id']) {
    try {
      const v = readFileSync(ruta, 'utf8').trim();
      if (v) return v;
    } catch {
      /* siguiente */
    }
  }
  return null;
}

function leerMarcador() {
  try {
    return JSON.parse(readFileSync(MARCADOR, 'utf8'));
  } catch {
    return {};
  }
}

export function entorno() {
  const m = leerMarcador();
  if (m.entorno !== PRODUCCION) return DESARROLLO;

  const actual = machineId();
  if (!m.machine_id || !actual || m.machine_id !== actual) return DESARROLLO;

  if ((process.env.CYMARQ_ENV || '').trim().toLowerCase() === DESARROLLO) {
    return DESARROLLO;
  }
  return PRODUCCION;
}

export const esProduccion = () => entorno() === PRODUCCION;

/** Explicacion legible, para poder decir POR QUE se bloqueo algo. */
export function detalle() {
  const m = leerMarcador();
  const actual = machineId();
  const env = (process.env.CYMARQ_ENV || '').trim().toLowerCase() || null;

  let motivo;
  if (!Object.keys(m).length) motivo = 'no existe CONFIG/entorno.json: maquina de desarrollo';
  else if (m.entorno !== PRODUCCION) motivo = `el marcador dice "${m.entorno}"`;
  else if (!actual) motivo = 'no se puede leer el machine-id';
  else if (m.machine_id !== actual) motivo = 'el marcador pertenece a otra maquina';
  else if (env === DESARROLLO) motivo = 'CYMARQ_ENV=development degrada esta ejecucion';
  else motivo = 'marcador de produccion valido para esta maquina';

  return { entorno: entorno(), motivo, marcador: MARCADOR, cymarq_env: env };
}

/**
 * Barrera para los publicadores. Corta la ejecucion si no es produccion.
 *
 * Escribe en stderr y termina con codigo 1: para el envoltorio, un fallo
 * ANTERIOR a cualquier POST, que es exactamente lo que es.
 */
export function exigirProduccion(quien = 'publicador') {
  if (esProduccion()) return;
  const d = detalle();
  console.error(
    `\n  BLOQUEADO POR ENTORNO — ${quien}\n`
    + `  Esta maquina es "${d.entorno}", no "${PRODUCCION}".\n`
    + `  Motivo: ${d.motivo}\n`
    + '  Solo la VM de produccion puede publicar. No se ha enviado nada a Meta.\n'
  );
  process.exit(1);
}
