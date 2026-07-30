"""Publicaciones EXPRESS: fuera del calendario, sin tocarlo.

Una express es una publicacion puntual que nace de una imagen concreta y unos
textos concretos, no de la rotacion. Sirve para "publica esto ahora" sin
esperar al martes ni gastar una de las 48 programadas.

    imagen suelta
        -> [Claude prepara los textos, fuera de este modulo]
        -> crear()  : registra el trabajo y prepara el derivado publico
        -> programar (opcional) a una hora distinta de las del calendario
        -> el mismo motor de siempre publica

LO QUE UNA EXPRESS NO PUEDE HACER, Y POR QUE
--------------------------------------------
No consume una programada, no mueve el calendario, no altera la rotacion y no
cambia el estado de ninguna otra publicacion. Se consigue sin codigo especial:
una express es una entrada mas del historial, con su propio identificador de la
serie EXP-, y las funciones de calendario solo tocan lo que ya tenia fecha o lo
que ellas mismas asignan. `calendarizar_banco()` la ignora porque solo mira
propuestas sin `programado_para`; si se le da hora a mano, esa franja queda
ocupada y el calendario la esquiva, que es justo lo que debe pasar.

La proteccion antiduplicados es la de siempre, sin nada aparte: los diarios de
Node y el estado por plataforma se indexan por identificador de trabajo, y
EXP-... es un identificador como cualquier otro.

Este modulo NO publica. Prepara.
"""

from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from . import catalogo_social, config as cfg_mod, historial, programacion, rutas, seguridad

PREFIJO = "EXP"


class ErrorExpress(RuntimeError):
    """No se puede preparar la express."""


def siguiente_id(datos: dict[str, Any] | None = None) -> str:
    """Serie propia EXP-AAAA-NNNN, separada de la serie CYM del banco."""
    datos = datos or historial.cargar()
    prefijo = f"{PREFIJO}-{datetime.now().year}-"
    usados = [
        int(p["id"].rsplit("-", 1)[-1])
        for p in datos["publicaciones"]
        if str(p.get("id", "")).startswith(prefijo)
        and p["id"].rsplit("-", 1)[-1].isdigit()
    ]
    return f"{prefijo}{(max(usados) + 1) if usados else 1:04d}"


def crear(imagen: str | Path,
          texto_instagram: str,
          texto_facebook: str,
          titulo: str = "",
          proyecto: str = "",
          hashtags: list[str] | None = None,
          cuando: str | datetime | None = None,
          plataformas: list[str] | None = None) -> dict[str, Any]:
    """Registra una express y deja su derivado JPEG publico preparado.

    `imagen` es una ruta a un archivo cualquiera del equipo. Se COPIA a
    PENDIENTES; el original no se toca, exactamente igual que en el flujo
    normal.

    Devuelve el registro. La imagen todavia hay que desplegarla (commit+push)
    antes de poder publicar: el preflight lo detectara.
    """
    origen = Path(imagen).expanduser().resolve()
    if not origen.is_file():
        raise ErrorExpress(f"No existe la imagen: {origen}")
    if not texto_instagram.strip() or not texto_facebook.strip():
        raise ErrorExpress("Hacen falta los dos textos: Instagram y Facebook.")

    rutas.asegurar_estructura()
    plataformas = plataformas or list(
        cfg_mod.cargar().get("plataformas", ["instagram", "facebook"]))

    datos_hist = historial.cargar()
    id_pub = siguiente_id(datos_hist)

    # Carpeta propia, con la marca EXPRESS en el nombre para que se distinga de
    # un vistazo de las del banco.
    carpeta = rutas.PENDIENTES / f"{programacion.ahora():%Y-%m-%d}_EXPRESS_{id_pub}"
    n = 2
    base = carpeta
    while carpeta.exists():
        carpeta = base.with_name(f"{base.name}_{n}")
        n += 1
    seguridad.verificar_destino(carpeta)
    (carpeta / "imagen").mkdir(parents=True, exist_ok=True)

    huella_antes = (origen.stat().st_size, origen.stat().st_mtime_ns)
    copia = carpeta / "imagen" / origen.name
    shutil.copy2(origen, copia)
    if (origen.stat().st_size, origen.stat().st_mtime_ns) != huella_antes:
        raise ErrorExpress(f"El archivo original cambio durante la copia: {origen}")

    # Identificador de contenido: la huella del archivo, igual que el inventario.
    id_archivo = seguridad.huella_archivo(copia) if hasattr(seguridad, "huella_archivo") else None
    if not id_archivo:
        import hashlib
        id_archivo = hashlib.sha256(copia.read_bytes()).hexdigest()[:12]

    registro: dict[str, Any] = {
        "id": id_pub,
        "express": True,
        "fecha_creacion": programacion.guardar_iso(programacion.ahora()),
        "proyecto": proyecto or "_EXPRESS",
        "proyecto_nombre": proyecto or "Publicación express",
        "archivo": origen.name,
        "ruta_original": str(origen),
        "id_archivo": id_archivo,
        "copia_local": rutas.ruta_relativa(copia),
        "carpeta_pendiente": rutas.ruta_relativa(carpeta),
        "plataforma": plataformas,
        "titulo": titulo or "Publicación express",
        "ambiente": "express",
        "texto": {"instagram": texto_instagram, "facebook": texto_facebook},
        "hashtags": hashtags or [],
        "hashtags_facebook": hashtags or [],
        "llamada_a_la_accion": "",
        "estado": "propuesta",
        "fecha_publicacion": None,
        "url_publicacion": {"instagram": None, "facebook": None},
        "id_publicacion_meta": {"instagram": None, "facebook": None},
        "notas": "Publicacion express. No forma parte del banco ni del calendario.",
        "publicado_por_sistema": False,
    }

    seguridad.escribir_json(carpeta / "metadata.json", registro)
    historial.registrar(registro)

    # Derivado publico con las mismas reglas que el resto del catalogo.
    resultado = catalogo_social.preparar_imagen(
        registro, catalogo_social.cargar_manifiesto(), forzar=False, simular=False)
    if resultado.ok:
        manifiesto = catalogo_social.cargar_manifiesto()
        manifiesto["imagenes"][id_archivo] = {
            "nombre": resultado.nombre, "url": resultado.url,
            "id_publicacion": id_pub, "proyecto": registro["proyecto_nombre"],
            "archivo_origen": origen.name, "ruta_original": str(origen),
            "ancho": resultado.ancho, "alto": resultado.alto, "peso": resultado.peso,
            "express": True,
        }
        catalogo_social.guardar_manifiesto(manifiesto)

    registro["_derivado"] = {
        "accion": resultado.accion, "nombre": resultado.nombre,
        "url": resultado.url, "detalle": resultado.detalle,
        "medidas": f"{resultado.ancho}x{resultado.alto}" if resultado.ancho else None,
    }

    if cuando is not None:
        historial.cambiar_estado(id_pub, "aprobada", "express aprobada al crearse")
        programacion.programar(id_pub, cuando)
        registro = historial.buscar(id_pub) or registro
        registro["_derivado"] = {"accion": resultado.accion, "nombre": resultado.nombre,
                                 "url": resultado.url, "detalle": resultado.detalle}

    return registro


def listar() -> list[dict[str, Any]]:
    """Todas las express registradas, de la mas reciente a la mas antigua."""
    return [p for p in historial.listar() if p.get("express")]


def resumen_aislamiento() -> dict[str, Any]:
    """Comprueba que las express no han tocado el calendario del banco.

    Se usa en las pruebas y despues de crear una: si alguna vez una express
    empezara a interferir, aqui se veria.
    """
    pubs = historial.cargar()["publicaciones"]
    banco = [p for p in pubs if not p.get("express") and str(p["id"]).startswith("CYM-")]
    express = [p for p in pubs if p.get("express")]
    franjas_banco = [p["programado_para"] for p in banco if p.get("programado_para")]
    franjas_exp = [p["programado_para"] for p in express if p.get("programado_para")]

    return {
        "banco": len(banco),
        "banco_programadas": len(franjas_banco),
        "banco_primera": min(franjas_banco) if franjas_banco else None,
        "banco_ultima": max(franjas_banco) if franjas_banco else None,
        "express": len(express),
        "express_programadas": len(franjas_exp),
        "colisiones": sorted(set(franjas_banco) & set(franjas_exp)),
        "aislado": not (set(franjas_banco) & set(franjas_exp)),
    }
