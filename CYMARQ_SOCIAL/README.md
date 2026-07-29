# CYMARQ SOCIAL

Sistema local de gestión y preparación de contenido para las redes sociales de
**CYMARQ** (Arquitectura · Diseño · Construcción).

Toma el material que ya existe en `PROYECTOS/`, lo inventaría, elige qué
publicar siguiendo una lógica de rotación, redacta los textos para Instagram y
Facebook, y deja cada propuesta lista para tu revisión en un panel local.

> **Fase 1 — nada se publica.**
> El sistema no se conecta a Instagram ni a Facebook, no pide contraseñas y no
> guarda credenciales. El botón `APROBAR` únicamente marca la propuesta como
> aprobada en el historial local.

---

## 1. Reglas de seguridad que el sistema respeta

| Regla | Cómo se garantiza |
|---|---|
| No modificar, mover ni borrar originales | Toda escritura pasa por `seguridad.verificar_destino()`, que aborta si la ruta cae dentro de `PROYECTOS/` |
| Las imágenes se **copian**, nunca se mueven | `seguridad.copiar_material()` usa `shutil.copy2` y verifica que el original siga existiendo después de copiar |
| No sobrescribir archivos | Si el nombre de destino existe, se añade un sufijo numérico |
| No borrar propuestas | Rechazar o reemplazar mueve la carpeta a `PENDIENTES/_descartadas/` |
| No publicar sin autorización | `publicacion_automatica` está forzado a `false` por código, y los publicadores de Meta lanzan `PublicacionDeshabilitada` |
| No exponer credenciales | `.gitignore` cubre `.env`, tokens y `PROYECTOS/`. `CONFIG/config.json` no admite tokens |
| No usar material sensible | El clasificador descarta documentos administrativos, presupuestos, contratos y cualquier archivo con palabras reservadas |

---

## 2. Arquitectura

```
CYMARQ_SOCIAL/
│
├── PROYECTOS/                   ← SOLO LECTURA. Nunca se toca.
├── PENDIENTES/                  ← propuestas por revisar
│   ├── 2026-08-04_CASA_MODERNA/
│   │   ├── imagen/              ← COPIA de la imagen original
│   │   ├── publicacion.txt      ← textos listos para copiar y pegar
│   │   └── metadata.json        ← registro completo de la propuesta
│   └── _descartadas/            ← propuestas rechazadas (no se borran)
├── PUBLICADOS/                  ← estructura de archivo
│   ├── instagram/  facebook/  _archivo/
│
├── CONFIG/
│   ├── config.json                    ← configuración editable
│   ├── inventario_contenido.json      ← todo el material clasificado
│   ├── historial_publicaciones.json   ← qué se usó y cuándo
│   └── perfiles_proyectos.json        ← fichas extraídas de PROYECTO.docx
│
├── src/cymarq_social/
│   ├── rutas.py          resolución de rutas
│   ├── seguridad.py      guardas de escritura y copia segura
│   ├── config.py         configuración
│   ├── clasificacion.py  reglas: tipo de archivo, uso, ambiente
│   ├── inventario.py     escaneo de PROYECTOS
│   ├── perfiles.py       lectura de los PROYECTO.docx
│   ├── redaccion.py      generación de títulos, textos y hashtags
│   ├── rotacion.py       qué proyecto e imagen tocan
│   ├── historial.py      registro de publicaciones
│   ├── generador.py      arma la propuesta en PENDIENTES
│   ├── panel.py          servidor del panel local
│   ├── panel_web/        interfaz (HTML + CSS + JS)
│   ├── limites_redes.py  limites de texto de IG/FB (solo aviso local)
│   ├── catalogo_social.py  derivados JPEG publicos + manifiesto
│   └── puente_node.py    invoca los publicadores Node de 09 WEB
│
├── cymarq.py             línea de comandos
├── INICIAR_PANEL.bat     doble clic para abrir el panel
├── GENERAR_PROPUESTA.bat doble clic para generar una propuesta
└── .gitignore
```

### Flujo de datos

```
PROYECTOS/ ──lectura──> inventario.py ──> CONFIG/inventario_contenido.json
                             │
PROYECTO.docx ──lectura──> perfiles.py ──> CONFIG/perfiles_proyectos.json
                             │
                             ▼
        rotacion.py ──elige proyecto + imagen──> redaccion.py
                             │                        │
                             ▼                        ▼
                        generador.py ──> PENDIENTES/<fecha>_<PROYECTO>/
                             │              imagen/ · publicacion.txt · metadata.json
                             ▼
              CONFIG/historial_publicaciones.json
                             │
                             ▼
                        panel local  →  APROBAR / RECHAZAR / GENERAR OTRA
                             │
                             ▼
         puente_node.py  →  publicadores Node (09 WEB)  →  Meta
```

### Tecnología

- **Python 3.13**, solo biblioteca estándar (`http.server`, `json`, `zipfile`,
  `pathlib`). **Sin dependencias que instalar.**
- **Pillow** opcional: si está disponible se registran las dimensiones de cada
  imagen y su formato para Instagram. Si no está, el sistema funciona igual.
- **Panel web**: HTML + CSS + JavaScript sin frameworks, servido desde
  `127.0.0.1` (no accesible desde la red).
- Los `PROYECTO.docx` se leen descomprimiendo el `.docx` como ZIP: no hace falta
  Word ni ninguna librería externa.

---

## 3. Cómo se usa

### Iniciar el panel local

Doble clic en **`INICIAR_PANEL.bat`**, o desde la terminal:

```bash
python cymarq.py panel
```

El panel queda en **http://127.0.0.1:8787** y se abre solo en el navegador.
Si el puerto está ocupado, el sistema busca el siguiente libre y lo muestra en
pantalla.

### Detenerlo

`Ctrl + C` en la ventana de la terminal, o simplemente cerrar esa ventana.
El sistema no deja procesos en segundo plano.

### Generar una publicación

Desde el panel: botón **Generar propuesta** (o **Generar** en la fila de un
proyecto concreto, en la pestaña *Proyectos*).

Desde la terminal:

```bash
python cymarq.py generar
```

Para forzar un proyecto:

```bash
python cymarq.py generar --proyecto "09 EDIFICIO CYMA"
```

Cada propuesta crea `PENDIENTES/<fecha>_<PROYECTO>/` con la imagen copiada,
`publicacion.txt` y `metadata.json`.

### Aprobar / rechazar

| Botón | Qué hace | Qué NO hace |
|---|---|---|
| **APROBAR** | Marca la propuesta como `aprobada` en el historial y en `metadata.json` | **No publica en Instagram ni Facebook** |
| **RECHAZAR** | Marca como `rechazada`, archiva la carpeta en `PENDIENTES/_descartadas/` y descarta esa imagen del pool | No borra nada |
| **GENERAR OTRA** | Cancela la propuesta actual, devuelve la imagen al pool y genera una distinta | No borra nada |
| **Reescribir texto** | Mantiene la misma imagen y redacta otra variante del texto | — |

Desde la terminal:

```bash
python cymarq.py aprobar CYM-2026-0001
```

```bash
python cymarq.py rechazar CYM-2026-0001 --motivo "prefiero otra vista"
```

### Otros comandos

```bash
python cymarq.py escanear
```

```bash
python cymarq.py estado
```

```bash
python cymarq.py listar --estado aprobada
```

```bash
python cymarq.py catalogo --listar
```

```bash
python cymarq.py puente --solo-diagnostico
```

---

## 4. Cómo funciona la selección de contenido

### Qué se puede publicar y qué no

| Prioridad | Tipo | Origen |
|---|---|---|
| 1 | Renders arquitectónicos | `01 RENDERS/` |
| 2 | Fotografías de obra | carpetas de fotos |
| 3 | Imágenes finales | otras imágenes del proyecto |
| 4 | Detalles arquitectónicos | por nombre de archivo |
| 5 | Planos con valor visual | `02 PLANOS/` (solo si `usar_planos: true`) |

**Nunca se usa automáticamente**: documentos administrativos, presupuestos,
contratos, hojas de cálculo, presentaciones, códigos QR, archivos CAD ni
cualquier ruta que contenga palabras reservadas (`presupuesto`, `contrato`,
`cédula`, `póliza`, `confidencial`…). Todo eso queda en estado `descartado`.

El logo y el portafolio se registran como recursos de marca, no como
publicaciones.

### Rotación de proyectos

1. Un proyecto que **nunca** se ha publicado va primero.
2. Entre los ya publicados, gana el que lleva **más tiempo** sin salir.
3. Se evita repetir un proyecto usado en las últimas *N* publicaciones
   (`proyectos_a_esperar_antes_de_repetir`, por defecto 4).
4. Se evita repetir un proyecto usado hace menos de
   `dias_minimos_entre_publicaciones_mismo_proyecto` días (por defecto 14).
5. Dentro del proyecto se prefiere la imagen de mayor prioridad que además
   muestre un **ambiente distinto** al de las últimas publicaciones de ese
   proyecto (no dos fachadas seguidas).
6. **Una imagen usada nunca se vuelve a proponer.**

Si las reglas 3 y 4 dejan cero opciones se relajan en ese orden, y el panel
muestra qué regla se aplicó en cada propuesta.

### Historial

`CONFIG/historial_publicaciones.json` guarda, por publicación:

`id` · `fecha` · `proyecto` · `archivo` · `ruta_original` · `plataforma` ·
`texto` (Instagram y Facebook) · `hashtags` · `estado` · `fecha_publicacion` ·
`url_publicacion` · `id_publicacion_meta` · regla de rotación aplicada.

Estados: `propuesta` → `aprobada` → `publicada`, más `rechazada` y `cancelada`.

Los estados `propuesta`, `aprobada` y `publicada` **ocupan** la imagen: mientras
una publicación esté en alguno de ellos, esa foto no se vuelve a proponer. Ese
es el mecanismo que evita publicar dos veces lo mismo.

### Textos

Los textos no salen de plantillas genéricas: se construyen con los datos reales
de cada `PROYECTO.docx` (ubicación, año, tipología, áreas, concepto de diseño,
materialidad) más el ambiente detectado en el nombre de la imagen.

Si un texto no convence, edita la ficha en
`CONFIG/perfiles_proyectos.json`, pon `"editado_a_mano": true` en ese proyecto
y ya no se sobrescribirá al reescanear. Todas las publicaciones futuras de ese
proyecto usarán tu versión.

---

## 5. Configuración — `CONFIG/config.json`

```jsonc
{
  "nombre_empresa": "CYMARQ",
  "sitio_web": "",                    // rellénalo cuando exista
  "instagram": "https://www.instagram.com/cymarq_obras/",
  "facebook": "https://www.facebook.com/cymarq.obras",
  "whatsapp": "+57 322 3656579",
  "correo": "contacto@cymarq.com.co",

  "frecuencia_publicacion": "semanal",
  "dias_publicacion": ["martes", "jueves"],
  "hora_publicacion": "18:30",

  "numero_hashtags": 18,
  "numero_hashtags_facebook": 6,
  "usar_renders": true,
  "usar_planos": false,               // ponlo en true para incluir plantas
  "usar_videos": false,

  "modo_aprobacion": true,            // nada avanza sin tu visto bueno
  "publicacion_automatica": false,    // forzado a false en la fase 1

  "puerto_panel": 8787
}
```

`publicacion_automatica` se reescribe a `false` cada vez que se carga la
configuración. Es intencional: en fase de desarrollo el sistema no puede
publicar aunque el archivo diga lo contrario.

---

## 6. Cómo se publica

La publicación tiene **una sola ruta**, y no la ejecuta este proceso Python:

```
CYMARQ_SOCIAL (Python)        decide qué, cuándo y con qué texto
        │
        ├─ catalogo_social.py  prepara el derivado JPEG público
        │
        └─ puente_node.py      monta los argumentos y lanza…
                │
                ▼
   09 WEB/scripts/*.mjs        único código que habla con Meta
                │
                ▼
        Instagram / Facebook
```

No existe un segundo cliente de Meta en Python, y no debe crearse: los
publicadores Node ya están probados con publicaciones reales, llevan la
protección antiduplicados y son los que guardan las credenciales fuera del
alcance de este sistema.

**Credenciales.** Viven únicamente en `09 WEB/.env.local`, que está en
`.gitignore`. Python nunca las ve: hereda el entorno sin inyectar nada y es el
script Node quien las lee.

**Estado actual.** El puente funciona solo en modo ensayo: `puente_node` se
niega por código a invocar los scripts de publicación. La publicación real se
lanza a mano desde `09 WEB` con `--confirm`.

**Comprobar la configuración sin tocar nada:**

```
python cymarq.py puente --solo-diagnostico
python cymarq.py catalogo --listar
```

## 7. Preguntas frecuentes

**¿Puede este sistema borrar o dañar mis renders?**
No. Cualquier escritura cuyo destino esté dentro de `PROYECTOS/` lanza una
excepción antes de tocar el disco. Las imágenes se copian, y tras cada copia se
verifica que el original siga existiendo.

**¿Se publicó algo por accidente?**
No es posible: no hay código que haga llamadas de red a Meta. Puedes
comprobarlo con `python cymarq.py puente --solo-diagnostico`.

**¿Dónde están mis contraseñas?**
En ningún sitio. El sistema nunca las pide. Meta no usa contraseñas para
publicar, usa tokens de aplicación, y esos viven solo en `09 WEB/.env.local`,
que nunca se versiona.

**Rechacé una imagen por error.**
Busca su entrada en `CONFIG/inventario_contenido.json` y cambia
`"estado": "descartado"` por `"disponible"`. La carpeta sigue intacta en
`PENDIENTES/_descartadas/`.

**Quiero que publique más seguido.**
Ajusta `dias_publicacion`, `publicaciones_por_semana` y
`dias_minimos_entre_publicaciones_mismo_proyecto` en `CONFIG/config.json`.
