/**
 * Descarga un GLB mostrando progreso real (streaming) y lo memoriza,
 * para que reabrir el visor no vuelva a consumir ancho de banda.
 */
const cache = new Map();

export default async function fetchModel(url, onProgress, signal) {
  if (cache.has(url)) {
    onProgress(1);
    return cache.get(url);
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`No se pudo descargar el modelo (HTTP ${response.status})`);
  }

  const total = Number(response.headers.get('content-length')) || 0;

  // Sin Content-Length (o sin streams) no hay porcentaje fiable: se descarga entero.
  if (!response.body || !total) {
    const buffer = await response.arrayBuffer();
    onProgress(1);
    cache.set(url, buffer);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(Math.min(0.999, received / total));
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  chunks.forEach((chunk) => {
    merged.set(chunk, offset);
    offset += chunk.length;
  });

  onProgress(1);
  cache.set(url, merged.buffer);
  return merged.buffer;
}
