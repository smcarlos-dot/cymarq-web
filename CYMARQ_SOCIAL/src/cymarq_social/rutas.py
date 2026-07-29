"""Resolucion de rutas del sistema CYMARQ SOCIAL.

Todas las rutas del proyecto se derivan de aqui. Ningun otro modulo debe
construir rutas absolutas a mano.
"""

from __future__ import annotations

from pathlib import Path

# .../CYMARQ_SOCIAL/src/cymarq_social/rutas.py -> .../CYMARQ_SOCIAL
RAIZ = Path(__file__).resolve().parents[2]

PROYECTOS = RAIZ / "PROYECTOS"
PENDIENTES = RAIZ / "PENDIENTES"
PUBLICADOS = RAIZ / "PUBLICADOS"
CONFIG = RAIZ / "CONFIG"

# Archivos de datos
ARCHIVO_CONFIG = CONFIG / "config.json"
ARCHIVO_INVENTARIO = CONFIG / "inventario_contenido.json"
ARCHIVO_HISTORIAL = CONFIG / "historial_publicaciones.json"
ARCHIVO_PERFILES = CONFIG / "perfiles_proyectos.json"
ARCHIVO_PLANTILLAS = CONFIG / "plantillas_copy.json"

# Carpetas de PUBLICADOS (estructura preparada para la fase 2)
PUBLICADOS_INSTAGRAM = PUBLICADOS / "instagram"
PUBLICADOS_FACEBOOK = PUBLICADOS / "facebook"
PUBLICADOS_ARCHIVO = PUBLICADOS / "_archivo"

_CARPETAS_ESCRITURA = (
    CONFIG,
    PENDIENTES,
    PUBLICADOS,
    PUBLICADOS_INSTAGRAM,
    PUBLICADOS_FACEBOOK,
    PUBLICADOS_ARCHIVO,
)


def asegurar_estructura() -> None:
    """Crea las carpetas de trabajo si no existen. Nunca toca PROYECTOS."""
    for carpeta in _CARPETAS_ESCRITURA:
        carpeta.mkdir(parents=True, exist_ok=True)


def ruta_relativa(ruta: Path) -> str:
    """Devuelve la ruta relativa a la raiz del sistema, en formato portable."""
    ruta = Path(ruta).resolve()
    try:
        return ruta.relative_to(RAIZ).as_posix()
    except ValueError:
        return ruta.as_posix()
