"""Inventario del material disponible (CONFIG/inventario_contenido.json).

Recorre PROYECTOS en modo SOLO LECTURA y registra cada archivo con su
clasificacion, su posible uso en redes sociales y su estado.

Estados posibles: disponible | pendiente | publicado | descartado
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from . import clasificacion, perfiles, rutas, seguridad

ESTADOS = ("disponible", "pendiente", "publicado", "descartado")

CORPORATIVO = "_CORPORATIVO"

# Archivos que ni siquiera vale la pena registrar.
IGNORAR = {"thumbs.db", "desktop.ini", ".ds_store"}

try:  # Pillow es opcional: mejora el inventario, no es obligatorio.
    from PIL import Image  # type: ignore

    _PIL = True
except Exception:  # pragma: no cover
    _PIL = False


def _id_archivo(ruta_rel: str) -> str:
    return hashlib.sha1(ruta_rel.encode("utf-8")).hexdigest()[:12]


def _dimensiones(ruta: Path) -> tuple[int | None, int | None]:
    if not _PIL:
        return None, None
    try:
        with Image.open(ruta) as img:
            return img.width, img.height
    except Exception:
        return None, None


# Instagram recomienda 1080 px en el lado largo. Por debajo la imagen se ve
# blanda en pantallas modernas, asi que se marca y se despriorriza.
ANCHO_MINIMO_RECOMENDADO = 1080


def _resolucion_suficiente(ancho: int | None, alto: int | None) -> bool:
    if not ancho or not alto:
        return True  # sin Pillow no penalizamos a ciegas
    return max(ancho, alto) >= ANCHO_MINIMO_RECOMENDADO


def _formato_instagram(ancho: int | None, alto: int | None) -> str:
    if not ancho or not alto:
        return "desconocido"
    rel = ancho / alto
    if rel >= 1.60:
        return "panoramico (recortar a 4:5 o 1:1)"
    if rel > 1.15:
        return "horizontal 1.91:1"
    if rel >= 0.95:
        return "cuadrado 1:1"
    if rel >= 0.75:
        return "vertical 4:5 (ideal Instagram)"
    return "vertical alto (recortar a 4:5)"


def _proyecto_de(ruta_rel: Path) -> str:
    primera = ruta_rel.parts[0] if ruta_rel.parts else ""
    carpeta = rutas.PROYECTOS / primera
    if perfiles.es_carpeta_de_proyecto(carpeta):
        return primera
    return CORPORATIVO


def _recorrer() -> Iterable[Path]:
    for ruta in sorted(rutas.PROYECTOS.rglob("*")):
        if ruta.is_file() and ruta.name.lower() not in IGNORAR:
            yield ruta


def escanear(verbose: bool = False) -> dict[str, Any]:
    """Reconstruye el inventario preservando los estados ya asignados."""
    rutas.asegurar_estructura()

    if not rutas.PROYECTOS.is_dir():
        raise FileNotFoundError(f"No se encuentra la carpeta {rutas.PROYECTOS}")

    previo = seguridad.leer_json(rutas.ARCHIVO_INVENTARIO, por_defecto=None) or {}
    estados_previos = {
        item["id"]: item.get("estado", "disponible")
        for item in previo.get("items", [])
        if item.get("id")
    }
    notas_previas = {
        item["id"]: item.get("nota", "")
        for item in previo.get("items", [])
        if item.get("id")
    }

    items: list[dict[str, Any]] = []
    for ruta in _recorrer():
        rel = ruta.relative_to(rutas.PROYECTOS)
        rel_txt = rel.as_posix()
        info = clasificacion.clasificar(ruta, rutas.PROYECTOS)
        ident = _id_archivo(rel_txt)

        ancho = alto = None
        if info["extension"] in clasificacion.EXT_IMAGEN:
            ancho, alto = _dimensiones(ruta)

        try:
            stat = ruta.stat()
            tamano = stat.st_size
            modificado = datetime.fromtimestamp(
                stat.st_mtime, tz=timezone.utc
            ).isoformat(timespec="seconds")
        except OSError:
            tamano, modificado = 0, ""

        if not info["apto_publicacion"]:
            estado = "descartado"
        else:
            estado = estados_previos.get(ident, "disponible")
            if estado not in ESTADOS:
                estado = "disponible"

        items.append({
            "id": ident,
            "proyecto": _proyecto_de(rel),
            "archivo": ruta.name,
            "ruta": f"PROYECTOS/{rel_txt}",
            "ruta_absoluta": str(ruta),
            "tipo": info["tipo"],
            "extension": info["extension"],
            "uso_redes": info["uso_redes"],
            "estado": estado,
            "apto_publicacion": info["apto_publicacion"],
            "prioridad": info["prioridad"],
            "ambiente": info["ambiente"],
            "carpeta": info["categoria_carpeta"],
            "tamano_bytes": tamano,
            "ancho": ancho,
            "alto": alto,
            "formato_instagram": _formato_instagram(ancho, alto),
            "resolucion_suficiente": _resolucion_suficiente(ancho, alto),
            "modificado": modificado,
            "motivo": info["motivo"],
            "nota": notas_previas.get(ident, ""),
        })

        if verbose:
            print(f"  [{info['tipo']:<12}] {rel_txt}")

    inventario = {
        "generado": datetime.now().astimezone().isoformat(timespec="seconds"),
        "raiz": str(rutas.PROYECTOS),
        "solo_lectura": True,
        "total_archivos": len(items),
        "resumen": _resumen(items),
        "items": items,
    }

    seguridad.escribir_json(rutas.ARCHIVO_INVENTARIO, inventario)
    return inventario


def _resumen(items: list[dict[str, Any]]) -> dict[str, Any]:
    por_tipo: dict[str, int] = {}
    por_estado: dict[str, int] = {}
    por_proyecto: dict[str, dict[str, int]] = {}

    for it in items:
        por_tipo[it["tipo"]] = por_tipo.get(it["tipo"], 0) + 1
        por_estado[it["estado"]] = por_estado.get(it["estado"], 0) + 1
        p = por_proyecto.setdefault(
            it["proyecto"], {"total": 0, "publicables": 0}
        )
        p["total"] += 1
        if it["apto_publicacion"]:
            p["publicables"] += 1

    return {
        "por_tipo": dict(sorted(por_tipo.items())),
        "por_estado": dict(sorted(por_estado.items())),
        "por_proyecto": dict(sorted(por_proyecto.items())),
        "publicables": sum(1 for i in items if i["apto_publicacion"]),
    }


def cargar() -> dict[str, Any]:
    inv = seguridad.leer_json(rutas.ARCHIVO_INVENTARIO, por_defecto=None)
    if not inv:
        inv = escanear()
    return inv


def guardar(inventario: dict[str, Any]) -> None:
    inventario["resumen"] = _resumen(inventario.get("items", []))
    inventario["total_archivos"] = len(inventario.get("items", []))
    seguridad.escribir_json(rutas.ARCHIVO_INVENTARIO, inventario)


def marcar_estado(id_archivo: str, estado: str) -> bool:
    """Cambia el estado de un item del inventario."""
    if estado not in ESTADOS:
        raise ValueError(f"Estado invalido: {estado}")
    inv = cargar()
    for item in inv.get("items", []):
        if item["id"] == id_archivo:
            item["estado"] = estado
            guardar(inv)
            return True
    return False


def buscar(id_archivo: str) -> dict[str, Any] | None:
    for item in cargar().get("items", []):
        if item["id"] == id_archivo:
            return item
    return None


def candidatos(
    inventario: dict[str, Any],
    cfg: dict[str, Any],
    proyecto: str | None = None,
) -> list[dict[str, Any]]:
    """Material publicable, ordenado por prioridad editorial.

    Prioridad: renders > fotografias > imagenes finales > detalles > planos.
    """
    tipos_permitidos = {"imagen_final", "detalle"}
    if cfg.get("usar_renders", True):
        tipos_permitidos.add("render")
    if cfg.get("usar_fotografias", True):
        tipos_permitidos.add("fotografia")
    if cfg.get("usar_planos", False):
        tipos_permitidos.add("plano_visual")
    if cfg.get("usar_videos", False):
        tipos_permitidos.add("video")

    salida = [
        it for it in inventario.get("items", [])
        if it.get("apto_publicacion")
        and it.get("estado") == "disponible"
        and it.get("tipo") in tipos_permitidos
        and it.get("proyecto") != CORPORATIVO
        and (proyecto is None or it.get("proyecto") == proyecto)
    ]

    salida.sort(key=lambda it: (it["prioridad"], it["proyecto"], it["archivo"]))
    return salida
