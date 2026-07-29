"""Redaccion de los textos de cada publicacion.

El material de partida son las fichas reales de CYMARQ (PROYECTO.docx), no
frases genericas. La plantilla solo arma el orden; la sustancia sale del
proyecto: ubicacion, ano, tipologia, areas, concepto y materialidad.

Criterios de tono acordados:
  - profesional, en primera persona del plural, sin superlativos vacios;
  - un dato concreto por publicacion (area, ubicacion, tipologia, nivel);
  - nada de "increible", "espectacular", "unico en su clase";
  - cierre con una accion clara, no con una frase de relleno.
"""

from __future__ import annotations

import re
from typing import Any

from .clasificacion import normalizar

# --- Aperturas por ambiente ---------------------------------------------
# Cada entrada describe lo que realmente se ve en la imagen.

APERTURAS: dict[str, tuple[str, ...]] = {
    "fachada": (
        "La fachada es la primera decisión de diseño: define cómo se lee el "
        "proyecto desde la calle.",
        "Volumen, proporción y materiales. Así resolvimos el frente de {nombre}.",
        "El exterior de {nombre}, resuelto con líneas limpias y una composición "
        "sobria.",
    ),
    "patio_interior": (
        "Un patio interior no es espacio sobrante: es el que reparte luz y "
        "ventilación al resto de la casa.",
        "El patio interior organiza la vivienda y mantiene la relación entre el "
        "adentro y el afuera.",
        "Luz natural, vegetación y ventilación cruzada entrando por el centro de "
        "la casa.",
    ),
    "patio": (
        "El patio amplía la vivienda hacia afuera sin perder privacidad.",
        "Un espacio exterior protegido cambia por completo la forma de habitar "
        "una casa.",
    ),
    "terraza": (
        "La terraza convierte la cubierta en un espacio útil, no en un área "
        "perdida.",
        "Aprovechar la cubierta como zona social es una de las mejores "
        "decisiones en lotes pequeños.",
    ),
    "sala_comedor": (
        "Integrar sala, comedor y cocina hace que el área social se sienta más "
        "amplia de lo que mide.",
        "Área social integrada: menos muros, más continuidad visual.",
    ),
    "comedor": (
        "El comedor como punto de encuentro, con iluminación natural directa.",
    ),
    "cocina": (
        "La cocina se diseñó para funcionar: circulación, almacenamiento y "
        "ventilación resueltos.",
        "Una cocina abierta al área social, pensada desde el uso diario.",
    ),
    "sala": (
        "La sala, planteada para recibir luz natural durante buena parte del día.",
        "El área social como corazón de la vivienda.",
    ),
    "habitacion": (
        "Las habitaciones se diseñaron buscando ventilación cruzada e "
        "iluminación natural directa.",
        "Una habitación sobria, con la luz natural resuelta desde el diseño.",
    ),
    "bano": (
        "Los baños también se diseñan: ventilación, acabados y circulación "
        "importan.",
    ),
    "closet": (
        "El almacenamiento resuelto desde el diseño, no improvisado en obra.",
    ),
    "acceso": (
        "El acceso marca la transición entre la calle y el proyecto.",
        "El lobby y el acceso ordenan la llegada al edificio.",
    ),
    "zona_social": (
        "Las zonas de bienestar se integraron al programa desde el inicio del "
        "diseño.",
    ),
    "plano_tecnico": (
        "Detrás de cada render hay un plano. Aquí, parte del desarrollo técnico "
        "del proyecto.",
        "El proyecto también se explica en planta: distribución, circulaciones "
        "y áreas.",
    ),
    "render_general": (
        "Una de las vistas desarrolladas para {nombre}.",
    ),
    "general": (
        "Compartimos una de las imágenes de {nombre}.",
        "Así quedó {nombre} en su versión desarrollada.",
    ),
}

ETIQUETAS_AMBIENTE = {
    "fachada": "Fachada",
    "patio_interior": "Patio interior",
    "patio": "Patio",
    "terraza": "Terraza",
    "sala_comedor": "Área social",
    "comedor": "Comedor",
    "cocina": "Cocina",
    "sala": "Sala",
    "habitacion": "Habitación",
    "bano": "Baño",
    "closet": "Vestier",
    "acceso": "Acceso",
    "zona_social": "Zona social",
    "plano_tecnico": "Planta arquitectónica",
    "render_general": "Vista general",
    "general": "Vista del proyecto",
}

LLAMADAS_ACCION = (
    "¿Tienes un lote y una idea? Escríbenos por WhatsApp al {whatsapp} y "
    "conversemos sobre tu proyecto.",
    "Diseñamos y construimos en todo Colombia. Cuéntanos qué necesitas: "
    "{whatsapp}",
    "Si estás pensando en construir o remodelar, escríbenos al {whatsapp} y "
    "revisamos juntos la viabilidad de tu proyecto.",
    "Agenda una asesoría inicial con nuestro equipo: {whatsapp} · {correo}",
    "Trabajamos proyectos públicos y privados en todo el país. Escríbenos al "
    "{whatsapp}.",
)

CIERRES_FACEBOOK = (
    "En CYMARQ trabajamos con un equipo interdisciplinario de arquitectura e "
    "ingeniería civil, para que cada diseño sea técnicamente viable desde el "
    "primer boceto.",
    "Somos un estudio de arquitectura, diseño y construcción con experiencia en "
    "proyectos públicos y privados en todo el territorio colombiano.",
    "Diseñamos espacios pensados para ser construidos, habitados y disfrutados "
    "durante muchos años.",
)

# --- Hashtags -----------------------------------------------------------

HASHTAGS_MARCA = ("#CYMARQ", "#CymarqObras")

HASHTAGS_BASE = (
    "#Arquitectura", "#DiseñoArquitectónico", "#Construcción",
    "#ArquitecturaColombiana", "#Arquitectos", "#DiseñoYConstrucción",
    "#ArquitecturaContemporánea", "#Render3D", "#ProyectoArquitectónico",
)

HASHTAGS_TEMA = {
    "vivienda": ("#CasasModernas", "#ViviendaUnifamiliar", "#DiseñoDeCasas",
                 "#ArquitecturaResidencial", "#CasaModerna"),
    "comercial": ("#ArquitecturaComercial", "#DiseñoComercial",
                  "#LocalesComerciales", "#ImagenCorporativa"),
    "uso_mixto": ("#UsoMixto", "#Edificios", "#ArquitecturaUrbana"),
    "espacio_publico": ("#EspacioPúblico", "#Urbanismo", "#ParquesUrbanos",
                        "#ArquitecturaInclusiva", "#DiseñoUrbano"),
    "institucional": ("#ObraPública", "#ProyectosPúblicos"),
    "interiorismo": ("#Interiorismo", "#DiseñoDeInteriores"),
    "remodelacion": ("#Remodelación", "#Fachadas", "#Renovación"),
    "infraestructura": ("#Infraestructura", "#DiseñoTécnico"),
}

HASHTAGS_AMBIENTE = {
    "fachada": ("#Fachadas", "#DiseñoDeFachadas"),
    "patio_interior": ("#PatioInterior", "#ArquitecturaBioclimática"),
    "patio": ("#Patios",),
    "terraza": ("#Terrazas", "#ZonaSocial"),
    "sala_comedor": ("#EspaciosIntegrados", "#DiseñoInterior"),
    "comedor": ("#Comedores", "#DiseñoInterior"),
    "cocina": ("#DiseñoDeCocinas", "#Cocinas"),
    "sala": ("#SalasModernas", "#DiseñoInterior"),
    "habitacion": ("#Habitaciones", "#DiseñoInterior"),
    "bano": ("#DiseñoDeBaños",),
    "closet": ("#Vestier", "#DiseñoInterior"),
    "acceso": ("#Lobby",),
    "zona_social": ("#ZonaSocial",),
    "plano_tecnico": ("#PlanosArquitectónicos", "#PlantaArquitectónica"),
}

# Se comparan contra la ubicacion normalizada (sin tildes, en minusculas).
CIUDADES = {
    "tibu": "#Tibú",
    "cucuta": "#Cúcuta",
    "norte de santander": "#NorteDeSantander",
    "gabarra": "#LaGabarra",
    "petrolea": "#Petrolea",
    "bucaramanga": "#Bucaramanga",
    "bogota": "#Bogotá",
}

MENUDAS = {"de", "del", "la", "los", "las", "y", "e", "en", "con",
           "para", "por", "un", "una", "al", "a"}

# Siglas y nombres propios que deben conservar sus mayusculas.
SIGLAS = {"cyma", "cymarq", "eds", "bbq", "led", "3d", "tv"}


def titulo_bonito(texto: str) -> str:
    """Capitalizacion tipo titulo, respetando siglas y palabras menores."""
    palabras = re.split(r"(\s+)", texto.strip().lower())
    salida = []
    primera = True
    for p in palabras:
        if not p.strip():
            salida.append(p)
            continue
        limpio = p.strip(".,:;-")
        if limpio in SIGLAS:
            salida.append(p.upper())
        elif not primera and limpio in MENUDAS:
            salida.append(p)
        else:
            salida.append(p[0].upper() + p[1:])
        primera = False
    return "".join(salida)


def _frases(texto: str, cuantas: int = 2) -> str:
    """Primeras N oraciones de un parrafo."""
    if not texto:
        return ""
    partes = re.split(r"(?<=[.!?])\s+", texto.strip())
    return " ".join(partes[:cuantas]).strip()


def _ficha_tecnica(perfil: dict[str, Any]) -> list[str]:
    filas = []
    ubicacion = perfil.get("ubicacion", "").strip(" .")
    if ubicacion:
        filas.append(f"Ubicación: {ubicacion}")
    anio = perfil.get("anio", "").strip(" .")
    if anio:
        filas.append(f"Año de diseño: {anio}")
    tipologia = perfil.get("tipologia", "").strip(" .")
    if tipologia:
        filas.append(f"Tipología: {tipologia}")
    estado = perfil.get("estado", "").strip(" .")
    if estado:
        filas.append(f"Estado: {estado}")
    area = perfil.get("area_construida", "").strip(" .")
    if area:
        filas.append(f"Área construida: {area}")
    elif perfil.get("area_lote"):
        filas.append(f"Área del lote: {perfil['area_lote'].strip(' .')}")
    return filas


def construir_hashtags(
    perfil: dict[str, Any],
    ambiente: str,
    limite: int,
) -> list[str]:
    # El orden importa: al recortar al limite se pierden los ultimos, asi que
    # marca, tema, ambiente y lugar van antes que los genericos de relleno.
    etiquetas: list[str] = list(HASHTAGS_MARCA)

    for tema in perfil.get("temas", []):
        etiquetas.extend(HASHTAGS_TEMA.get(tema, ()))

    etiquetas.extend(HASHTAGS_AMBIENTE.get(ambiente, ()))

    ubicacion = normalizar(perfil.get("ubicacion", ""))
    etiquetas.extend(tag for clave, tag in CIUDADES.items() if clave in ubicacion)
    etiquetas.append("#Colombia")

    etiquetas.extend(HASHTAGS_BASE)

    vistos, salida = set(), []
    for tag in etiquetas:
        clave = tag.lower()
        if clave not in vistos:
            vistos.add(clave)
            salida.append(tag)
    return salida[:max(1, limite)]


def _servicios_linea(perfil: dict[str, Any]) -> str:
    servicios = [s.strip(" .") for s in perfil.get("servicios", []) if s.strip()]
    if not servicios:
        return "Diseño arquitectónico · Renders y visualización 3D · Construcción"
    return " · ".join(s[0].upper() + s[1:] for s in servicios[:4])


def _principio(perfil: dict[str, Any], variante: int) -> str:
    fuente = perfil.get("principios") or perfil.get("sensaciones") or []
    fuente = [p.strip(" .") for p in fuente if 4 < len(p.strip()) < 80]
    if not fuente:
        return ""
    return fuente[variante % len(fuente)]


def redactar(
    perfil: dict[str, Any],
    item: dict[str, Any],
    cfg: dict[str, Any],
    variante: int = 0,
) -> dict[str, Any]:
    """Genera titulo, textos, hashtags y CTA para una propuesta."""
    nombre = perfil.get("nombre") or titulo_bonito(perfil.get("carpeta", ""))
    ambiente = item.get("ambiente", "general")
    etiqueta = ETIQUETAS_AMBIENTE.get(ambiente, "Vista del proyecto")

    aperturas = APERTURAS.get(ambiente) or APERTURAS["general"]
    apertura = aperturas[variante % len(aperturas)].format(nombre=nombre)

    cuerpo = _frases(perfil.get("descripcion") or perfil.get("descripcion_corta"), 2)
    principio = _principio(perfil, variante)
    ficha = _ficha_tecnica(perfil)
    servicios = _servicios_linea(perfil)

    whatsapp = cfg.get("whatsapp", "")
    correo = cfg.get("correo", "")
    cta = LLAMADAS_ACCION[variante % len(LLAMADAS_ACCION)].format(
        whatsapp=whatsapp, correo=correo
    )

    hashtags = construir_hashtags(
        perfil, ambiente, int(cfg.get("numero_hashtags", 18))
    )
    hashtags_fb = hashtags[: int(cfg.get("numero_hashtags_facebook", 6))]

    titulo = f"{nombre} · {etiqueta}"

    # ---- Instagram -----------------------------------------------------
    bloques_ig = [apertura]
    if cuerpo:
        bloques_ig.append(cuerpo)
    if principio:
        bloques_ig.append(f"Criterio de diseño: {principio.lower()}.")
    if ficha:
        bloques_ig.append("\n".join(f"• {f}" for f in ficha))
    bloques_ig.append(f"Servicios CYMARQ: {servicios}.")
    bloques_ig.append(cta)
    bloques_ig.append(" ".join(hashtags))
    texto_instagram = "\n\n".join(b for b in bloques_ig if b).strip()

    # ---- Facebook ------------------------------------------------------
    cierre = CIERRES_FACEBOOK[variante % len(CIERRES_FACEBOOK)]
    bloques_fb = [f"{titulo}", apertura]
    if cuerpo:
        bloques_fb.append(cuerpo)
    if perfil.get("materialidad"):
        materiales = ", ".join(
            m.strip(" .").lower() for m in perfil["materialidad"][:4]
        )
        bloques_fb.append(f"Materialidad principal: {materiales}.")
    if ficha:
        bloques_fb.append("\n".join(f"- {f}" for f in ficha))
    bloques_fb.append(f"Servicios desarrollados: {servicios}.")
    if perfil.get("enlace_video"):
        bloques_fb.append(f"Recorrido en video: {perfil['enlace_video']}")
    bloques_fb.append(cierre)
    bloques_fb.append(cta)
    if cfg.get("sitio_web"):
        bloques_fb.append(f"Mas proyectos en {cfg['sitio_web']}")
    bloques_fb.append(" ".join(hashtags_fb))
    texto_facebook = "\n\n".join(b for b in bloques_fb if b).strip()

    return {
        "titulo": titulo,
        "ambiente": ambiente,
        "etiqueta_ambiente": etiqueta,
        "texto_instagram": texto_instagram,
        "texto_facebook": texto_facebook,
        "hashtags": hashtags,
        "hashtags_facebook": hashtags_fb,
        "llamada_a_la_accion": cta,
        "variante": variante,
    }
