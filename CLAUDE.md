# CYMARQ — Reglas permanentes de trabajo

Estas instrucciones son obligatorias para cualquier sesión de Claude Code en este repositorio.
El idioma de trabajo con el usuario es **español**.

## El proyecto

Sitio web corporativo de CYMARQ.

- **Framework:** Next.js 14 (App Router, JavaScript — no TypeScript)
- **Estilos:** Tailwind CSS
- **Animación:** framer-motion y GSAP
- **Build:** exportación estática (`output: 'export'` en `next.config.mjs`) → genera la carpeta `out/`
- **Estructura:** `app/` (rutas y layout), `components/` (componentes), `data/` (contenido: `projects.js`, `site.js`), `lib/` (utilidades), `public/` (imágenes, vídeos, marca)

El contenido editorial (proyectos, textos del sitio) vive en `data/`, no está incrustado en los componentes.
Antes de tocar un componente para cambiar un texto o un proyecto, comprueba si el cambio corresponde a `data/`.

## Despliegue

- **Repositorio:** https://github.com/smcarlos-dot/cymarq-web.git (remoto `origin`, HTTPS)
- **Rama de producción:** `main` (rama única de trabajo)
- **Hosting:** Cloudflare Pages, conectado a este repositorio con despliegues automáticos
- **Dominio:** https://www.cymarq.com.co

**Cada push exitoso a `main` lanza automáticamente un despliegue de producción.**
Nunca hay que hacer un despliegue manual en Cloudflare. Un push equivale a publicar en el sitio real.

## Flujo de trabajo obligatorio para cada modificación

Cuando el usuario pida un cambio en la web, sigue este flujo completo sin pedir autorización paso a paso:

### 1. Antes de empezar
- Ejecuta `git status`.
- Trabaja siempre sobre `main`. Si `git branch --show-current` no devuelve `main`, detente y avisa.
- Si hay cambios locales sin confirmar que **no** has hecho tú en esta sesión: **detente y pregunta** antes de tocar nada. No los sobrescribas ni los incluyas en tu commit.

### 2. Realiza el cambio
- Aplica exactamente lo que el usuario ha pedido, directamente sobre los archivos del proyecto.
- **No modifiques elementos, funcionalidades, contenido ni diseño ajenos a la solicitud**, salvo que sea estrictamente necesario para que el cambio funcione. Si algo adicional es necesario, dilo explícitamente al informar.
- No hagas refactors, limpiezas ni "mejoras" no solicitadas.

### 3. Verifica
- Revisa `git diff`.
- Comprueba con `git status` que no se ha modificado ningún archivo ajeno al cambio.
- Ejecuta **obligatoriamente** el build de producción:

  ```
  npm run build
  ```

  Un build correcto termina con "Compiled successfully" / "Exporting" y regenera `out/`.

- **No ejecutes `npm run lint`**: ESLint no está instalado en este proyecto y `next lint` abre un asistente interactivo que deja la terminal colgada. La verificación obligatoria es el build.
- No hay tests configurados. Si algún día se añaden, ejecútalos también.

### 4. Si el build falla
- **No hagas commit. No hagas push.**
- Identifica la causa, corrígela y vuelve a ejecutar el build.
- Repite hasta que el build termine correctamente.
- Si no puedes solucionarlo de forma segura, **detente y explica el error al usuario**. No hagas commit de código roto.

### 5. Cuando el build sea correcto
- `git add` **únicamente** los archivos correspondientes al cambio realizado (nunca `git add -A` a ciegas).
- `git commit` con un mensaje breve y descriptivo, en español.
- `git push origin main`.

### 6. Después del push, informa siempre de:
- Confirmación de que `origin/main` contiene el nuevo commit (verifícalo, p. ej. con `git ls-remote origin refs/heads/main` o comparando `git rev-parse HEAD` con `git rev-parse origin/main`).
- El **hash** del commit.
- Los **archivos modificados**.
- El **resultado del build**.
- Confirmación de que el push a GitHub fue exitoso, y recuerda que Cloudflare Pages desplegará solo.

## Comandos preautorizados

No hace falta pedir permiso al usuario para: `git status`, `git diff`, `git log`, `git branch`, `git add`, `git commit`, `git push origin main`, `npm run build`, y comandos git de solo lectura (`git remote -v`, `git rev-parse`, `git ls-remote`, `git show`).

## Reglas de seguridad (inquebrantables)

- **NUNCA** `git push --force` (ni `-f`, ni ninguna variante).
- **NUNCA** `git reset --hard` sin autorización explícita del usuario.
- **NUNCA** reescribas el historial: nada de `rebase`, `commit --amend`, `filter-branch`, `push --force-with-lease`.
- **NUNCA** elimines el repositorio.
- **NUNCA** elimines archivos importantes salvo que la tarea pedida lo requiera de forma inequívoca.
- **NUNCA** sobrescribas cambios remotos.
- Si detectas divergencia o conflicto entre el repositorio local y `origin/main`: **detente antes del push** y explica el problema al usuario.
- No modifiques configuraciones de Cloudflare, dominio, DNS ni GitHub salvo petición expresa.
- Recuerda que `main` es producción: un push publica en el sitio en vivo.

## Notas técnicas

- `out/`, `.next/` y `node_modules/` están en `.gitignore`. El build regenera `out/` localmente pero **no se versiona**: Cloudflare Pages ejecuta su propio build. Nunca añadas `out/` al commit.
- Las imágenes van en `.webp` y los vídeos en `.mp4`/`.webm` dentro de `public/`. `images.unoptimized` está activo porque la exportación es estática.
- `public/_headers` contiene las cabeceras HTTP de Cloudflare Pages. Trátalo con cuidado.
- `trailingSlash: true`: las rutas se generan como carpetas con `/` final.
