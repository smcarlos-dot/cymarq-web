import Hero from '@/components/Hero';
import Momento from '@/components/Momento';
import Tramites from '@/components/Tramites';
import Proceso from '@/components/Proceso';
import Renders from '@/components/Renders';
import FeaturedProjects from '@/components/FeaturedProjects';
import About from '@/components/About';
import Contact from '@/components/Contact';
import JsonLd from '@/components/JsonLd';
import { site } from '@/data/site';
import { graph, pageMetadata, webPageSchema } from '@/lib/seo';

export const metadata = pageMetadata({
  title: site.seo.title,
  socialTitle: site.seo.title,
  description: site.seo.description,
  path: '/',
});

/**
 * La home orienta y reparte; no contiene el sitio entero.
 *
 * Antes repetía aquí lo que ya vive en su propia página: el catálogo completo
 * de servicios (que es /servicios/) y dos secciones de proyectos seguidas
 * (que son /proyectos/). Eso la dejaba en 35 pantallas de scroll en móvil.
 *
 * Ahora el recorrido es: su momento → qué hacemos y dónde resolver su trámite
 * → cómo trabajamos → la prueba de que verá su casa antes de construirla →
 * una muestra del portafolio → quiénes somos → CTA. Cada bloque enlaza a la
 * página donde ese tema se desarrolla de verdad.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageSchema({
            path: '/',
            name: site.seo.title,
            description: site.seo.description,
          }),
        ])}
      />
      <Hero />
      <Momento />
      <Tramites />
      <Proceso />
      <Renders />
      <FeaturedProjects />
      <About />
      <Contact />
    </>
  );
}
