"""Guardas de seguridad del sistema de archivos.

Regla inviolable del proyecto: PROYECTOS es SOLO LECTURA.

Toda escritura del sistema pasa por este modulo. Si una ruta de destino cae
dentro de PROYECTOS, la operacion aborta con ErrorSeguridad antes de tocar el
disco. No existe ninguna funcion aqui que borre, mueva o sobrescriba originales.
"""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

from . import rutas


class ErrorSeguridad(RuntimeError):
    """Se intento una operacion prohibida sobre el material original."""


def _dentro_de(ruta: Path, contenedor: Path) -> bool:
    try:
        Path(ruta).resolve().relative_to(Path(contenedor).resolve())
        return True
    except ValueError:
        return False


def es_original(ruta: Path | str) -> bool:
    """True si la ruta pertenece al material original intocable."""
    return _dentro_de(Path(ruta), rutas.PROYECTOS)


def verificar_destino(destino: Path | str) -> Path:
    """Valida que se pueda escribir en `destino`. Devuelve la ruta resuelta."""
    destino = Path(destino).resolve()

    if es_original(destino):
        raise ErrorSeguridad(
            f"BLOQUEADO: escritura dentro de PROYECTOS -> {destino}. "
            "El material original es de solo lectura."
        )

    if not _dentro_de(destino, rutas.RAIZ):
        raise ErrorSeguridad(
            f"BLOQUEADO: escritura fuera de CYMARQ_SOCIAL -> {destino}."
        )

    return destino


def verificar_origen(origen: Path | str) -> Path:
    """Valida que `origen` exista y sea un archivo legible."""
    origen = Path(origen).resolve()
    if not origen.is_file():
        raise ErrorSeguridad(f"El archivo de origen no existe: {origen}")
    return origen


def copiar_material(origen: Path | str, destino: Path | str) -> Path:
    """Copia un archivo de PROYECTOS hacia una carpeta de trabajo.

    - Nunca mueve ni renombra el original.
    - Nunca sobrescribe un archivo existente en destino: si el nombre esta
      ocupado, agrega un sufijo numerico.
    - Preserva fecha y metadatos con copy2.
    """
    origen = verificar_origen(origen)
    destino = verificar_destino(destino)

    destino.parent.mkdir(parents=True, exist_ok=True)

    final = destino
    contador = 1
    while final.exists():
        final = destino.with_name(f"{destino.stem}_{contador}{destino.suffix}")
        contador += 1

    shutil.copy2(origen, final)

    # El original debe seguir intacto tras la copia.
    if not origen.is_file():
        raise ErrorSeguridad(
            f"ALERTA: el original desaparecio tras la copia: {origen}"
        )

    return final


def escribir_json(destino: Path | str, datos: Any) -> Path:
    """Escribe JSON UTF-8 de forma atomica dentro de las carpetas permitidas."""
    destino = verificar_destino(destino)
    destino.parent.mkdir(parents=True, exist_ok=True)

    tmp_fd, tmp_nombre = tempfile.mkstemp(
        dir=str(destino.parent), prefix=".tmp_", suffix=".json"
    )
    try:
        with os.fdopen(tmp_fd, "w", encoding="utf-8") as fh:
            json.dump(datos, fh, ensure_ascii=False, indent=2)
        os.replace(tmp_nombre, destino)
    except BaseException:
        Path(tmp_nombre).unlink(missing_ok=True)
        raise

    return destino


def leer_json(origen: Path | str, por_defecto: Any = None) -> Any:
    """Lee un JSON UTF-8. Devuelve `por_defecto` si no existe o esta corrupto."""
    origen = Path(origen)
    if not origen.is_file():
        return por_defecto
    try:
        with origen.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except (json.JSONDecodeError, OSError):
        return por_defecto


def escribir_texto(destino: Path | str, texto: str) -> Path:
    """Escribe un archivo de texto UTF-8 dentro de las carpetas permitidas."""
    destino = verificar_destino(destino)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(texto, encoding="utf-8")
    return destino
