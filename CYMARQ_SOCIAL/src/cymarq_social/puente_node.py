"""Puente entre el orquestador Python y los publicadores Node de 09 WEB.

Reparto de responsabilidades, deliberado:

  - Python (este sistema) decide QUE se publica, CUANDO y con QUE texto.
  - Node (09 WEB/scripts) es lo unico que habla con Meta.

Nada de este modulo llama a la Graph API. Se limita a montar los argumentos y
lanzar el script Node que corresponda, capturando su salida.

FASE 2 - MODO SEGURO. Aqui solo existen invocaciones de ENSAYO. La bandera
`--confirm`, que es la que hace publicar de verdad, no se anade nunca: esta
prohibida explicitamente en `_construir_orden()`. Mientras eso siga asi, este
modulo no puede publicar aunque se le llame por error.

Los tokens NO pasan por aqui. Viven en `09 WEB/.env.local` y los lee el propio
script Node. Este modulo nunca los ve, ni los recibe, ni los registra.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from . import catalogo_social, rutas

# --------------------------------------------------------------------- #
# Localizacion del repositorio Node                                      #
# --------------------------------------------------------------------- #

#: Se resuelve igual que en el catalogo: `09 WEB` puede ser la carpeta
#: hermana o, una vez integrado el repositorio, la carpeta que nos contiene.
REPO_WEB = catalogo_social.repo_web()

SCRIPTS = {
    ("instagram", "dry-run"): "scripts/instagram-dry-run.mjs",
    ("instagram", "publicar"): "scripts/instagram-publish.mjs",
    ("instagram", "verificar"): "scripts/instagram-verify.mjs",
    ("facebook", "dry-run"): "scripts/facebook-dry-run.mjs",
    ("facebook", "publicar"): "scripts/facebook-publish.mjs",
    ("facebook", "verificar"): "scripts/facebook-verify.mjs",
}

PLATAFORMAS = ("instagram", "facebook")


class PuenteError(RuntimeError):
    """Problema de configuracion del puente, antes de lanzar nada."""


class PublicacionNoAutorizada(RuntimeError):
    """Se intento publicar de verdad desde la fase 2. Prohibido por codigo."""


# --------------------------------------------------------------------- #
# Resultado                                                              #
# --------------------------------------------------------------------- #


@dataclass
class ResultadoNode:
    """Lo que devolvio un script Node."""

    plataforma: str
    accion: str
    orden: list[str]
    codigo_salida: int | None = None
    salida: str = ""
    errores: str = ""
    ejecutado: bool = False
    motivo: str = ""

    @property
    def ok(self) -> bool:
        return self.ejecutado and self.codigo_salida == 0


@dataclass
class Trabajo:
    """Los datos que necesita un publicador Node para una propuesta."""

    id: str
    metadata: Path
    url_imagen: str
    proyecto: str = ""
    plataformas: tuple[str, ...] = PLATAFORMAS
    avisos: list[str] = field(default_factory=list)

    def argumentos(self) -> list[str]:
        return [
            f"--job={self.id}",
            f"--metadata={self.metadata}",
            f"--image-url={self.url_imagen}",
        ]


# --------------------------------------------------------------------- #
# Preparacion                                                            #
# --------------------------------------------------------------------- #


def _ruta_metadata(registro: dict[str, Any]) -> Path:
    """Localiza el metadata.json de la propuesta a partir del historial."""
    carpeta = registro.get("carpeta_pendiente", "")
    if not carpeta:
        raise PuenteError(f"La propuesta {registro.get('id')} no tiene carpeta_pendiente.")
    ruta = (rutas.RAIZ / carpeta / "metadata.json").resolve()
    if not ruta.is_file():
        raise PuenteError(f"No existe el metadata de la propuesta: {ruta}")
    return ruta


def preparar(registro: dict[str, Any], url_imagen: str | None = None) -> Trabajo:
    """Convierte un registro del historial en un Trabajo listo para Node.

    La URL publica sale del CATALOGO SOCIAL (`catalogo_social`), no se inventa
    nunca. Orden de resolucion:

      1. la que se pase a mano en `url_imagen`;
      2. el manifiesto del catalogo, buscando por `id_archivo`;
      3. el campo `url_imagen_publica` del metadata, por compatibilidad.

    Si ninguna existe se ABORTA. Improvisar una URL solo conseguiria que Meta
    recibiera un 404 en mitad de una publicacion.
    """
    id_publicacion = registro.get("id", "")
    if not id_publicacion:
        raise PuenteError("El registro no tiene id.")

    metadata = _ruta_metadata(registro)
    datos = json.loads(metadata.read_text(encoding="utf-8"))

    id_archivo = registro.get("id_archivo") or datos.get("id_archivo") or ""
    url = (
        url_imagen
        or (catalogo_social.url_publica(id_archivo) if id_archivo else None)
        or datos.get("url_imagen_publica")
        or ""
    )
    if not url:
        raise PuenteError(
            f"La propuesta {id_publicacion} no tiene imagen en el catalogo publico.\n"
            f"  id_archivo: {id_archivo or '(desconocido)'}\n"
            "  Preparalo antes con:  python cymarq.py catalogo\n"
            "  No se improvisa ninguna URL."
        )
    if not url.startswith("https://"):
        raise PuenteError(f"La URL de la imagen debe ser HTTPS: {url}")

    plataformas = tuple(
        p for p in registro.get("plataforma", PLATAFORMAS) if p in PLATAFORMAS
    ) or PLATAFORMAS

    avisos: list[str] = []
    for plataforma in plataformas:
        texto = (datos.get("texto") or {}).get(plataforma, "")
        if not texto:
            avisos.append(f"La propuesta no tiene texto para {plataforma}.")

    return Trabajo(
        id=id_publicacion,
        metadata=metadata,
        url_imagen=url,
        proyecto=registro.get("proyecto_nombre", ""),
        plataformas=plataformas,
        avisos=avisos,
    )


# --------------------------------------------------------------------- #
# Ejecucion                                                              #
# --------------------------------------------------------------------- #


def _ruta_node() -> str:
    ruta = shutil.which("node")
    if not ruta:
        raise PuenteError("No se encontro 'node' en el PATH. Instala Node.js o revisa el PATH.")
    return ruta


def _construir_orden(plataforma: str, accion: str, trabajo: Trabajo | None) -> list[str]:
    if plataforma not in PLATAFORMAS:
        raise PuenteError(f"Plataforma desconocida: {plataforma}")
    if accion == "publicar":
        # Guarda de la fase 2. No basta con no pasar --confirm: se corta antes.
        raise PublicacionNoAutorizada(
            "El puente esta en modo seguro (fase 2) y no puede publicar. "
            "La publicacion real se habilitara en una fase posterior."
        )

    script = SCRIPTS.get((plataforma, accion))
    if not script:
        raise PuenteError(f"No hay script para {plataforma}/{accion}.")

    ruta_script = REPO_WEB / script
    if not ruta_script.is_file():
        raise PuenteError(f"No existe el script Node: {ruta_script}")

    orden = [_ruta_node(), str(ruta_script)]
    if trabajo is not None:
        orden += trabajo.argumentos()
    return orden


def ejecutar(
    plataforma: str,
    accion: str,
    trabajo: Trabajo | None = None,
    tiempo_limite: int = 180,
) -> ResultadoNode:
    """Lanza un script Node y devuelve su salida. Nunca publica."""
    orden = _construir_orden(plataforma, accion, trabajo)
    resultado = ResultadoNode(plataforma=plataforma, accion=accion, orden=orden)

    # Entorno heredado tal cual: los tokens los lee el script de .env.local.
    # No se inyecta ninguna credencial desde Python.
    try:
        proceso = subprocess.run(
            orden,
            cwd=str(REPO_WEB),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=tiempo_limite,
            env=os.environ.copy(),
            check=False,
        )
    except subprocess.TimeoutExpired:
        resultado.motivo = f"El script no termino en {tiempo_limite} s."
        return resultado
    except OSError as exc:
        resultado.motivo = f"No se pudo lanzar el script: {exc}"
        return resultado

    resultado.ejecutado = True
    resultado.codigo_salida = proceso.returncode
    resultado.salida = proceso.stdout or ""
    resultado.errores = proceso.stderr or ""
    return resultado


def ensayo(trabajo: Trabajo, plataformas: tuple[str, ...] | None = None) -> dict[str, ResultadoNode]:
    """Ejecuta el dry-run de cada plataforma del trabajo. No escribe en Meta."""
    objetivo = plataformas or trabajo.plataformas
    return {p: ejecutar(p, "dry-run", trabajo) for p in objetivo}


# --------------------------------------------------------------------- #
# Diagnostico                                                            #
# --------------------------------------------------------------------- #


def diagnostico() -> dict[str, Any]:
    """Comprueba que el puente puede funcionar. No ejecuta nada ni usa red."""
    env_local = REPO_WEB / ".env.local"
    scripts_ok = {
        f"{p}/{a}": (REPO_WEB / s).is_file() for (p, a), s in SCRIPTS.items()
    }
    return {
        "repo_web": str(REPO_WEB),
        "repo_web_existe": REPO_WEB.is_dir(),
        "node": shutil.which("node") or "(no encontrado)",
        "env_local_presente": env_local.is_file(),
        "scripts": scripts_ok,
        "modo": "seguro (solo dry-run; publicar esta prohibido por codigo)",
    }
