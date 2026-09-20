import { projects } from '@/data/projects';
import { serviciosOrdenados, servicioPath } from '@/data/servicios';
import { site } from '@/data/site';

export const dynamic = 'force-static';

/**
 * Todas las rutas públicas del sitio. Las páginas de servicio y las preguntas
 * frecuentes van con prioridad alta: son las que responden búsquedas por sí
 * solas, mientras que las legales quedan al final.
 */
export default function sitemap() {
  const base = site.url;
  const lastModified = new Date(site.contentUpdated);

  return [
    { url: `${base}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/servicios/`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    ...serviciosOrdenados.map((s) => ({
      url: `${base}${servicioPath(s.slug)}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    })),
    {
      url: `${base}/preguntas-frecuentes/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    { url: `${base}/proyectos/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    ...projects.map((p) => ({
      url: `${base}/proyectos/${p.slug}/`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.7,
    })),
    {
      url: `${base}/politica-de-privacidad/`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/terminos-y-condiciones/`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/eliminacion-de-datos/`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
