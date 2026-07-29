"""Reglas de clasificacion del material encontrado en PROYECTOS.

Decide, para cada archivo: que tipo de material es, si sirve para redes
sociales, con que prioridad, y que ambiente arquitectonico muestra.

Ninguna funcion de este modulo escribe en disco.
"""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path

# --- Extensiones ---------------------------------------------------------

EXT_IMAGEN = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}
EXT_VIDEO = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
EXT_DOCUMENTO = {".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt"}
EXT_HOJA_CALCULO = {".xlsx", ".xls", ".csv", ".ods"}
EXT_PRESENTACION = {".pptx", ".ppt", ".odp", ".key"}
EXT_VECTORIAL = {".svg", ".ai", ".eps", ".cdr"}
EXT_CAD = {".dwg", ".dxf", ".rvt", ".skp", ".3dm", ".max"}

# --- Palabras que marcan material sensible o interno ---------------------

# Se comparan como palabras completas (ver `es_confidencial`), para que
# "PATIO INTERNO" no quede marcado por la palabra "interno".
PALABRAS_CONFIDENCIALES = (
    "presupuesto", "presupuestos", "cotizacion", "cotizaciones",
    "contrato", "contratos", "factura", "facturas", "nomina",
    "recibo", "recibos", "cedula", "rut", "certificado", "poliza",
    "confidencial", "privado", "borrador", "acta", "actas",
    "honorarios", "escritura", "predial", "impuesto", "impuestos",
    "credito", "pagare", "anticipo", "desembolso",
)

# Expresiones de varias palabras que tambien marcan material sensible.
FRASES_CONFIDENCIALES = (
    "camara de comercio", "propuesta economica", "datos personales",
    "uso interno", "documento interno", "informacion personal",
    "cuenta bancaria", "estado de cuenta",
)

# Carpetas cuyo contenido nunca se publica automaticamente.
CARPETAS_NO_PUBLICABLES = ("04 documentos", "documentos", "administrativo")

# --- Ambientes arquitectonicos detectados por nombre de archivo ----------
# (patron, etiqueta, descripcion usada por el generador de copy)

AMBIENTES: tuple[tuple[str, str, str], ...] = (
    (r"\bfachada|\bexterior|\bfrontal|\bvista\b", "fachada",
     "la fachada"),
    (r"\bpatio interior|\bpatio interno|\bjardin interior|\bjardín interior",
     "patio_interior", "el patio interior"),
    (r"\bpatio", "patio", "el patio"),
    (r"\bazotea|\bterraza|\bmirador|\bsolarium|\bsolárium", "terraza",
     "la terraza"),
    (r"\bsala comedor|\bcomedor cocina|\bcomerdor", "sala_comedor",
     "el area social integrada"),
    (r"\bcomedor", "comedor", "el comedor"),
    (r"\bcocina", "cocina", "la cocina"),
    (r"\bsala|\bliving", "sala", "la sala"),
    (r"\bhabitac|\bhabitc|\balcoba|\bdormitorio|\brecamara|\brecámara",
     "habitacion", "la habitacion"),
    (r"\bbano|\bbaño|\bsanitario", "bano", "el bano"),
    (r"\bcloset|\bvestier|\bwalk", "closet", "el vestier"),
    (r"\bescalera|\bhall|\bacceso|\blobby|\brecepcion|\brecepción", "acceso",
     "el acceso"),
    (r"\bgimnasio|\bbbq|\bpiscina|\bjacuzzi", "zona_social",
     "la zona social"),
    (r"\bplanta|\bcorte|\bimplantacion|\bimplantación|\bubicacion|\bubicación|"
     r"\bdetalle|\bestructural|\ba-\d", "plano_tecnico", "el plano"),
    (r"\brender|\bphoto|\bfoto|\bimagen", "render_general",
     "una de las vistas"),
)

# --- Tipos y prioridad para redes ----------------------------------------
# prioridad: 1 = lo mejor para publicar. 99 = no usar.

PRIORIDAD = {
    "render": 1,
    "fotografia": 2,
    "imagen_final": 3,
    "detalle": 4,
    "plano_visual": 5,
    "corporativo": 6,
    "logo": 20,
    "video": 30,
    "plano_tecnico": 90,
    "documento": 99,
    "presentacion": 99,
    "hoja_calculo": 99,
    "enlace_video": 99,
    "qr": 99,
    "informacion_corporativa": 99,
    "cad": 99,
    "otro": 99,
}


def normalizar(texto: str) -> str:
    """Minusculas sin tildes, para comparaciones robustas."""
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return texto.lower().strip()


_RX_CONFIDENCIAL = re.compile(
    r"\b(?:" + "|".join(PALABRAS_CONFIDENCIALES) + r")\b"
)


def es_confidencial(ruta_relativa: str) -> bool:
    """Palabra completa o frase reservada dentro de la ruta."""
    texto = normalizar(ruta_relativa)
    if _RX_CONFIDENCIAL.search(texto):
        return True
    return any(f in texto for f in FRASES_CONFIDENCIALES)


def detectar_ambiente(nombre_archivo: str) -> tuple[str, str]:
    """Devuelve (etiqueta_ambiente, frase_descriptiva) segun el nombre."""
    texto = normalizar(Path(nombre_archivo).stem)
    # separadores -> espacios, para que \b funcione con "R_1 - Photo"
    texto = re.sub(r"[_\-.]+", " ", texto)
    for patron, etiqueta, frase in AMBIENTES:
        if re.search(patron, texto):
            return etiqueta, frase
    return "general", "este espacio"


def clasificar(ruta: Path, raiz_proyectos: Path) -> dict:
    """Clasifica un archivo del arbol PROYECTOS.

    Devuelve un dict con: tipo, extension, categoria_carpeta, apto_publicacion,
    prioridad, uso_redes, ambiente, motivo.
    """
    rel = ruta.relative_to(raiz_proyectos)
    rel_txt = rel.as_posix()
    ext = ruta.suffix.lower()
    partes = [normalizar(p) for p in rel.parts]
    carpeta_padre = partes[-2] if len(partes) >= 2 else ""
    nombre = normalizar(ruta.name)

    ambiente, frase = detectar_ambiente(ruta.name)

    def resultado(tipo: str, apto: bool, uso: str, motivo: str = "") -> dict:
        return {
            "tipo": tipo,
            "extension": ext,
            "categoria_carpeta": carpeta_padre,
            "apto_publicacion": apto,
            "prioridad": PRIORIDAD.get(tipo, 99),
            "uso_redes": uso,
            "ambiente": ambiente,
            "frase_ambiente": frase,
            "motivo": motivo,
        }

    # 1. Material sensible: fuera, sin importar el formato.
    #    Excepcion: una imagen dentro de una carpeta RENDERS es, por
    #    definicion, material de presentacion; no se veta por su nombre.
    es_render = ext in EXT_IMAGEN and "render" in carpeta_padre
    if not es_render and es_confidencial(rel_txt):
        return resultado(
            "documento", False, "No usar - posible informacion sensible",
            "Coincide con palabras reservadas (presupuestos, contratos, datos)",
        )

    # 2. Recursos corporativos identificados por carpeta raiz.
    raiz_rel = partes[0] if partes else ""

    if raiz_rel.startswith("logo"):
        if ext in EXT_VIDEO:
            return resultado("video", False, "Recurso de marca - video de logo",
                             "Video institucional, no es contenido de portafolio")
        return resultado("logo", False, "Recurso de marca - marca de agua / perfil",
                         "El logo acompana publicaciones, no es la publicacion")

    if raiz_rel.startswith("codigos qr"):
        return resultado("qr", False, "No usar automaticamente - codigo QR",
                         "Los QR se usan en piezas impresas, no como post")

    if raiz_rel.startswith("brochure"):
        tipo = "corporativo" if ext in EXT_IMAGEN else "presentacion"
        apto = ext in EXT_IMAGEN
        return resultado(tipo, apto,
                         "Material corporativo - campanas de marca" if apto
                         else "Material corporativo - solo consulta")

    if raiz_rel.startswith(("empresa", "servicios", "redes")):
        return resultado("informacion_corporativa", False,
                         "Fuente de datos de marca (no publicable directamente)",
                         "Se usa como insumo para redactar textos")

    if raiz_rel.startswith("portafolio"):
        return resultado("presentacion", False,
                         "Portafolio corporativo - solo consulta")

    # 3. Material dentro de un proyecto.
    if ext in EXT_IMAGEN:
        if "render" in carpeta_padre:
            tipo = "render"
            uso = f"Publicacion principal - render de {frase}"
            return resultado(tipo, True, uso)
        if "plano" in carpeta_padre:
            return resultado("plano_visual", True,
                             "Publicacion secundaria - plano con valor visual",
                             "Requiere usar_planos=true en config.json")
        if any(c in carpeta_padre for c in CARPETAS_NO_PUBLICABLES):
            return resultado("documento", False,
                             "No usar - imagen dentro de documentos")
        if "foto" in carpeta_padre or "obra" in carpeta_padre:
            return resultado("fotografia", True,
                             "Publicacion principal - fotografia de obra")
        return resultado("imagen_final", True,
                         f"Publicacion - imagen de {frase}")

    if ext in EXT_VIDEO:
        return resultado("video", True, "Reel / video (requiere usar_videos)")

    if ext == ".txt" and "video" in carpeta_padre:
        return resultado("enlace_video", False,
                         "Enlace a video externo (YouTube) para descripcion")

    if ext in EXT_PRESENTACION:
        return resultado("presentacion", False, "Solo consulta interna")

    if ext in EXT_HOJA_CALCULO:
        return resultado("hoja_calculo", False, "Solo consulta interna")

    if ext in EXT_CAD:
        return resultado("cad", False, "Archivo tecnico - no publicable")

    if ext in EXT_VECTORIAL:
        return resultado("logo", False, "Recurso grafico de marca")

    if ext in EXT_DOCUMENTO:
        if "plano" in carpeta_padre:
            return resultado("plano_tecnico", False,
                             "Plano tecnico en PDF - no publicable directamente")
        if nombre.startswith("proyecto"):
            return resultado("informacion_corporativa", False,
                             "Ficha del proyecto - insumo para redactar textos")
        return resultado("documento", False, "Documento del proyecto")

    return resultado("otro", False, "Sin clasificar")
