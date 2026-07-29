"""Catalogo de imagenes publicas para redes sociales.

SEPARACION DELIBERADA, es el punto central de este modulo:

  INVENTARIO LOCAL   -> todo lo que hay en PROYECTOS/. Privado. Nunca sale.
  CATALOGO SOCIAL    -> solo las imagenes EXPRESAMENTE incorporadas para
                        publicar. Son las unicas que acaban siendo
                        accesibles por URL publica.

Estar en PROYECTOS no autoriza nada. La autorizacion la da que el sistema
haya seleccionado esa imagen para una publicacion concreta, es decir, que
aparezca en el historial. `origenes_autorizados()` es la unica puerta de
entrada al catalogo, y solo mira el historial.

PROYECTOS es SOLO LECTURA. Ademas, cuando existe la copia que el generador
dejo en PENDIENTES/, se lee esa copia y no el original.

Nada de este modulo publica en redes ni hace commits. Solo genera archivos
JPEG en `09 WEB/public/social/` y mantiene el manifiesto.
"""

from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from PIL import Image

from . import historial, rutas, seguridad

# --------------------------------------------------------------------- #
# Ubicaciones                                                            #
# --------------------------------------------------------------------- #


def repo_web() -> Path:
    """Localiza el repositorio `09 WEB`, este dentro o al lado de este sistema.

    Tolera las dos disposiciones para que integrar CYMARQ_SOCIAL en el
    repositorio no rompa nada.
    """
    hermana = rutas.RAIZ.parent / "09 WEB"
    if (hermana / "public").is_dir():
        return hermana
    if (rutas.RAIZ.parent / "public").is_dir():  # ya integrado dentro del repo
        return rutas.RAIZ.parent
    return hermana


def carpeta_social() -> Path:
    return repo_web() / "public" / "social"


#: Base publica. Debe coincidir con el dominio que sirve Cloudflare Pages.
BASE_URL = "https://www.cymarq.com.co/social/"

ARCHIVO_MANIFIESTO = rutas.CONFIG / "imagenes_publicas.json"

# --------------------------------------------------------------------- #
# Reglas de imagen (las de Instagram, que son las estrictas)             #
# --------------------------------------------------------------------- #

ANCHO_MAX = 1440
ANCHO_MIN = 320
RATIO_MIN = 0.8   # 4:5
RATIO_MAX = 1.91  # 1.91:1
PESO_MAX = 8 * 1024 * 1024
CALIDAD = 88

FORMATOS_ORIGEN = {".jpg", ".jpeg", ".png", ".webp"}


class CatalogoError(RuntimeError):
    """Problema al preparar el catalogo."""


# --------------------------------------------------------------------- #
# Nombres deterministas                                                  #
# --------------------------------------------------------------------- #


def slug(texto: str) -> str:
    """Convierte un texto a un fragmento de URL seguro y estable.

    Sin acentos, sin espacios, sin mayusculas y sin nada que obligue a
    codificar la URL: Meta descarga la imagen con cURL y una URL con
    caracteres raros es una fuente de fallos evitable.
    """
    base = unicodedata.normalize("NFKD", str(texto))
    base = base.encode("ascii", "ignore").decode("ascii").lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return re.sub(r"-{2,}", "-", base) or "imagen"


def nombre_destino(registro: dict[str, Any]) -> str:
    """Nombre de archivo determinista para una imagen del historial.

    Lleva el `id_archivo` (huella del original) como sufijo: dos renders con
    el mismo nombre en proyectos distintos no pueden colisionar, y el mismo
    original siempre produce el mismo nombre.
    """
    proyecto = slug(registro.get("proyecto_nombre") or registro.get("proyecto") or "proyecto")
    archivo = slug(Path(registro.get("archivo", "imagen")).stem)
    huella = (registro.get("id_archivo") or "")[:8] or "00000000"
    return f"{proyecto}-{archivo}-{huella}.jpg"


# --------------------------------------------------------------------- #
# Manifiesto                                                             #
# --------------------------------------------------------------------- #

_MANIFIESTO_VACIO: dict[str, Any] = {
    "version": 1,
    "actualizado": "",
    "nota": (
        "Catalogo de imagenes publicas de CYMARQ. Solo contiene material "
        "incorporado expresamente para publicaciones sociales. No es el "
        "inventario de PROYECTOS."
    ),
    "base_url": BASE_URL,
    "imagenes": {},
}


def cargar_manifiesto() -> dict[str, Any]:
    datos = seguridad.leer_json(ARCHIVO_MANIFIESTO, por_defecto=None)
    if not datos or "imagenes" not in datos:
        return json.loads(json.dumps(_MANIFIESTO_VACIO))
    return datos


def guardar_manifiesto(datos: dict[str, Any]) -> None:
    from datetime import datetime

    datos["actualizado"] = datetime.now().astimezone().isoformat(timespec="seconds")
    datos["base_url"] = BASE_URL
    seguridad.escribir_json(ARCHIVO_MANIFIESTO, datos)


def url_publica(id_archivo: str) -> str | None:
    """URL publica registrada para un id_archivo, o None si no esta en el catalogo."""
    entrada = cargar_manifiesto().get("imagenes", {}).get(id_archivo)
    if not entrada:
        return None
    return entrada.get("url") or None


# --------------------------------------------------------------------- #
# Conjunto autorizado                                                    #
# --------------------------------------------------------------------- #


def origenes_autorizados() -> list[dict[str, Any]]:
    """Imagenes autorizadas para el catalogo publico.

    UNICA puerta de entrada. Solo entra lo que el sistema ya selecciono para
    una publicacion (cualquier estado que ocupe la imagen: propuesta,
    aprobada o publicada). Lo rechazado y lo nunca elegido NO entra.
    """
    vistos: set[str] = set()
    autorizados: list[dict[str, Any]] = []
    for pub in historial.cargar().get("publicaciones", []):
        if pub.get("estado") not in historial.ESTADOS_QUE_OCUPAN:
            continue
        id_archivo = pub.get("id_archivo") or ""
        if not id_archivo or id_archivo in vistos:
            continue
        vistos.add(id_archivo)
        autorizados.append(pub)
    return autorizados


def _ruta_origen(registro: dict[str, Any]) -> Path:
    """Archivo del que se genera el derivado.

    Se prefiere la copia que ya vive en PENDIENTES: asi ni siquiera se abre
    el original de PROYECTOS. Si no existe, se lee el original en modo
    lectura, sin escribir jamas en esa carpeta.
    """
    copia = registro.get("copia_local") or ""
    if copia:
        ruta = (rutas.RAIZ / copia).resolve()
        if ruta.is_file():
            return ruta

    original = registro.get("ruta_original") or ""
    if original:
        ruta = (rutas.RAIZ / original).resolve()
        if ruta.is_file():
            return ruta

    raise CatalogoError(f"No se encuentra el archivo de origen de {registro.get('id')}.")


# --------------------------------------------------------------------- #
# Generacion                                                             #
# --------------------------------------------------------------------- #


@dataclass
class ResultadoImagen:
    id_publicacion: str
    id_archivo: str
    nombre: str = ""
    url: str = ""
    accion: str = ""        # generada | reutilizada | conflicto | rechazada | error
    detalle: str = ""
    ancho: int = 0
    alto: int = 0
    peso: int = 0
    avisos: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.accion in ("generada", "reutilizada")


def _huella(ruta: Path) -> str:
    return hashlib.sha256(ruta.read_bytes()).hexdigest()


def _preparar_bytes(origen: Path, destino: Path) -> tuple[int, int]:
    """Escribe el derivado JPEG. Devuelve (ancho, alto). No toca el origen."""
    antes = (origen.stat().st_size, origen.stat().st_mtime_ns)

    with Image.open(origen) as im:
        ancho, alto = im.size
        ratio = ancho / alto if alto else 0
        if not (RATIO_MIN <= ratio <= RATIO_MAX):
            raise CatalogoError(
                f"Relacion de aspecto {ratio:.4f} fuera del rango "
                f"{RATIO_MIN}-{RATIO_MAX} admitido por Instagram."
            )

        # sRGB de 8 bits. Sin perfil ICC incrustado, que es como Meta lo
        # interpreta por defecto.
        if im.mode != "RGB":
            im = im.convert("RGB")

        if ancho > ANCHO_MAX:
            nuevo_alto = round(alto * ANCHO_MAX / ancho)
            im = im.resize((ANCHO_MAX, nuevo_alto), Image.LANCZOS)

        if im.size[0] < ANCHO_MIN:
            raise CatalogoError(f"Ancho {im.size[0]} px por debajo del minimo {ANCHO_MIN}.")

        destino.parent.mkdir(parents=True, exist_ok=True)
        # exif=b"" descarta cualquier metadato del original (incluido GPS).
        im.save(destino, format="JPEG", quality=CALIDAD, optimize=True,
                progressive=True, subsampling="4:2:0", exif=b"")
        medidas = im.size

    despues = (origen.stat().st_size, origen.stat().st_mtime_ns)
    if antes != despues:
        raise CatalogoError(f"ABORTADO: el archivo de origen cambio durante la lectura: {origen}")

    peso = destino.stat().st_size
    if peso > PESO_MAX:
        destino.unlink(missing_ok=True)
        raise CatalogoError(f"El derivado pesa {peso} bytes, por encima del maximo {PESO_MAX}.")

    return medidas


def preparar_imagen(
    registro: dict[str, Any],
    manifiesto: dict[str, Any],
    forzar: bool = False,
    simular: bool = False,
) -> ResultadoImagen:
    """Genera (o reutiliza) el derivado publico de una imagen autorizada."""
    id_archivo = registro.get("id_archivo") or ""
    res = ResultadoImagen(id_publicacion=registro.get("id", ""), id_archivo=id_archivo)

    entrada = manifiesto["imagenes"].get(id_archivo)

    # 1) Ya esta en el catalogo y el archivo sigue ahi: se reutiliza.
    if entrada and not forzar:
        destino = carpeta_social() / entrada["nombre"]
        if destino.is_file():
            res.nombre = entrada["nombre"]
            res.url = entrada["url"]
            res.accion = "reutilizada"
            res.detalle = "Ya estaba en el catalogo."
            res.peso = destino.stat().st_size
            with Image.open(destino) as im:
                res.ancho, res.alto = im.size
            return res

    try:
        origen = _ruta_origen(registro)
    except CatalogoError as exc:
        res.accion = "error"
        res.detalle = str(exc)
        return res

    if origen.suffix.lower() not in FORMATOS_ORIGEN:
        res.accion = "rechazada"
        res.detalle = f"Formato de origen no admitido: {origen.suffix}"
        return res

    # El nombre se conserva si ya existia una entrada, para no invalidar una
    # URL que Meta o el propio historial ya conocen.
    res.nombre = entrada["nombre"] if entrada else nombre_destino(registro)
    res.url = BASE_URL + res.nombre
    destino = carpeta_social() / res.nombre

    if simular:
        res.accion = "generada"
        res.detalle = "SIMULACION: no se escribio nada."
        return res

    # 2) Existe un archivo con ese nombre que no esta en el manifiesto o que
    #    podria ser distinto: no se pisa en silencio.
    if destino.is_file() and not entrada and not forzar:
        res.accion = "conflicto"
        res.detalle = (
            f"Ya existe {res.nombre} en public/social/ y no consta en el manifiesto. "
            "No se sobrescribe. Revisalo a mano o usa --forzar."
        )
        return res

    huella_previa = _huella(destino) if destino.is_file() else None

    try:
        res.ancho, res.alto = _preparar_bytes(origen, destino)
    except CatalogoError as exc:
        res.accion = "rechazada"
        res.detalle = str(exc)
        return res
    except OSError as exc:
        res.accion = "error"
        res.detalle = f"No se pudo procesar la imagen: {exc}"
        return res

    res.peso = destino.stat().st_size
    if huella_previa and _huella(destino) != huella_previa:
        res.avisos.append("El archivo publico existente se ha regenerado con contenido distinto.")

    manifiesto["imagenes"][id_archivo] = {
        "nombre": res.nombre,
        "url": res.url,
        "id_publicacion": res.id_publicacion,
        "proyecto": registro.get("proyecto_nombre") or registro.get("proyecto") or "",
        "archivo_origen": registro.get("archivo", ""),
        "ruta_original": registro.get("ruta_original", ""),
        "ancho": res.ancho,
        "alto": res.alto,
        "peso": res.peso,
    }
    res.accion = "generada"
    return res


def adoptar_existente(id_archivo: str, nombre: str) -> ResultadoImagen:
    """Registra en el manifiesto un derivado que YA existe en public/social/.

    Hace falta porque el primer derivado se preparo a mano, antes de existir
    este catalogo, y su URL es la que Meta ya recibio en las publicaciones
    reales. Regenerarlo con otro nombre dejaria el archivo original huerfano y
    crearia un duplicado innecesario.
    """
    res = ResultadoImagen(id_publicacion="", id_archivo=id_archivo, nombre=nombre)
    destino = carpeta_social() / nombre

    if not destino.is_file():
        res.accion = "error"
        res.detalle = f"No existe {destino}"
        return res

    registro = next(
        (r for r in origenes_autorizados() if r.get("id_archivo") == id_archivo), None
    )
    if registro is None:
        res.accion = "rechazada"
        res.detalle = (
            f"El id_archivo {id_archivo} no esta autorizado: no aparece en el historial."
        )
        return res

    with Image.open(destino) as im:
        if im.format != "JPEG":
            res.accion = "rechazada"
            res.detalle = f"El archivo no es JPEG, es {im.format}."
            return res
        res.ancho, res.alto = im.size

    ratio = res.ancho / res.alto if res.alto else 0
    if not (RATIO_MIN <= ratio <= RATIO_MAX) or not (ANCHO_MIN <= res.ancho <= ANCHO_MAX):
        res.accion = "rechazada"
        res.detalle = f"No cumple los limites de Instagram ({res.ancho}x{res.alto}, ratio {ratio:.4f})."
        return res

    res.peso = destino.stat().st_size
    res.url = BASE_URL + nombre
    res.id_publicacion = registro.get("id", "")

    manifiesto = cargar_manifiesto()
    manifiesto["imagenes"][id_archivo] = {
        "nombre": nombre,
        "url": res.url,
        "id_publicacion": res.id_publicacion,
        "proyecto": registro.get("proyecto_nombre") or registro.get("proyecto") or "",
        "archivo_origen": registro.get("archivo", ""),
        "ruta_original": registro.get("ruta_original", ""),
        "ancho": res.ancho,
        "alto": res.alto,
        "peso": res.peso,
        "adoptada": True,
        "nota": "Derivado preparado antes de existir el catalogo. URL ya usada por Meta.",
    }
    guardar_manifiesto(manifiesto)

    res.accion = "reutilizada"
    res.detalle = "Adoptada en el catalogo. No se ha regenerado ni renombrado."
    return res


def preparar_catalogo(forzar: bool = False, simular: bool = False) -> list[ResultadoImagen]:
    """Prepara el derivado de cada imagen autorizada. No publica ni hace commit."""
    manifiesto = cargar_manifiesto()
    resultados = [
        preparar_imagen(reg, manifiesto, forzar=forzar, simular=simular)
        for reg in origenes_autorizados()
    ]
    if not simular and any(r.accion == "generada" for r in resultados):
        guardar_manifiesto(manifiesto)
    return resultados


# --------------------------------------------------------------------- #
# Estado                                                                 #
# --------------------------------------------------------------------- #


def resumen() -> dict[str, Any]:
    """Que hay en el catalogo y que archivos publicos lo respaldan."""
    manifiesto = cargar_manifiesto()
    imagenes = manifiesto.get("imagenes", {})
    carpeta = carpeta_social()

    en_disco = sorted(p.name for p in carpeta.glob("*.jpg")) if carpeta.is_dir() else []
    registrados = {e["nombre"] for e in imagenes.values()}

    return {
        "carpeta": str(carpeta),
        "base_url": manifiesto.get("base_url", BASE_URL),
        "autorizadas": len(origenes_autorizados()),
        "en_manifiesto": len(imagenes),
        "archivos_en_disco": len(en_disco),
        "sin_registrar": sorted(set(en_disco) - registrados),
        "registradas_sin_archivo": sorted(
            e["nombre"] for e in imagenes.values() if not (carpeta / e["nombre"]).is_file()
        ),
        "imagenes": imagenes,
    }
