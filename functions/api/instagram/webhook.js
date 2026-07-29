/**
 * Cloudflare Pages Function — https://www.cymarq.com.co/api/instagram/webhook
 *
 * El sitio se exporta como estático (`output: 'export'`), por lo que Next.js no
 * puede servir rutas de API. Cloudflare Pages compila este directorio
 * `functions/` como Worker y lo antepone a los assets estáticos.
 *
 * Los secretos llegan por `context.env` (panel de Cloudflare Pages →
 * Settings → Variables and Secrets), nunca desde el bundle del frontend.
 */

import { handleInstagramWebhook } from '../../../lib/instagram/webhook.mjs';

export function onRequest(context) {
  return handleInstagramWebhook(context.request, context.env);
}
