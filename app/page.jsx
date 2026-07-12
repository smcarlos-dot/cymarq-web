import Hero from '@/components/Hero';
import About from '@/components/About';
import Services from '@/components/Services';
import FeaturedProjects from '@/components/FeaturedProjects';
import PortfolioGrid from '@/components/PortfolioGrid';
import Renders from '@/components/Renders';
import Contact from '@/components/Contact';

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <FeaturedProjects />
      <PortfolioGrid limit={6} />
      <Renders />
      <Contact />
    </>
  );
}
