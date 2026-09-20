import { notFound } from 'next/navigation';
import { projects, getProject, getAdjacentProjects } from '@/data/projects';
import ProjectHero from '@/components/project/ProjectHero';
import ProjectInfo from '@/components/project/ProjectInfo';
import HorizontalGallery from '@/components/project/HorizontalGallery';
import Project3DModel from '@/components/project/Project3DModel';
import NextProject from '@/components/project/NextProject';
import JsonLd from '@/components/JsonLd';
import { ORG_ID, absolute, breadcrumbSchema, graph, pageMetadata, webPageSchema } from '@/lib/seo';

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const project = getProject(params.slug);
  if (!project) return {};
  const path = `/proyectos/${project.slug}/`;

  return pageMetadata({
    title: `${project.name} | Proyecto de CYMARQ en ${project.location}`,
    socialTitle: `${project.name} | CYMARQ`,
    description: project.short,
    path,
    type: 'article',
    image: { url: project.cover, alt: `${project.name} — ${project.location}` },
  });
}

export default function ProjectPage({ params }) {
  const project = getProject(params.slug);
  if (!project) notFound();

  const { prev, next } = getAdjacentProjects(project.slug);
  const path = `/proyectos/${project.slug}/`;
  const trail = [
    { name: 'Inicio', path: '/' },
    { name: 'Proyectos', path: '/proyectos/' },
    { name: project.name, path },
  ];

  return (
    <>
      <JsonLd
        data={graph([
          webPageSchema({
            path,
            name: project.name,
            description: project.short,
            breadcrumb: true,
          }),
          breadcrumbSchema(path, trail),
          {
            '@type': 'CreativeWork',
            '@id': `${absolute(path)}#proyecto`,
            name: project.name,
            description: project.short,
            url: absolute(path),
            creator: { '@id': ORG_ID },
            inLanguage: 'es-CO',
            image: absolute(project.cover),
            dateCreated: String(project.year),
            locationCreated: { '@type': 'Place', name: project.location },
            about: project.categories,
            keywords: project.services,
          },
        ])}
      />
      <ProjectHero project={project} />
      <ProjectInfo project={project} />
      <HorizontalGallery images={project.gallery} name={project.name} />
      {project.model3d && (
        <Project3DModel
          model={project.model3d.src}
          title={project.name}
          poster={project.model3d.poster || project.cover}
          fileLabel={project.model3d.fileLabel}
        />
      )}
      <NextProject prev={prev} next={next} />
    </>
  );
}
