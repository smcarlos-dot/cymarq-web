"""Historial de publicaciones (CONFIG/historial_publicaciones.json).

Es la fuente de verdad para dos cosas criticas:
  1. no repetir una imagen que ya se uso;
  2. saber que proyecto toca segun la rotacion.

Cada propuesta se registra apenas se genera, aunque todavia no se publique.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from . import rutas, seguridad

ESTADOS = ("propuesta", "aprobada", "rechazada", "publicada", "cancelada")

# Estados que "consumen" una imagen y bloquean su reutilizacion.
ESTADOS_QUE_OCUPAN = ("propuesta", "aprobada", "publicada")

_VACIO: dict[str, Any] = {
    "version": 1,
    "actualizado": "",
    "nota": (
        "Registro local de publicaciones de CYMARQ SOCIAL. "
        "Fase 1: nada de esto se ha publicado en redes sociales."
    ),
    "publicaciones": [],
}


def cargar() -> dict[str, Any]:
    datos = seguridad.leer_json(rutas.ARCHIVO_HISTORIAL, por_defecto=None)
    if not datos:
        datos = dict(_VACIO)
        datos["publicaciones"] = []
        guardar(datos)
    datos.setdefault("publicaciones", [])
    return datos


def guardar(datos: dict[str, Any]) -> None:
    datos["actualizado"] = datetime.now().astimezone().isoformat(timespec="seconds")
    seguridad.escribir_json(rutas.ARCHIVO_HISTORIAL, datos)


def siguiente_id(datos: dict[str, Any] | None = None) -> str:
    datos = datos or cargar()
    anio = datetime.now().year
    prefijo = f"CYM-{anio}-"
    usados = [
        int(p["id"].rsplit("-", 1)[-1])
        for p in datos["publicaciones"]
        if str(p.get("id", "")).startswith(prefijo)
        and p["id"].rsplit("-", 1)[-1].isdigit()
    ]
    return f"{prefijo}{(max(usados) + 1) if usados else 1:04d}"


def registrar(publicacion: dict[str, Any]) -> dict[str, Any]:
    datos = cargar()
    datos["publicaciones"].append(publicacion)
    guardar(datos)
    return publicacion


def buscar(id_publicacion: str) -> dict[str, Any] | None:
    for p in cargar()["publicaciones"]:
        if p.get("id") == id_publicacion:
            return p
    return None


def actualizar(id_publicacion: str, cambios: dict[str, Any]) -> dict[str, Any] | None:
    datos = cargar()
    for p in datos["publicaciones"]:
        if p.get("id") == id_publicacion:
            p.update(cambios)
            p["actualizado"] = datetime.now().astimezone().isoformat(
                timespec="seconds"
            )
            guardar(datos)
            return p
    return None


def cambiar_estado(id_publicacion: str, estado: str,
                   nota: str = "") -> dict[str, Any] | None:
    if estado not in ESTADOS:
        raise ValueError(f"Estado invalido: {estado}")
    cambios: dict[str, Any] = {"estado": estado}
    if nota:
        cambios["notas"] = nota
    if estado == "aprobada":
        cambios["fecha_aprobacion"] = datetime.now().astimezone().isoformat(
            timespec="seconds"
        )
    return actualizar(id_publicacion, cambios)


def listar(estado: str | None = None) -> list[dict[str, Any]]:
    pubs = cargar()["publicaciones"]
    if estado:
        pubs = [p for p in pubs if p.get("estado") == estado]
    return sorted(pubs, key=lambda p: p.get("fecha_creacion", ""), reverse=True)


# --- Consultas usadas por el motor de rotacion --------------------------


def ids_archivo_ocupados() -> set[str]:
    """IDs de inventario ya comprometidos en alguna propuesta viva."""
    return {
        p.get("id_archivo", "")
        for p in cargar()["publicaciones"]
        if p.get("estado") in ESTADOS_QUE_OCUPAN
    } - {""}


def rutas_usadas() -> set[str]:
    return {
        p.get("ruta_original", "")
        for p in cargar()["publicaciones"]
        if p.get("estado") in ESTADOS_QUE_OCUPAN
    } - {""}


def secuencia_proyectos() -> list[str]:
    """Proyectos en orden cronologico de uso (el ultimo es el mas reciente)."""
    pubs = [
        p for p in cargar()["publicaciones"]
        if p.get("estado") in ESTADOS_QUE_OCUPAN and p.get("proyecto")
    ]
    pubs.sort(key=lambda p: p.get("fecha_creacion", ""))
    return [p["proyecto"] for p in pubs]


def ultimo_uso_por_proyecto() -> dict[str, str]:
    salida: dict[str, str] = {}
    for p in cargar()["publicaciones"]:
        if p.get("estado") not in ESTADOS_QUE_OCUPAN:
            continue
        fecha = p.get("fecha_creacion", "")
        proyecto = p.get("proyecto", "")
        if proyecto and fecha > salida.get(proyecto, ""):
            salida[proyecto] = fecha
    return salida


def conteo_por_proyecto() -> dict[str, int]:
    salida: dict[str, int] = {}
    for p in cargar()["publicaciones"]:
        if p.get("estado") in ESTADOS_QUE_OCUPAN:
            salida[p.get("proyecto", "")] = salida.get(p.get("proyecto", ""), 0) + 1
    salida.pop("", None)
    return salida
