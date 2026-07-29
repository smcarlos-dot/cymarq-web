"""Generador de propuestas de publicacion.

Flujo de una propuesta:
  1. rotacion elige proyecto e imagen todavia no usados;
  2. redaccion arma titulo, textos y hashtags a partir de la ficha real;
  3. se crea PENDIENTES/<fecha>_<PROYECTO>/ con imagen/, publicacion.txt y
     metadata.json;
  4. se registra en el historial como "propuesta" y el archivo pasa a estado
     "pendiente" en el inventario.

La imagen SIEMPRE se copia. El original nunca se mueve, renombra ni modifica.
"""

from __future__ import annotations

import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any

from . import (
    config as cfg_mod,
    historial,
    inventario,
    perfiles as perfiles_mod,
    redaccion,
    rotacion,
    rutas,
    seguridad,
)

CARPETA_DESCARTES = rutas.PENDIENTES / "_descartadas"


class SinContenido(RuntimeError):
    """No queda material disponible para proponer."""


def _slug(texto: str, largo: int = 40) -> str:
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    texto = re.sub(r"^\d{1,2}\s+", "", texto)
    texto = re.sub(r"[^A-Za-z0-9]+", "_", texto).strip("_").upper()
    return texto[:largo].strip("_") or "PROYECTO"


def _ambientes_recientes(proyecto: str, cuantos: int = 3) -> set[str]:
    previos = [
        p for p in historial.cargar()["publicaciones"]
        if p.get("proyecto") == proyecto
        and p.get("estado") in historial.ESTADOS_QUE_OCUPAN
    ]
    previos.sort(key=lambda p: p.get("fecha_creacion", ""), reverse=True)
    return {p.get("ambiente", "") for p in previos[:cuantos]} - {""}


def _agrupar(items: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grupos: dict[str, list[dict[str, Any]]] = {}
    for it in items:
        grupos.setdefault(it["proyecto"], []).append(it)
    return grupos


def generar_propuesta(
    proyecto: str | None = None,
    plataformas: list[str] | None = None,
    variante: int = 0,
    fecha_propuesta: str | None = None,
    excluir_ids: set[str] | None = None,
    excluir_proyectos: set[str] | None = None,
) -> dict[str, Any]:
    """Crea una propuesta completa en PENDIENTES y la registra en el historial."""
    rutas.asegurar_estructura()

    cfg = cfg_mod.cargar()
    inv = inventario.cargar()
    fichas = perfiles_mod.cargar_perfiles()

    plataformas = plataformas or list(cfg.get("plataformas", ["instagram", "facebook"]))

    disponibles = inventario.candidatos(inv, cfg)
    if not disponibles:
        raise SinContenido(
            "No hay material disponible. Ejecuta 'escanear' o revisa los "
            "estados en CONFIG/inventario_contenido.json."
        )

    ocupados = historial.ids_archivo_ocupados() if cfg.get("no_repetir_imagen", True) else set()
    ocupados |= (excluir_ids or set())
    grupos = _agrupar([it for it in disponibles if it["id"] not in ocupados])
    if not grupos:
        raise SinContenido(
            "Todo el material publicable ya fue usado en alguna propuesta. "
            "Agrega renders nuevos o libera imagenes en el inventario."
        )

    # excluir_proyectos es una preferencia, no una restriccion dura: si al
    # aplicarla no queda nada, se vuelve a intentar sin ella.
    elegido, explicacion = rotacion.elegir_proyecto(
        grupos, cfg, proyecto, excluir=excluir_proyectos
    )
    if not elegido and excluir_proyectos:
        elegido, explicacion = rotacion.elegir_proyecto(grupos, cfg, proyecto)
    if not elegido:
        raise SinContenido(explicacion.get("detalle", "Sin proyecto disponible."))

    item = rotacion.elegir_imagen(
        grupos[elegido], cfg,
        ambientes_recientes=_ambientes_recientes(elegido),
        excluir_ids=ocupados,
    )
    if not item:
        raise SinContenido(f"Sin imagenes libres en {elegido}.")

    ficha = fichas.get(elegido) or perfiles_mod.perfil_de_proyecto(
        rutas.PROYECTOS / elegido
    )
    texto = redaccion.redactar(ficha, item, cfg, variante=variante)

    fecha_obj = rotacion.proxima_fecha(cfg)
    fecha_txt = fecha_propuesta or fecha_obj.strftime("%Y-%m-%d")
    hora_txt = cfg.get("hora_publicacion", "18:30")

    datos_hist = historial.cargar()
    id_pub = historial.siguiente_id(datos_hist)

    carpeta = _crear_carpeta(fecha_txt, elegido)
    origen = Path(item["ruta_absoluta"])
    copia = seguridad.copiar_material(origen, carpeta / "imagen" / origen.name)

    registro: dict[str, Any] = {
        "id": id_pub,
        "fecha_creacion": datetime.now().astimezone().isoformat(timespec="seconds"),
        "fecha": fecha_txt,
        "hora_propuesta": hora_txt,
        "proyecto": elegido,
        "proyecto_nombre": ficha.get("nombre", elegido),
        "archivo": item["archivo"],
        "ruta_original": item["ruta"],
        "id_archivo": item["id"],
        "copia_local": rutas.ruta_relativa(copia),
        "carpeta_pendiente": rutas.ruta_relativa(carpeta),
        "plataforma": plataformas,
        "titulo": texto["titulo"],
        "ambiente": texto["ambiente"],
        "texto": {
            "instagram": texto["texto_instagram"],
            "facebook": texto["texto_facebook"],
        },
        "hashtags": texto["hashtags"],
        "hashtags_facebook": texto["hashtags_facebook"],
        "llamada_a_la_accion": texto["llamada_a_la_accion"],
        "variante_texto": variante,
        "estado": "propuesta",
        "fecha_publicacion": None,
        "url_publicacion": {"instagram": None, "facebook": None},
        "id_publicacion_meta": {"instagram": None, "facebook": None},
        "rotacion": explicacion,
        "formato_imagen": item.get("formato_instagram", "desconocido"),
        "dimensiones": {"ancho": item.get("ancho"), "alto": item.get("alto")},
        "notas": "",
        "publicado_por_sistema": False,
    }

    _escribir_publicacion_txt(carpeta, registro, ficha, cfg)
    seguridad.escribir_json(carpeta / "metadata.json", registro)

    historial.registrar(registro)
    inventario.marcar_estado(item["id"], "pendiente")

    return registro


def _crear_carpeta(fecha_txt: str, proyecto: str) -> Path:
    base = rutas.PENDIENTES / f"{fecha_txt}_{_slug(proyecto)}"
    carpeta = base
    n = 2
    while carpeta.exists():
        carpeta = base.with_name(f"{base.name}_{n}")
        n += 1
    seguridad.verificar_destino(carpeta)
    (carpeta / "imagen").mkdir(parents=True, exist_ok=True)
    return carpeta


def _escribir_publicacion_txt(
    carpeta: Path,
    reg: dict[str, Any],
    ficha: dict[str, Any],
    cfg: dict[str, Any],
) -> None:
    sep = "=" * 68
    lineas = [
        sep,
        f"CYMARQ SOCIAL · PROPUESTA {reg['id']}",
        sep,
        "",
        f"PROYECTO        : {reg['proyecto_nombre']}  ({reg['proyecto']})",
        f"TITULO          : {reg['titulo']}",
        f"IMAGEN          : {reg['archivo']}",
        f"RUTA ORIGINAL   : {reg['ruta_original']}",
        f"FORMATO         : {reg['formato_imagen']}",
        f"PLATAFORMAS     : {', '.join(reg['plataforma'])}",
        f"FECHA PROPUESTA : {reg['fecha']} a las {reg['hora_propuesta']}",
        f"ESTADO          : {reg['estado']}",
        "",
        sep,
        "INSTAGRAM",
        sep,
        reg["texto"]["instagram"],
        "",
        sep,
        "FACEBOOK",
        sep,
        reg["texto"]["facebook"],
        "",
        sep,
        "HASHTAGS",
        sep,
        " ".join(reg["hashtags"]),
        "",
        sep,
        "LLAMADA A LA ACCION",
        sep,
        reg["llamada_a_la_accion"],
        "",
        sep,
        "NOTAS",
        sep,
        "- La imagen de la carpeta imagen/ es una COPIA. El archivo original",
        f"  sigue intacto en {reg['ruta_original']}",
        "- Esta propuesta NO ha sido publicada en ninguna red social.",
        f"- Regla de rotacion aplicada: {reg['rotacion'].get('regla', '-')}",
        f"  {reg['rotacion'].get('detalle', '')}",
        "",
    ]
    if ficha.get("enlace_video"):
        lineas.append(f"- Video del proyecto: {ficha['enlace_video']}")
    lineas.append(f"- Contacto: {cfg.get('whatsapp','')} · {cfg.get('correo','')}")
    lineas.append("")

    seguridad.escribir_texto(carpeta / "publicacion.txt", "\n".join(lineas))


# --- Acciones sobre una propuesta ---------------------------------------


def _actualizar_metadata(reg: dict[str, Any]) -> None:
    carpeta = rutas.RAIZ / reg.get("carpeta_pendiente", "")
    if carpeta.is_dir():
        seguridad.escribir_json(carpeta / "metadata.json", reg)


def aprobar(id_publicacion: str) -> dict[str, Any] | None:
    """Marca la propuesta como aprobada. NO publica en redes sociales."""
    reg = historial.cambiar_estado(id_publicacion, "aprobada")
    if reg:
        _actualizar_metadata(reg)
    return reg


def rechazar(id_publicacion: str, motivo: str = "") -> dict[str, Any] | None:
    """Rechaza la propuesta y archiva su carpeta en PENDIENTES/_descartadas."""
    reg = historial.buscar(id_publicacion)
    if not reg:
        return None

    reg = historial.cambiar_estado(id_publicacion, "rechazada", motivo) or reg
    inventario.marcar_estado(reg.get("id_archivo", ""), "descartado")
    _archivar_carpeta(reg)
    return historial.buscar(id_publicacion) or reg


def cancelar(id_publicacion: str, motivo: str = "reemplazada") -> dict[str, Any] | None:
    """Descarta la propuesta y devuelve la imagen al pool disponible."""
    reg = historial.buscar(id_publicacion)
    if not reg:
        return None

    reg = historial.cambiar_estado(id_publicacion, "cancelada", motivo) or reg
    inventario.marcar_estado(reg.get("id_archivo", ""), "disponible")
    _archivar_carpeta(reg)
    return historial.buscar(id_publicacion) or reg


def _archivar_carpeta(reg: dict[str, Any]) -> None:
    """Mueve la carpeta de la propuesta a _descartadas (nunca borra nada)."""
    carpeta = rutas.RAIZ / reg.get("carpeta_pendiente", "")
    if not carpeta.is_dir():
        return
    seguridad.verificar_destino(carpeta)
    CARPETA_DESCARTES.mkdir(parents=True, exist_ok=True)

    destino = CARPETA_DESCARTES / carpeta.name
    n = 2
    while destino.exists():
        destino = CARPETA_DESCARTES / f"{carpeta.name}_{n}"
        n += 1
    seguridad.verificar_destino(destino)

    # Guardamos la metadata actualizada antes de mover.
    seguridad.escribir_json(carpeta / "metadata.json", reg)
    shutil.move(str(carpeta), str(destino))
    historial.actualizar(reg["id"], {
        "carpeta_pendiente": rutas.ruta_relativa(destino),
    })


def regenerar_texto(id_publicacion: str) -> dict[str, Any] | None:
    """Reescribe los textos de la misma imagen con otra variante."""
    reg = historial.buscar(id_publicacion)
    if not reg:
        return None

    cfg = cfg_mod.cargar()
    fichas = perfiles_mod.cargar_perfiles()
    ficha = fichas.get(reg["proyecto"], {})
    item = inventario.buscar(reg.get("id_archivo", "")) or {
        "ambiente": reg.get("ambiente", "general"),
        "archivo": reg.get("archivo", ""),
    }

    variante = int(reg.get("variante_texto", 0)) + 1
    texto = redaccion.redactar(ficha, item, cfg, variante=variante)

    cambios = {
        "titulo": texto["titulo"],
        "texto": {
            "instagram": texto["texto_instagram"],
            "facebook": texto["texto_facebook"],
        },
        "hashtags": texto["hashtags"],
        "hashtags_facebook": texto["hashtags_facebook"],
        "llamada_a_la_accion": texto["llamada_a_la_accion"],
        "variante_texto": variante,
    }
    reg = historial.actualizar(id_publicacion, cambios) or reg

    carpeta = rutas.RAIZ / reg.get("carpeta_pendiente", "")
    if carpeta.is_dir():
        _escribir_publicacion_txt(carpeta, reg, ficha, cfg)
        seguridad.escribir_json(carpeta / "metadata.json", reg)
    return reg


def generar_otra(id_publicacion: str) -> dict[str, Any]:
    """Genera una propuesta distinta y solo entonces descarta la anterior.

    El orden importa y antes estaba al reves. Cancelar primero y generar
    despues deja el sistema sin propuesta si la generacion falla: la anterior
    ya esta cancelada y no hay reemplazo, asi que el panel se queda sin
    `propuesta_actual` y el boton deja de responder. Generando primero, un
    fallo no destruye nada: la propuesta actual sigue en pie.

    La anterior se excluye por id de imagen y por proyecto para que la
    rotacion no devuelva exactamente lo mismo.
    """
    anterior = historial.buscar(id_publicacion)
    if not anterior:
        return generar_propuesta()

    # Solo se descarta lo que ocupa sitio. Una propuesta ya publicada no se
    # toca: cancelarla liberaria su imagen y la rotacion podria volver a
    # proponer algo que ya esta en Instagram o Facebook.
    reemplazable = anterior.get("estado") in ("propuesta", "aprobada")

    nueva = generar_propuesta(
        excluir_ids={anterior.get("id_archivo", "")} - {""},
        excluir_proyectos={anterior.get("proyecto", "")} - {""},
    )

    if reemplazable:
        cancelar(id_publicacion, "reemplazada por 'generar otra'")

    return nueva
