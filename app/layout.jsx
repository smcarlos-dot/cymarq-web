import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import DevViewportToggle from '@/components/DevViewportToggle';
import JsonLd from '@/components/JsonLd';
import Script from 'next/script';
import { site } from '@/data/site';
import { OG_IMAGE, graph, organizationSchema, personSchema, websiteSchema } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.seo.title,
    template: '%s | CYMARQ',
  },
  description: site.seo.description,
  keywords: site.seo.keywords,
  authors: [{ name: 'CYMARQ' }],
  applicationName: 'CYMARQ',
  openGraph: {
    title: site.seo.title,
    description: site.seo.description,
    url: '/',
    siteName: 'CYMARQ',
    locale: 'es_CO',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.seo.title,
    description: site.seo.description,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/brand/logo.png',
    apple: '/brand/logo.png',
  },
};

/**
 * Identidad de la entidad, una sola vez en todo el sitio.
 *
 * Antes cada página repetía un nodo `ProfessionalService` completo, incluidas
 * las de proyecto, lo que hacía que cada URL se declarara a sí misma como la
 * empresa. Ahora el layout emite `ProfessionalService` y `WebSite` con `@id`
 * estables, y cada página añade sus propios nodos (`WebPage`, `Service`,
 * `BreadcrumbList`, `FAQPage`) apuntando a esos identificadores.
 */
const siteJsonLd = graph([organizationSchema(), personSchema(), websiteSchema()]);

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NTH4PC60N8"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NTH4PC60N8');
          `}
        </Script>

        <JsonLd data={siteJsonLd} />

        <Navbar />
        <main>{children}</main>
        <Footer />
        <WhatsAppButton />
        {/* Sólo se pinta en localhost y en modo desarrollo. */}
        <DevViewportToggle />
      </body>
    </html>
  );
}
