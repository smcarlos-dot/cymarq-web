import { site } from '@/data/site';

/**
 * Utilidades de SEO compartidas por todas las rutas.
 *
 * El objetivo es que cada página declare lo mismo en tres sitios a la vez
 * (metadatos, Open Graph y datos estructurados) sin repetir el objeto entero
 * en cada `page.jsx`, y que los identificadores de Schema.org sean estables:
 * un único nodo de organización al que apuntan todas las demás entidades.
 */

export const ORG_ID = `${site.url}/#organization`;
export const SITE_ID = `${site.url}/#website`;

/** Imagen social por defecto: 1200×630 real, no una foto vertical recortada. */
export const OG_IMAGE = {
  url: '/brand/og-cymarq.jpg',
  width: 1200,
  height: 630,
  alt: 'CYMARQ — Arquitectura, diseño y construcción en Cúcuta',
};

/**
 * Construye el objeto `metadata` de una ruta.
 * `path` siempre con barra final, igual que las rutas exportadas.
 *
 * `title` es el título completo, tal como debe salir en la pestaña y en el
 * resultado de búsqueda: se marca como absoluto para que no se le vuelva a
 * aplicar la plantilla `%s | CYMARQ` del layout y acabe diciendo CYMARQ dos
 * veces. `socialTitle` permite un título más corto para las tarjetas
 * sociales, donde el título largo se corta.
 */
export function pageMetadata({
  title,
  socialTitle,
  description,
  path,
  image,
  type = 'website',
}) {
  const img = image
    ? { url: image.url, width: image.width, height: image.height, alt: image.alt || title }
    : OG_IMAGE;
  const social = socialTitle || title;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: social,
      description,
      url: path,
      siteName: 'CYMARQ',
      locale: 'es_CO',
      type,
      images: [img],
    },
    twitter: {
      card: 'summary_large_image',
      title: social,
      description,
      images: [img.url],
    },
  };
}

export function absolute(path) {
  return `${site.url}${path}`;
}

/**
 * Nodo raíz de la entidad. Se emite una sola vez, en el layout.
 * `ProfessionalService` es subtipo de `LocalBusiness` y de `Organization`,
 * así que sirve de `publisher` y de `provider` de los servicios.
 *
 * No se declara `address`: CYMARQ no publica una oficina abierta al público.
 * La señal local se da con `areaServed`, que es lo que corresponde a un
 * negocio de área de servicio.
 */
export function organizationSchema() {
  return {
    '@type': 'ProfessionalService',
    '@id': ORG_ID,
    name: site.name,
    alternateName: 'CYMARQ Arquitectura',
    description: site.entityDescription,
    slogan: site.tagline,
    url: `${site.url}/`,
    logo: {
      '@type': 'ImageObject',
      '@id': `${site.url}/#logo`,
      url: absolute('/brand/logo.png'),
      caption: 'CYMARQ',
    },
    image: absolute(OG_IMAGE.url),
    email: site.email,
    telephone: site.phoneE164,
    areaServed: site.serviceAreas.map((a) => ({
      '@type': a.type,
      name: a.name,
      ...(a.containedIn
        ? { containedInPlace: { '@type': 'AdministrativeArea', name: a.containedIn } }
        : {}),
    })),
    knowsAbout: site.knowsAbout,
    sameAs: [site.instagram, site.facebook],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: site.phoneE164,
        email: site.email,
        availableLanguage: ['es'],
        areaServed: 'CO',
        url: site.whatsappLink,
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de CYMARQ',
      itemListElement: site.catalogo.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          ...(s.url ? { url: absolute(s.url) } : {}),
        },
      })),
    },
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${site.url}/`,
    name: 'CYMARQ',
    description: site.seo.description,
    inLanguage: 'es-CO',
    publisher: { '@id': ORG_ID },
  };
}

export function webPageSchema({ path, name, description, breadcrumb, image }) {
  return {
    '@type': 'WebPage',
    '@id': `${absolute(path)}#webpage`,
    url: absolute(path),
    name,
    description,
    inLanguage: 'es-CO',
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    // La fecha importa especialmente en el contenido normativo: dice desde
    // cuándo se sostiene lo que se afirma, tanto a una persona como a un
    // sistema que decide si la información sigue vigente.
    dateModified: site.contentUpdated,
    primaryImageOfPage: absolute(image || OG_IMAGE.url),
    ...(breadcrumb ? { breadcrumb: { '@id': `${absolute(path)}#breadcrumb` } } : {}),
  };
}

/** "20 de septiembre de 2026" a partir de una fecha ISO. */
export function fechaLarga(iso = site.contentUpdated) {
  const [y, m, d] = iso.split('-').map(Number);
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${d} de ${meses[m - 1]} de ${y}`;
}

/** `trail`: [{ name, path }] desde Inicio hasta la página actual. */
export function breadcrumbSchema(path, trail) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absolute(path)}#breadcrumb`,
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export function serviceSchema({ path, name, description, serviceType, alternateName, catalog }) {
  return {
    '@type': 'Service',
    '@id': `${absolute(path)}#service`,
    name,
    ...(alternateName?.length ? { alternateName } : {}),
    description,
    serviceType,
    url: absolute(path),
    provider: { '@id': ORG_ID },
    areaServed: site.serviceAreas.map((a) => ({ '@type': a.type, name: a.name })),
    ...(catalog?.length
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name,
            itemListElement: catalog.map((c) => ({
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: c },
            })),
          },
        }
      : {}),
  };
}

/** `items`: [{ q, plain }] — `plain` es la respuesta visible en texto llano. */
export function faqSchema(path, items) {
  return {
    '@type': 'FAQPage',
    '@id': `${absolute(path)}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.plain },
    })),
  };
}

/** Envuelve varios nodos en un único bloque `@graph`. */
export function graph(nodes) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  };
}
