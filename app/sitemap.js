import { projects } from '@/data/projects';
import { site } from '@/data/site';

export const dynamic = 'force-static';

export default function sitemap() {
  const base = site.url;
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/proyectos/`, priority: 0.9 },
    ...projects.map((p) => ({
      url: `${base}/proyectos/${p.slug}/`,
      priority: 0.8,
    })),
  ];
}
