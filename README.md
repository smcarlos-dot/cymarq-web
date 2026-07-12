# CYMARQ — Sitio web

Sitio premium de arquitectura para **CYMARQ** (Arquitectura • Diseño • Construcción), construido con Next.js, React, TailwindCSS, Framer Motion y GSAP. Exportación 100% estática, lista para **Cloudflare Pages**.

## Ejecutar en local

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build de producción

```bash
npm run build      # genera la carpeta ./out (sitio estático)
```

## Desplegar en Cloudflare Pages

1. Sube esta carpeta a un repositorio (GitHub/GitLab).
2. En Cloudflare Pages: **Create project → conectar repositorio**.
3. Configuración de build:
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
4. Deploy. (El archivo `public/_headers` configura la caché de assets.)

Alternativa sin repositorio: `npx wrangler pages deploy out`

> Cuando tengas dominio propio, actualiza `url` en `data/site.js` para que el SEO (sitemap, Open Graph, JSON-LD) apunte al dominio final.

## Estructura

```
app/
  layout.jsx            # Fuentes, SEO global, JSON-LD, Nav/Footer/WhatsApp
  page.jsx              # Home: Hero video, Nosotros, Servicios, Destacados, Portafolio, Videos, Contacto
  proyectos/page.jsx    # Portafolio completo (10 proyectos)
  proyectos/[slug]/     # Página de cada proyecto (hero, ficha, galería horizontal, siguiente proyecto)
  sitemap.js, robots.js # SEO
components/             # Navbar, Hero, About, Services, FeaturedProjects, PortfolioGrid,
                        # VideoSection, Contact, Footer, WhatsAppButton, Reveal
components/project/     # ProjectHero, ProjectInfo, HorizontalGallery, NextProject
data/                   # site.js (marca, servicios, SEO) · projects.js (10 proyectos)
public/                 # brand/ (logos) · projects/ (renders WebP) · photos/ · videos/
```

## Contenido

- Textos: `02 EMPRESA/EMPRESA.docx` y `PROYECTO.docx` de cada proyecto.
- Imágenes: renders optimizados a WebP (máx. 1920 px) desde `03 PROYECTOS` y `06 FOTOS`.
- Videos: `05 VIDEOS` (hero con timelapse; sección de videos con carga diferida y reproducción exclusiva).
- Videos de recorridos por proyecto: enlaces de YouTube embebidos (youtube-nocookie).

## Animaciones

- **Framer Motion:** apariciones por fade/desplazamiento (`Reveal`), menú móvil, hero, botón WhatsApp.
- **GSAP ScrollTrigger:** parallax del video del hero, parallax del hero de proyecto y galería horizontal fijada (pin) en escritorio con fallback swipe en móvil.
