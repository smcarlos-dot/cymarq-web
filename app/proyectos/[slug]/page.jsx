import { notFound } from 'next/navigation';
import { projects, getProject, getAdjacentProjects } from '@/data/projects';
import ProjectHero from '@/components/project/ProjectHero';
import ProjectInfo from '@/components/project/ProjectInfo';
import HorizontalGallery from '@/components/project/HorizontalGallery';
import NextProject from '@/components/project/NextProject';

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const project = getProject(params.slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.short,
    openGraph: {
      title: `${project.name} | CYMARQ`,
      description: project.short,
      images: [{ url: project.cover }],
    },
  };
}

export default function ProjectPage({ params }) {
  const project = getProject(params.slug);
  if (!project) notFound();

  const { prev, next } = getAdjacentProjects(project.slug);

  return (
    <>
      <ProjectHero project={project} />
      <ProjectInfo project={project} />
      <HorizontalGallery images={project.gallery} name={project.name} />
      <NextProject prev={prev} next={next} />
    </>
  );
}
