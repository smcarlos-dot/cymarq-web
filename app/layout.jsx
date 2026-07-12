import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { site } from '@/data/site';

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
  openGraph: {
    title: site.seo.title,
    description: site.seo.description,
    url: site.url,
    siteName: 'CYMARQ',
    locale: 'es_CO',
    type: 'website',
    images: [{ url: '/photos/edificio-cyma.webp', width: 1200, height: 630, alt: 'CYMARQ — Edificio CYMA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.seo.title,
    description: site.seo.description,
    images: ['/photos/edificio-cyma.webp'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/brand/logo.png' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'CYMARQ',
  description: site.seo.description,
  url: site.url,
  email: site.email,
  telephone: site.whatsapp,
  areaServed: 'Colombia',
  sameAs: [site.instagram, site.facebook],
  knowsAbout: site.seo.keywords,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
