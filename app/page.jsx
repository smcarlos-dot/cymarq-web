import Hero from '@/components/Hero';
import Momento from '@/components/Momento';
import Proceso from '@/components/Proceso';
import Renders from '@/components/Renders';
import FeaturedProjects from '@/components/FeaturedProjects';
import PortfolioGrid from '@/components/PortfolioGrid';
import About from '@/components/About';
import Services from '@/components/Services';
import Contact from '@/components/Contact';

export const metadata = {
  alternates: {
    canonical: '/',
  },
};

/**
 * Recorrido de la home, en el orden en que un cliente resuelve sus dudas:
 * su momento → cómo trabajamos → la prueba de que verá su casa antes de
 * construirla → proyectos como historias → quiénes somos → qué hacemos → CTA.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Momento />
      <Proceso />
      <Renders />
      <FeaturedProjects />
      <PortfolioGrid limit={6} />
      <About />
      <Services />
      <Contact />
    </>
  );
}
