"""Catalogo de videos publicos para redes sociales.

Hermano de `catalogo_social.py`, con la misma separacion deliberada:

  INVENTARIO LOCAL   -> todo lo que hay en PROYECTOS/. Privado. Nunca sale.
  CATALOGO PUBLICO   -> solo los videos EXPRESAMENTE incorporados para
                        publicar. Los unicos accesibles por URL publica.

POR QUE HACE FALTA UNA URL PUBLICA
----------------------------------
Meta no acepta que le subamos bytes en el flujo que usa este sistema: descarga
el medio ella misma desde una URL, con peticiones de rango. Eso vale igual para
`/media` (Instagram Reels), `/videos` y `/video_reels` (Facebook).

La solucion es la que ya funciona para las imagenes y no anade infraestructura
nueva: el archivo se copia a `09 WEB/public/social/video/`, se versiona, y
Cloudflare Pages lo sirve en `https://www.cymarq.com.co/social/video/`. Sin
servidor propio, sin tuneles, sin tokens en URLs y sin nada que mantener
encendido. La VM solo necesita que el archivo este desplegado, no ser accesible
desde fuera.

DIFERENCIA IMPORTANTE CON LAS IMAGENES
--------------------------------------
Un derivado JPEG se RECODIFICA (reescala, quita EXIF, ajusta calidad). Un video
se COPIA TAL CUAL. Dos razones: recodificar exigiria ffmpeg en la VM, que no
esta y no se quiere; y una segunda pasada de H.264 solo degradaria un archivo
que ya cumple. Aqui se valida y se copia, no se transforma.

El MP4 se inspecciona con un lector de cajas propio (ISO/IEC 14496-12), espejo
del que hay en `09 WEB/lib/social/video.mjs`. Solo biblioteca estandar.

Nada de este modulo publica en redes ni hace commits.
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import struct
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, BinaryIO

from . import catalogo_social, historial, rutas, seguridad

# --------------------------------------------------------------------- #
# Ubicaciones                                                            #
# --------------------------------------------------------------------- #


def carpeta_video() -> Path:
    """Carpeta publica de videos, dentro del repositorio web."""
    return catalogo_social.repo_web() / "public" / "social" / "video"


#: Base publica. Debe coincidir con el dominio que sirve Cloudflare Pages.
BASE_URL = "https://www.cymarq.com.co/social/video/"

ARCHIVO_MANIFIESTO = rutas.CONFIG / "videos_publicos.json"

FORMATOS_ORIGEN = {".mp4", ".mov"}

# --------------------------------------------------------------------- #
# Limites. Espejo de lib/social/video.mjs                                #
# --------------------------------------------------------------------- #

#: Los mas estrictos de los dos: Facebook Reels. Si un video pasa esto, pasa
#: tambien Instagram Reels. Se valida contra el techo mas bajo a proposito, para
#: no meter en el catalogo algo que solo sirve en una de las dos redes.
DURACION_MIN = 3.0
DURACION_MAX = 90.0
RATIO_MIN = 0.5525   # 9:16 con tolerancia estrecha
RATIO_MAX = 0.5725
ANCHO_MIN = 540
ALTO_MIN = 960
ANCHO_MAX = 1920
FPS_MIN = 24.0
FPS_MAX = 60.0
PESO_MAX = 1024 * 1024 * 1024
CODECS_VIDEO = {"avc1", "hvc1", "hev1"}
CODECS_AUDIO = {"mp4a"}


class CatalogoVideoError(RuntimeError):
    """Problema al preparar el catalogo de video."""


# --------------------------------------------------------------------- #
# Lector de cajas MP4                                                    #
# --------------------------------------------------------------------- #


def _leer_cajas(fh: BinaryIO, inicio: int, fin: int):
    """Itera las cajas entre `inicio` y `fin`: (tipo, inicio_datos, fin_datos)."""
    pos = inicio
    while pos + 8 <= fin:
        fh.seek(pos)
        cabecera = fh.read(8)
        if len(cabecera) < 8:
            return
        tam = struct.unpack(">I", cabecera[:4])[0]
        tipo = cabecera[4:8].decode("latin-1")
        desplazamiento = 8

        if tam == 1:
            extra = fh.read(8)
            if len(extra) < 8:
                return
            tam = struct.unpack(">Q", extra)[0]
            desplazamiento = 16
        elif tam == 0:
            tam = fin - pos

        if tam < desplazamiento or pos + tam > fin:
            # Caja incoherente o archivo cortado: se para en vez de inventar.
            return

        yield tipo, pos + desplazamiento, pos + tam
        pos += tam


def _buscar(fh: BinaryIO, inicio: int, fin: int, nombre: str):
    for tipo, ini, f in _leer_cajas(fh, inicio, fin):
        if tipo == nombre:
            return ini, f
    return None


def _ruta_cajas(fh: BinaryIO, inicio: int, fin: int, ruta: list[str]):
    actual = (inicio, fin)
    for nombre in ruta:
        encontrado = _buscar(fh, actual[0], actual[1], nombre)
        if encontrado is None:
            return None
        actual = encontrado
    return actual


def _u32(fh: BinaryIO, pos: int) -> int:
    fh.seek(pos)
    return struct.unpack(">I", fh.read(4))[0]


@dataclass
class InfoVideo:
    """Lo que se puede saber de un MP4 leyendo solo sus cabeceras."""

    marca: str = ""
    duracion: float | None = None
    ancho: int | None = None
    alto: int | None = None
    fps: float | None = None
    codec_video: str | None = None
    codec_audio: str | None = None
    tiene_audio: bool = False
    girado: bool = False
    moov_presente: bool = False

    @property
    def ratio(self) -> float | None:
        if not self.ancho or not self.alto:
            return None
        return self.ancho / self.alto

    def como_dict(self) -> dict[str, Any]:
        return {
            "marca": self.marca,
            "duracion": round(self.duracion, 3) if self.duracion else None,
            "ancho": self.ancho,
            "alto": self.alto,
            "ratio": round(self.ratio, 4) if self.ratio else None,
            "fps": round(self.fps, 2) if self.fps else None,
            "codec_video": self.codec_video,
            "codec_audio": self.codec_audio,
            "tiene_audio": self.tiene_audio,
            "girado": self.girado,
        }


def leer_info(ruta: Path) -> InfoVideo | None:
    """Extrae de un MP4 lo necesario para validarlo. None si no es un MP4."""
    info = InfoVideo()
    tamano = ruta.stat().st_size

    with ruta.open("rb") as fh:
        ftyp = _buscar(fh, 0, tamano, "ftyp")
        if ftyp is None:
            return None
        fh.seek(ftyp[0])
        info.marca = fh.read(4).decode("latin-1", "replace")

        moov = _buscar(fh, 0, tamano, "moov")
        if moov is None:
            return info
        info.moov_presente = True

        # --- mvhd: escala de tiempo y duracion global ---
        mvhd = _buscar(fh, moov[0], moov[1], "mvhd")
        if mvhd:
            fh.seek(mvhd[0])
            version = fh.read(1)[0]
            base = mvhd[0] + 4
            if version == 1:
                escala = _u32(fh, base + 16)
                fh.seek(base + 20)
                duracion = struct.unpack(">Q", fh.read(8))[0]
            else:
                escala = _u32(fh, base + 8)
                duracion = _u32(fh, base + 12)
            if escala:
                info.duracion = duracion / escala

        # --- pistas ---
        for tipo, ini, fin in _leer_cajas(fh, moov[0], moov[1]):
            if tipo != "trak":
                continue

            hdlr = _ruta_cajas(fh, ini, fin, ["mdia", "hdlr"])
            clase = None
            if hdlr:
                fh.seek(hdlr[0] + 8)
                clase = fh.read(4).decode("latin-1", "replace")

            stbl = _ruta_cajas(fh, ini, fin, ["mdia", "minf", "stbl"])
            codec = None
            if stbl:
                stsd = _buscar(fh, stbl[0], stbl[1], "stsd")
                if stsd:
                    fh.seek(stsd[0] + 12)
                    codec = fh.read(4).decode("latin-1", "replace")

            if clase == "soun":
                info.tiene_audio = True
                info.codec_audio = codec or info.codec_audio
                continue
            if clase != "vide":
                continue

            info.codec_video = codec or info.codec_video

            # --- tkhd: dimensiones de presentacion y matriz de giro ---
            tkhd = _buscar(fh, ini, fin, "tkhd")
            if tkhd:
                fh.seek(tkhd[0])
                version = fh.read(1)[0]
                pos = tkhd[0] + 4 + (32 if version == 1 else 20) + 8 + 8
                fh.seek(pos)
                matriz = struct.unpack(">9i", fh.read(36))
                a, b, c, d = matriz[0], matriz[1], matriz[3], matriz[4]
                ancho = _u32(fh, pos + 36) / 65536
                alto = _u32(fh, pos + 40) / 65536
                # Giro de 90/270 grados: diagonal a cero, antidiagonal no.
                info.girado = a == 0 and d == 0 and (b != 0 or c != 0)
                if info.girado:
                    ancho, alto = alto, ancho
                if ancho > 0 and alto > 0:
                    info.ancho = round(ancho)
                    info.alto = round(alto)

            # --- fps: muestras de la pista / duracion de la pista ---
            if stbl:
                stsz = _buscar(fh, stbl[0], stbl[1], "stsz")
                mdhd = _ruta_cajas(fh, ini, fin, ["mdia", "mdhd"])
                if stsz and mdhd:
                    muestras = _u32(fh, stsz[0] + 8)
                    fh.seek(mdhd[0])
                    version = fh.read(1)[0]
                    base = mdhd[0] + 4
                    if version == 1:
                        escala = _u32(fh, base + 16)
                        fh.seek(base + 20)
                        dur = struct.unpack(">Q", fh.read(8))[0]
                    else:
                        escala = _u32(fh, base + 8)
                        dur = _u32(fh, base + 12)
                    segundos = dur / escala if escala else 0
                    if muestras and segundos:
                        info.fps = muestras / segundos

    return info


def validar(info: InfoVideo | None, peso: int) -> tuple[list[str], list[str]]:
    """Compara con los limites. Devuelve (problemas, avisos)."""
    problemas: list[str] = []
    avisos: list[str] = []

    if info is None:
        return (["El archivo no es un MP4 reconocible (falta la caja ftyp)."], avisos)
    if not info.moov_presente:
        problemas.append("El MP4 no tiene caja moov: esta incompleto o mal generado.")

    if peso > PESO_MAX:
        problemas.append(f"Pesa {peso} bytes, por encima del maximo {PESO_MAX}.")

    if info.duracion is None:
        problemas.append("No se ha podido leer la duracion.")
    elif info.duracion < DURACION_MIN:
        problemas.append(f"Dura {info.duracion:.2f} s, por debajo del minimo {DURACION_MIN} s.")
    elif info.duracion > DURACION_MAX:
        problemas.append(
            f"Dura {info.duracion:.2f} s, por encima del maximo {DURACION_MAX} s "
            "que admite Facebook Reels."
        )

    if info.ancho is None or info.alto is None:
        problemas.append("No se han podido leer las dimensiones.")
    else:
        ratio = info.ratio or 0
        if not (RATIO_MIN <= ratio <= RATIO_MAX):
            problemas.append(
                f"Relacion de aspecto {ratio:.4f} fuera del rango {RATIO_MIN}-{RATIO_MAX}. "
                "Facebook Reels exige 9:16."
            )
        if info.ancho < ANCHO_MIN or info.alto < ALTO_MIN:
            problemas.append(
                f"Resolucion {info.ancho}x{info.alto} por debajo del minimo "
                f"{ANCHO_MIN}x{ALTO_MIN}."
            )
        if info.ancho > ANCHO_MAX:
            problemas.append(f"Ancho {info.ancho} px por encima del maximo {ANCHO_MAX}.")
        if info.alto < 1920:
            avisos.append(
                f"Resolucion {info.ancho}x{info.alto}, por debajo del 1080x1920 "
                "recomendado por Meta. Se vera algo blando."
            )

    if info.fps is not None:
        if info.fps < FPS_MIN - 0.5:
            problemas.append(f"{info.fps:.2f} fps por debajo del minimo {FPS_MIN}.")
        if info.fps > FPS_MAX + 0.5:
            problemas.append(f"{info.fps:.2f} fps por encima del maximo {FPS_MAX}.")

    if info.codec_video and info.codec_video not in CODECS_VIDEO:
        problemas.append(
            f"Codec de video '{info.codec_video}'; admitidos: {sorted(CODECS_VIDEO)}."
        )
    if info.codec_audio and info.codec_audio not in CODECS_AUDIO:
        problemas.append(
            f"Codec de audio '{info.codec_audio}'; admitidos: {sorted(CODECS_AUDIO)}."
        )
    if not info.tiene_audio:
        avisos.append("El video no tiene pista de audio. Meta lo acepta, pero rinde peor.")
    if info.girado:
        avisos.append("La pista lleva matriz de giro: las dimensiones son las de presentacion.")

    return problemas, avisos


# --------------------------------------------------------------------- #
# Nombres deterministas                                                  #
# --------------------------------------------------------------------- #


def slug(texto: str) -> str:
    """Igual que en el catalogo de imagenes: URL sin acentos ni espacios."""
    base = unicodedata.normalize("NFKD", str(texto))
    base = base.encode("ascii", "ignore").decode("ascii").lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return re.sub(r"-{2,}", "-", base) or "video"


def nombre_destino(registro: dict[str, Any]) -> str:
    """Nombre determinista, con la huella del original como sufijo."""
    proyecto = slug(registro.get("proyecto_nombre") or registro.get("proyecto") or "proyecto")
    archivo = slug(Path(registro.get("archivo", "video")).stem)
    huella = (registro.get("id_archivo") or "")[:8] or "00000000"
    return f"{proyecto}-{archivo}-{huella}.mp4"


# --------------------------------------------------------------------- #
# Manifiesto                                                             #
# --------------------------------------------------------------------- #

_MANIFIESTO_VACIO: dict[str, Any] = {
    "version": 1,
    "actualizado": "",
    "nota": (
        "Catalogo de videos publicos de CYMARQ. Solo contiene material "
        "incorporado expresamente para publicaciones sociales. Los archivos se "
        "copian sin recodificar."
    ),
    "base_url": BASE_URL,
    "videos": {},
}


def cargar_manifiesto() -> dict[str, Any]:
    datos = seguridad.leer_json(ARCHIVO_MANIFIESTO, por_defecto=None)
    if not datos or "videos" not in datos:
        return json.loads(json.dumps(_MANIFIESTO_VACIO))
    return datos


def guardar_manifiesto(datos: dict[str, Any]) -> None:
    from datetime import datetime

    datos["actualizado"] = datetime.now().astimezone().isoformat(timespec="seconds")
    datos["base_url"] = BASE_URL
    seguridad.escribir_json(ARCHIVO_MANIFIESTO, datos)


def url_publica(id_archivo: str) -> str | None:
    """URL publica registrada para un id_archivo, o None si no esta."""
    entrada = cargar_manifiesto().get("videos", {}).get(id_archivo)
    if not entrada:
        return None
    return entrada.get("url") or None


# --------------------------------------------------------------------- #
# Conjunto autorizado                                                    #
# --------------------------------------------------------------------- #


def origenes_autorizados() -> list[dict[str, Any]]:
    """Videos autorizados para el catalogo publico.

    UNICA puerta de entrada, igual que en las imagenes: solo entra lo que el
    sistema ya selecciono para una publicacion concreta y sigue ocupando su
    hueco. Estar en PROYECTOS no autoriza nada.
    """
    vistos: set[str] = set()
    autorizados: list[dict[str, Any]] = []
    for pub in historial.cargar().get("publicaciones", []):
        if pub.get("estado") not in historial.ESTADOS_QUE_OCUPAN:
            continue
        if pub.get("tipo_medio") not in ("reels", "video"):
            continue
        id_archivo = pub.get("id_archivo") or ""
        if not id_archivo or id_archivo in vistos:
            continue
        vistos.add(id_archivo)
        autorizados.append(pub)
    return autorizados


def _ruta_origen(registro: dict[str, Any]) -> Path:
    """Archivo del que se genera el derivado. Se prefiere la copia local."""
    copia = registro.get("copia_local") or ""
    if copia:
        ruta = (rutas.RAIZ / copia).resolve()
        if ruta.is_file():
            return ruta

    original = registro.get("ruta_original") or ""
    if original:
        ruta = Path(original)
        if not ruta.is_absolute():
            ruta = (rutas.RAIZ / original).resolve()
        if ruta.is_file():
            return ruta

    raise CatalogoVideoError(
        f"No se encuentra el archivo de origen de {registro.get('id')}."
    )


# --------------------------------------------------------------------- #
# Generacion                                                             #
# --------------------------------------------------------------------- #


@dataclass
class ResultadoVideo:
    id_publicacion: str
    id_archivo: str
    nombre: str = ""
    url: str = ""
    accion: str = ""        # generada | reutilizada | conflicto | rechazada | error
    detalle: str = ""
    info: InfoVideo | None = None
    peso: int = 0
    avisos: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.accion in ("generada", "reutilizada")


def _huella(ruta: Path) -> str:
    h = hashlib.sha256()
    with ruta.open("rb") as fh:
        for bloque in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(bloque)
    return h.hexdigest()


def _copiar_verificando(origen: Path, destino: Path) -> None:
    """Copia el MP4 sin recodificar y comprueba que el original no cambio.

    Guarda explicita: el destino tiene que estar dentro de la carpeta publica de
    video. `seguridad.verificar_destino` no sirve aqui porque exige estar dentro
    de CYMARQ_SOCIAL, y la carpeta publica vive en el repositorio web; asi que la
    comprobacion se hace aqui, y ademas se rechaza escribir en PROYECTOS.
    """
    destino = destino.resolve()
    permitida = carpeta_video().resolve()
    try:
        destino.relative_to(permitida)
    except ValueError as exc:
        raise CatalogoVideoError(
            f"BLOQUEADO: destino fuera de la carpeta publica de video -> {destino}"
        ) from exc
    if seguridad.es_original(destino):
        raise CatalogoVideoError(
            f"BLOQUEADO: escritura dentro de PROYECTOS -> {destino}"
        )

    antes = (origen.stat().st_size, origen.stat().st_mtime_ns)
    destino.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(origen, destino)
    despues = (origen.stat().st_size, origen.stat().st_mtime_ns)

    if antes != despues:
        raise CatalogoVideoError(
            f"ABORTADO: el archivo de origen cambio durante la copia: {origen}"
        )
    if not origen.is_file():
        raise CatalogoVideoError(f"ALERTA: el original desaparecio tras la copia: {origen}")
    if destino.stat().st_size != antes[0]:
        raise CatalogoVideoError(
            f"ABORTADO: la copia no tiene el mismo tamano que el original: {destino}"
        )


def preparar_video(
    registro: dict[str, Any],
    manifiesto: dict[str, Any],
    forzar: bool = False,
    simular: bool = False,
) -> ResultadoVideo:
    """Prepara (o reutiliza) el derivado publico de un video autorizado."""
    id_archivo = registro.get("id_archivo") or ""
    res = ResultadoVideo(id_publicacion=registro.get("id", ""), id_archivo=id_archivo)

    entrada = manifiesto["videos"].get(id_archivo)

    # 1) Ya esta en el catalogo y el archivo sigue ahi: se reutiliza.
    if entrada and not forzar:
        destino = carpeta_video() / entrada["nombre"]
        if destino.is_file():
            res.nombre = entrada["nombre"]
            res.url = entrada["url"]
            res.accion = "reutilizada"
            res.detalle = "Ya estaba en el catalogo."
            res.peso = destino.stat().st_size
            res.info = leer_info(destino)
            return res

    try:
        origen = _ruta_origen(registro)
    except CatalogoVideoError as exc:
        res.accion = "error"
        res.detalle = str(exc)
        return res

    if origen.suffix.lower() not in FORMATOS_ORIGEN:
        res.accion = "rechazada"
        res.detalle = f"Formato de origen no admitido: {origen.suffix}"
        return res

    # 2) Validar ANTES de copiar. Copiar algo que Meta va a rechazar solo
    #    ensucia el repositorio publico.
    res.peso = origen.stat().st_size
    res.info = leer_info(origen)
    problemas, avisos = validar(res.info, res.peso)
    res.avisos = avisos
    if problemas:
        res.accion = "rechazada"
        res.detalle = " | ".join(problemas)
        return res

    res.nombre = entrada["nombre"] if entrada else nombre_destino(registro)
    res.url = BASE_URL + res.nombre
    destino = carpeta_video() / res.nombre

    if simular:
        res.accion = "generada"
        res.detalle = "SIMULACION: no se escribio nada."
        return res

    # 3) Un archivo con ese nombre que no consta en el manifiesto no se pisa.
    if destino.is_file() and not entrada and not forzar:
        res.accion = "conflicto"
        res.detalle = (
            f"Ya existe {res.nombre} en public/social/video/ y no consta en el "
            "manifiesto. No se sobrescribe. Revisalo a mano o usa forzar."
        )
        return res

    try:
        _copiar_verificando(origen, destino)
    except (CatalogoVideoError, OSError) as exc:
        res.accion = "error"
        res.detalle = str(exc)
        return res

    manifiesto["videos"][id_archivo] = {
        "nombre": res.nombre,
        "url": res.url,
        "id_publicacion": res.id_publicacion,
        "proyecto": registro.get("proyecto_nombre") or registro.get("proyecto") or "",
        "archivo_origen": registro.get("archivo", ""),
        "ruta_original": registro.get("ruta_original", ""),
        "peso": res.peso,
        "sha256": _huella(destino),
        **(res.info.como_dict() if res.info else {}),
    }
    res.accion = "generada"
    return res


def preparar_catalogo(forzar: bool = False, simular: bool = False) -> list[ResultadoVideo]:
    """Prepara el derivado de cada video autorizado. No publica ni hace commit."""
    manifiesto = cargar_manifiesto()
    resultados = [
        preparar_video(reg, manifiesto, forzar=forzar, simular=simular)
        for reg in origenes_autorizados()
    ]
    if not simular and any(r.accion == "generada" for r in resultados):
        guardar_manifiesto(manifiesto)
    return resultados


# --------------------------------------------------------------------- #
# Estado                                                                 #
# --------------------------------------------------------------------- #


def desplegado(id_archivo: str) -> bool:
    """El derivado existe en disco. NO garantiza que este publicado en la web.

    Lo comprueba el preflight: un archivo presente en local pero sin commit y
    push da un 404 a Meta en mitad de la publicacion.
    """
    entrada = cargar_manifiesto().get("videos", {}).get(id_archivo)
    if not entrada:
        return False
    return (carpeta_video() / entrada["nombre"]).is_file()


def resumen() -> dict[str, Any]:
    """Que hay en el catalogo y que archivos publicos lo respaldan."""
    manifiesto = cargar_manifiesto()
    videos = manifiesto.get("videos", {})
    carpeta = carpeta_video()

    en_disco = sorted(p.name for p in carpeta.glob("*.mp4")) if carpeta.is_dir() else []
    registrados = {e["nombre"] for e in videos.values()}

    return {
        "carpeta": str(carpeta),
        "base_url": manifiesto.get("base_url", BASE_URL),
        "autorizados": len(origenes_autorizados()),
        "en_manifiesto": len(videos),
        "archivos_en_disco": len(en_disco),
        "sin_registrar": sorted(set(en_disco) - registrados),
        "registrados_sin_archivo": sorted(
            e["nombre"] for e in videos.values() if not (carpeta / e["nombre"]).is_file()
        ),
        "videos": videos,
    }
