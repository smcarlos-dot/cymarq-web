"""Extraccion de perfiles de proyecto desde los PROYECTO.docx.

Lee (nunca escribe) los .docx de cada proyecto y arma una ficha estructurada
que alimenta al redactor de textos. El resultado se guarda en
CONFIG/perfiles_proyectos.json, que queda editable a mano: si un texto
generado no convence, se corrige la ficha y todas las publicaciones futuras
mejoran.
"""

from __future__ import annotations

import html
import re
import unicodedata
import zipfile
from pathlib import Path

from . import rutas, seguridad
from .clasificacion import normalizar
from .redaccion import titulo_bonito

# --- Lectura de .docx sin dependencias externas --------------------------


def texto_docx(ruta: Path) -> str:
    """Extrae el texto plano de un .docx. Devuelve '' si no se puede leer."""
    try:
        with zipfile.ZipFile(ruta) as z:
            xml = z.read("word/document.xml").decode("utf-8", "ignore")
    except (zipfile.BadZipFile, KeyError, OSError):
        return ""

    xml = re.sub(r"<w:tab[^>]*/>", " ", xml)
    xml = re.sub(r"</w:p>", "\n", xml)
    xml = re.sub(r"<w:br[^>]*/>", "\n", xml)
    xml = re.sub(r"<[^>]+>", "", xml)
    return html.unescape(xml)


def _lineas(texto: str) -> list[str]:
    return [ln.strip() for ln in texto.splitlines() if ln.strip()]


# --- Estructura del documento -------------------------------------------

ENCABEZADOS = (
    "informacion general",
    "servicios desarrollados por cymarq",
    "descripcion del proyecto",
    "concepto de diseno",
    "concepto arquitectonico",
    "programa arquitectonico",
    "objetivos del proyecto",
    "caracteristicas del proyecto",
    "caracteristicas del diseno",
    "sensaciones y experiencia espacial",
    "materialidad",
    "materialidad y elementos constructivos",
    "criterios de diseno",
    "sistema constructivo",
    "diseno tecnico y de infraestructura",
    "alcance del diseno",
    "alcance profesional",
    "areas del proyecto",
    "por que este proyecto representa a cymarq",
    "texto corto para pagina web",
)

CAMPOS = (
    ("nombre", r"nombre del proyecto"),
    ("ubicacion", r"ubicacion"),
    ("anio", r"ano(?: de diseno)?"),
    ("estado", r"estado"),
    ("tipologia", r"tipologia"),
    ("area_lote", r"(?:area|dimensiones) del lote"),
    ("area_construida", r"area construida(?: estimada| total| aproximada)?"),
)

_ETIQUETAS = "|".join(p for _, p in CAMPOS) + r"|servicios desarrollados"


def _secciones(lineas: list[str]) -> dict[str, list[str]]:
    """Agrupa las lineas del documento por encabezado."""
    actual = "_inicio"
    salida: dict[str, list[str]] = {actual: []}
    for linea in lineas:
        clave = normalizar(linea).strip("¿?:.").strip()
        if clave in ENCABEZADOS:
            actual = clave
            salida.setdefault(actual, [])
            continue
        salida.setdefault(actual, []).append(linea)
    return salida


def _sin_tildes_alineado(texto: str) -> str:
    """Version sin tildes y en minusculas con EXACTAMENTE la misma longitud.

    Permite buscar sobre el texto normalizado y recortar sobre el original
    usando los mismos indices.
    """
    salida = []
    for ch in texto:
        desc = unicodedata.normalize("NFKD", ch)
        desc = "".join(c for c in desc if not unicodedata.combining(c))
        salida.append(desc[0].lower() if desc else ch.lower())
    return "".join(salida)


def _campo(texto_plano: str, patron: str) -> str:
    """Extrae 'Etiqueta: valor', incluso si varios campos van pegados."""
    rx = re.compile(
        rf"\b(?:{patron})\s*:\s*(.*?)(?=\b(?:{_ETIQUETAS})\s*:|$)",
        re.IGNORECASE | re.DOTALL,
    )
    # Localizamos sobre el texto sin tildes y recortamos sobre el original.
    plano_norm = _sin_tildes_alineado(texto_plano)
    m = rx.search(plano_norm)
    if not m:
        return ""
    ini, fin = m.span(1)
    valor = texto_plano[ini:fin]
    valor = valor.split("\n")[0].strip(" .;")
    return re.sub(r"\s+", " ", valor).strip()


def _vinetas(lineas: list[str], maximo: int = 12) -> list[str]:
    """Lineas cortas tipo lista (las fichas usan una idea por parrafo)."""
    salida = []
    for ln in lineas:
        limpio = ln.strip(" .-•·\t")
        if 3 < len(limpio) <= 90 and not limpio.endswith(":"):
            salida.append(limpio)
        if len(salida) >= maximo:
            break
    return salida


def _parrafos(lineas: list[str], minimo_largo: int = 120) -> list[str]:
    return [ln for ln in lineas if len(ln) >= minimo_largo]


# --- Construccion del perfil --------------------------------------------


def perfil_de_proyecto(carpeta: Path) -> dict:
    """Arma la ficha de un proyecto a partir de su carpeta."""
    codigo = ""
    m = re.match(r"^(\d{1,2})\s+", carpeta.name)
    if m:
        codigo = m.group(1)

    perfil = {
        "id": normalizar(carpeta.name).replace(" ", "_"),
        "codigo": codigo,
        "carpeta": carpeta.name,
        "nombre": titulo_bonito(re.sub(r"^\d{1,2}\s+", "", carpeta.name)),
        "ubicacion": "",
        "anio": "",
        "estado": "",
        "tipologia": "",
        "area_lote": "",
        "area_construida": "",
        "servicios": [],
        "descripcion": "",
        "descripcion_corta": "",
        "principios": [],
        "sensaciones": [],
        "materialidad": [],
        "enlace_video": "",
        "temas": [],
        "editado_a_mano": False,
    }

    docx = carpeta / "PROYECTO.docx"
    if docx.is_file():
        crudo = texto_docx(docx)
        lineas = _lineas(crudo)
        if lineas:
            titulo = re.sub(r"^\d{1,2}\s+", "", lineas[0]).strip()
            if 3 < len(titulo) < 80:
                perfil["nombre"] = titulo_bonito(titulo)

        plano = "\n".join(lineas)
        for clave, patron in CAMPOS:
            valor = _campo(plano, patron)
            if valor:
                perfil[clave] = valor

        secciones = _secciones(lineas)

        perfil["servicios"] = _vinetas(
            secciones.get("servicios desarrollados por cymarq", []), 8
        )

        desc = _parrafos(secciones.get("descripcion del proyecto", []))
        if not desc:
            desc = _parrafos(secciones.get("_inicio", []))
        if desc:
            perfil["descripcion"] = " ".join(desc[:2])
            perfil["descripcion_corta"] = desc[0]

        principios = (
            secciones.get("concepto de diseno")
            or secciones.get("concepto arquitectonico")
            or []
        )
        perfil["principios"] = _vinetas(principios, 6)

        perfil["sensaciones"] = _vinetas(
            secciones.get("sensaciones y experiencia espacial", []), 8
        )
        perfil["materialidad"] = _vinetas(
            secciones.get("materialidad")
            or secciones.get("materialidad y elementos constructivos")
            or [],
            8,
        )

    enlace = carpeta / "03 VIDEOS" / "LINK VIDEO.txt"
    if enlace.is_file():
        try:
            texto = enlace.read_text(encoding="utf-8", errors="ignore").strip()
            if texto.startswith("http"):
                perfil["enlace_video"] = texto.split()[0]
        except OSError:
            pass

    perfil["temas"] = _temas(perfil)
    return perfil


# Las claves se buscan como subcadena, asi que deben ser lo bastante
# especificas: "publico" solo apareceria por "atencion al publico" y
# etiquetaria como obra publica una ferreteria.
TEMAS_CLAVE = (
    ("vivienda", ("vivienda", "casa", "residencial", "unifamiliar", "hogar",
                  "apartamento")),
    ("comercial", ("comercial", "ferreteria", "restaurante", "local",
                   "tienda", "estacion de servicio")),
    ("uso_mixto", ("uso mixto", "multifamiliar", "edificio")),
    ("espacio_publico", ("parque", "espacio publico", "urbanismo",
                         "recreativo", "inclusivo", "plazoleta",
                         "recreo-deportivo")),
    ("institucional", ("obra publica", "entidad publica", "alcaldia",
                       "institucional")),
    ("interiorismo", ("diseno interior", "interiorismo",
                      "diseno de interiores")),
    ("remodelacion", ("remodelacion", "renovacion", "modernizacion")),
    ("infraestructura", ("estacion de servicio", "infraestructura")),
)


def _temas(perfil: dict) -> list[str]:
    """Etiquetas tematicas del proyecto, por palabra completa.

    La comparacion es por palabra: sin esto, "parqueaderos" marcaria una
    estacion de servicio como espacio publico.
    """
    base = normalizar(
        " ".join([
            perfil.get("nombre", ""),
            perfil.get("tipologia", ""),
            perfil.get("descripcion_corta", ""),
            perfil.get("carpeta", ""),
        ])
    )
    salida = []
    for etiqueta, claves in TEMAS_CLAVE:
        patron = r"\b(?:" + "|".join(re.escape(c) for c in claves) + r")\w{0,2}\b"
        if re.search(patron, base):
            salida.append(etiqueta)
    return salida


def es_carpeta_de_proyecto(carpeta: Path) -> bool:
    """Un proyecto es una carpeta numerada dentro de PROYECTOS."""
    return carpeta.is_dir() and bool(re.match(r"^\d{1,2}\s+\S", carpeta.name))


def construir_perfiles(forzar: bool = False) -> dict[str, dict]:
    """Genera (o actualiza) CONFIG/perfiles_proyectos.json.

    Respeta las fichas marcadas con "editado_a_mano": true.
    """
    existentes: dict[str, dict] = seguridad.leer_json(
        rutas.ARCHIVO_PERFILES, por_defecto={}
    ) or {}

    perfiles: dict[str, dict] = {}
    for carpeta in sorted(rutas.PROYECTOS.iterdir()):
        if not es_carpeta_de_proyecto(carpeta):
            continue
        previo = existentes.get(carpeta.name)
        if previo and previo.get("editado_a_mano") and not forzar:
            perfiles[carpeta.name] = previo
            continue
        perfiles[carpeta.name] = perfil_de_proyecto(carpeta)

    seguridad.escribir_json(rutas.ARCHIVO_PERFILES, perfiles)
    return perfiles


def cargar_perfiles() -> dict[str, dict]:
    perfiles = seguridad.leer_json(rutas.ARCHIVO_PERFILES, por_defecto=None)
    if not perfiles:
        perfiles = construir_perfiles()
    return perfiles
