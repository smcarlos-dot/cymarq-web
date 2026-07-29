/**
 * Servidor local para probar el webhook de Instagram sin desplegar.
 *
 *   node scripts/instagram-webhook-dev.mjs
 *   → http://localhost:8788/api/instagram/webhook
 *
 * Usa exactamente el mismo manejador que la Pages Function de producción.
 * Lee los secretos de `.env.local` (o del entorno) y nunca los imprime.
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { handleInstagramWebhook } from '../lib/instagram/webhook.mjs';

const PORT = Number(process.env.PORT) || 8788;
const ROUTE = '/api/instagram/webhook';

// Carga mínima de .env.local (sin dependencias externas).
try {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    if (value) process.env[match[1]] = value;
  }
  console.log('Cargado .env.local');
} catch {
  console.log('No hay .env.local; se usan las variables del entorno.');
}

const configured = ['INSTAGRAM_VERIFY_TOKEN', 'INSTAGRAM_APP_SECRET', 'INSTAGRAM_ACCESS_TOKEN'];
console.log(
  'Variables detectadas:',
  Object.fromEntries(configured.map((name) => [name, process.env[name] ? 'definida' : 'AUSENTE']))
);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname.replace(/\/$/, '') !== ROUTE) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
  });

  // `env` vacío: el manejador cae a process.env, igual que en las pruebas.
  const response = await handleInstagramWebhook(request, {});
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
});

server.listen(PORT, () => {
  console.log(`\nWebhook local escuchando en http://localhost:${PORT}${ROUTE}\n`);
});
