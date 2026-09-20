import ServicioLayout from '@/components/ServicioLayout';
import JsonLd from '@/components/JsonLd';
import { getServicio, servicioPath } from '@/data/servicios';
import {
  breadcrumbSchema,
  graph,
  pageMetadata,
  serviceSchema,
  webPageSchema,
} from '@/lib/seo';

const servicio = getServicio('desenglobe-y-subdivision');
const path = servicioPath(servicio.slug);

export const metadata = pageMetadata({
  title: servicio.title,
  socialTitle: `${servicio.h1} | CYMARQ`,
  description: servicio.description,
  path,
  image: {
    url: servicio.cover,
    width: servicio.coverSize.width,
    height: servicio.coverSize.height,
    alt: servicio.coverAlt,
  },
});

const trail = [
  { name: 'Inicio', path: '/' },
  { name: 'Servicios', path: '/servicios/' },
  { name: servicio.nav, path },
];

export default function ServicioPage() {
  return (
    <>
      <JsonLd
        data={graph([
          webPageSchema({
            path,
            name: servicio.h1,
            description: servicio.description,
            breadcrumb: true,
            image: servicio.cover,
          }),
          breadcrumbSchema(path, trail),
          serviceSchema({
            path,
            name: servicio.h1,
            description: servicio.respuesta.text,
            serviceType: servicio.schema.serviceType,
            alternateName: servicio.schema.alternateName,
            catalog: servicio.schema.catalog,
          }),
        ])}
      />
      <ServicioLayout servicio={servicio} />
    </>
  );
}
