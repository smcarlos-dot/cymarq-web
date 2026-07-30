"""Limpieza de material pesado de publicaciones ya confirmadas.

La VM tiene 10 GB. Una vez que una publicacion esta confirmada en Instagram y
en Facebook, su copia de trabajo en PENDIENTES ya no sirve para nada: la imagen
que Meta descargo vive en `public/social/`, y todo lo que hace falta para
auditar, reconciliar y no duplicar esta en el historial y en los diarios.

    limpiar_publicacion(ID)   -> borra solo lo pesado de UNA publicacion
    limpiar_publicadas()      -> recorre todas las que cumplan las condiciones

QUE SE BORRA Y QUE NO
---------------------
Se borra: la COPIA de la imagen en PENDIENTES. Nada mas.

Se conserva siempre: el registro del historial completo (identificadores de
Meta, permalinks, fechas, id_archivo), el `metadata.json` de la carpeta, los
diarios antiduplicados y la imagen publica de `public/social/`.

CUANDO SE PUEDE LIMPIAR
-----------------------
Solo si TODAS estas condiciones se cumplen a la vez:

  - el estado global es "publicada";
  - cada plataforma prevista figura como publicada Y con su identificador;
  - los diarios de Node tienen el registro correspondiente con su id.

Basta con que una plataforma este parcial, fallida, pendiente o en
verificacion para que no se toque nada. Ante la duda, no se borra: el espacio
se recupera; una publicacion que no se puede reconciliar, no.

POR QUE NO SE TOCA public/social/
---------------------------------
Esas imagenes NO son de la VM: pertenecen al repositorio, las sirve Cloudflare
y son las que Meta descargo. Borrarlas de la VM dejaria el arbol de git sucio y
el siguiente `git pull` las traeria de vuelta. Borrarlas del repositorio, ademas,
las quitaria del sitio publico. No entran en esta limpieza.
"""

from __future__ import annotations

import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from . import ejecutor, historial, programacion, rutas

#: Extensiones que se consideran material pesado de trabajo.
PESADAS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp", ".mp4", ".mov"}


@dataclass
class Candidata:
    id: str
    proyecto: str = ""
    limpiable: bool = False
    motivo: str = ""
    bytes_liberables: int = 0
    archivos: list[str] = field(default_factory=list)
    ya_limpia: bool = False


def _diario_confirma(job_id: str, plataforma: str) -> bool:
    """¿El diario de Node tiene el identificador de esta plataforma?"""
    entrada = ejecutor.leer_diario_node(plataforma, job_id)
    if not entrada:
        return False
    _, campo = ejecutor.DIARIOS[plataforma]
    return bool(entrada.get(campo))


def evaluar(pub: dict[str, Any]) -> Candidata:
    """Decide si una publicacion puede limpiarse, y por que si o por que no."""
    c = Candidata(id=pub.get("id", ""), proyecto=pub.get("proyecto_nombre", ""))

    if pub.get("estado") != "publicada":
        c.motivo = f"estado '{pub.get('estado')}': solo se limpia lo publicado"
        return c

    plataformas = ejecutor.estado_plataformas(pub)
    previstas = pub.get("plataforma") or list(plataformas)

    for p in previstas:
        d = plataformas.get(p) or {}
        if d.get("estado") != ejecutor.PUBLICADA:
            c.motivo = f"{p} esta en '{d.get('estado')}', no confirmada"
            return c
        if not d.get("id"):
            c.motivo = f"{p} no tiene identificador de Meta registrado"
            return c
        if not _diario_confirma(c.id, p):
            c.motivo = f"el diario de {p} no confirma esta publicacion"
            return c

    # Todo confirmado: se mide lo que hay que borrar.
    carpeta = rutas.RAIZ / (pub.get("carpeta_pendiente") or "")
    if not carpeta.is_dir():
        c.limpiable = False
        c.ya_limpia = True
        c.motivo = "sin carpeta de trabajo: ya estaba limpia"
        return c

    for archivo in carpeta.rglob("*"):
        if archivo.is_file() and archivo.suffix.lower() in PESADAS:
            c.archivos.append(str(archivo.relative_to(carpeta)))
            c.bytes_liberables += archivo.stat().st_size

    if not c.archivos:
        c.ya_limpia = True
        c.motivo = "no queda material pesado: ya estaba limpia"
        return c

    c.limpiable = True
    c.motivo = "confirmada en todas sus plataformas"
    return c


def limpiar_publicacion(job_id: str, simular: bool = False) -> Candidata:
    """Borra la copia de trabajo de UNA publicacion confirmada.

    Idempotente: si ya estaba limpia, no hace nada y no falla.
    """
    pub = historial.buscar(job_id)
    if pub is None:
        c = Candidata(id=job_id)
        c.motivo = "no existe"
        return c

    c = evaluar(pub)
    if not c.limpiable or simular:
        return c

    carpeta = rutas.RAIZ / pub["carpeta_pendiente"]
    borrados = 0
    for relativo in list(c.archivos):
        objetivo = carpeta / relativo
        # Nunca se sale de la carpeta de la propuesta.
        try:
            objetivo.resolve().relative_to(carpeta.resolve())
        except ValueError:
            continue
        if objetivo.is_file():
            objetivo.unlink()
            borrados += 1

    # La carpeta se conserva con su metadata.json: pesa unos pocos KB y es la
    # unica copia legible de lo que se publico, al margen del historial.
    imagen = carpeta / "imagen"
    if imagen.is_dir() and not any(imagen.iterdir()):
        imagen.rmdir()

    historial.actualizar(job_id, {
        "material_limpiado_en": programacion.guardar_iso(programacion.ahora()),
        "material_limpiado": borrados,
    })
    c.ya_limpia = True
    c.motivo = f"limpiada: {borrados} archivos"
    return c


def limpiar_publicadas(simular: bool = False) -> dict[str, Any]:
    """Recorre el historial y limpia todo lo que cumpla las condiciones."""
    resultados = [evaluar(p) for p in historial.cargar()["publicaciones"]]
    limpiables = [c for c in resultados if c.limpiable]

    if not simular:
        limpiables = [limpiar_publicacion(c.id) for c in limpiables]

    return {
        "revisadas": len(resultados),
        "limpiadas": len([c for c in limpiables if c.ya_limpia or c.limpiable]),
        "bytes": sum(c.bytes_liberables for c in limpiables),
        "detalle": limpiables,
        "no_limpiables": [c for c in resultados if not c.limpiable and not c.ya_limpia],
        "ya_limpias": len([c for c in resultados if c.ya_limpia]),
        "simulado": simular,
    }


# --------------------------------------------------------------------- #
# Retencion de artefactos que no son publicaciones                       #
# --------------------------------------------------------------------- #

#: Cuanto se guarda cada cosa antes de considerarla desechable.
RETENCION_DIAS = {
    "PAQUETES": 7,                 # paquetes de transferencia ya importados
    "PAQUETES_ENTRADA": 7,
    "respaldos-importacion": 14,   # respaldos de importaciones correctas
}


def evaluar_retencion() -> list[dict[str, Any]]:
    """Artefactos que ya pasaron su periodo de retencion. No borra."""
    ahora = programacion.ahora().timestamp()
    hallazgos: list[dict[str, Any]] = []

    for nombre, dias in RETENCION_DIAS.items():
        for base in (rutas.RAIZ / nombre, rutas.CONFIG / nombre):
            if not base.is_dir():
                continue
            for elemento in base.iterdir():
                edad = (ahora - elemento.stat().st_mtime) / 86400
                if edad > dias:
                    tam = (sum(f.stat().st_size for f in elemento.rglob("*") if f.is_file())
                           if elemento.is_dir() else elemento.stat().st_size)
                    hallazgos.append({
                        "ruta": str(elemento), "dias": round(edad, 1),
                        "limite": dias, "bytes": tam,
                    })
    return hallazgos


def espacio() -> dict[str, Any]:
    """Cuanto ocupa cada cosa. Para poder decidir con datos, no de memoria."""
    def tam(p: Path) -> int:
        if not p.exists():
            return 0
        if p.is_file():
            return p.stat().st_size
        return sum(f.stat().st_size for f in p.rglob("*") if f.is_file())

    from . import catalogo_social
    repo = catalogo_social.repo_web()
    total, usado, libre = shutil.disk_usage(str(rutas.RAIZ))

    return {
        "disco_total": total, "disco_usado": usado, "disco_libre": libre,
        "componentes": {
            "PENDIENTES": tam(rutas.PENDIENTES),
            "PENDIENTES/_descartadas": tam(rutas.PENDIENTES / "_descartadas"),
            "PUBLICADOS": tam(rutas.PUBLICADOS),
            "CONFIG": tam(rutas.CONFIG),
            "produccion/logs": tam(rutas.RAIZ / "produccion" / "logs"),
            "PAQUETES": tam(rutas.RAIZ / "PAQUETES"),
            ".venv": tam(rutas.RAIZ / ".venv"),
            "public/social": tam(repo / "public" / "social"),
            ".git": tam(repo / ".git"),
            "node_modules": tam(repo / "node_modules"),
        },
    }
