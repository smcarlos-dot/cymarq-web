import { site } from '@/data/site';

export const dynamic = 'force-static';

/**
 * Todo el sitio es rastreable.
 *
 * La regla `*` ya permite el paso a cualquier agente, incluidos los de los
 * buscadores con IA. Los rastreadores de respuesta se nombran igualmente de
 * forma explícita para dejar la decisión por escrito: si algún día alguien
 * restringe el acceso, que sea a propósito y no por descuido.
 */
const AGENTES_DE_RESPUESTA = [
  'OAI-SearchBot',      // búsqueda de ChatGPT
  'ChatGPT-User',       // visitas a petición de un usuario de ChatGPT
  'GPTBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',    // Gemini y AI Overviews
  'Applebot-Extended',
  'Bingbot',
  'cohere-ai',
  'meta-externalagent',
];

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AGENTES_DE_RESPUESTA.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
