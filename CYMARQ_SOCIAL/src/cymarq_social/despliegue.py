"""Envio de contenido del PC a la VM de produccion. NO publica.

`enviar_vm(ID)` hace el viaje completo:

    exportar -> transferir por gcloud scp -> importar en la VM -> verificar

Enviar NO es publicar. Lo unico que consigue es que la propuesta exista en el
estado operativo de produccion. A partir de ahi siguen mandando las seis
barreras de siempre: entorno, gate, autorizacion, preflight, lock y
antiduplicacion.

Este modulo solo se usa desde el PC. En la VM no tiene sentido y no se invoca.
"""

from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from . import transferencia

# Datos de la VM de produccion. No son secretos.
VM = "cymarq-social"
ZONA = "us-central1-a"
USUARIO = "celassor"
BASE_REMOTA = "/home/celassor/cymarq-web"
ENTRADA_REMOTA = f"{BASE_REMOTA}/CYMARQ_SOCIAL/PAQUETES_ENTRADA"
PY_REMOTO = f"{BASE_REMOTA}/CYMARQ_SOCIAL/.venv/bin/python"


class ErrorDespliegue(RuntimeError):
    """No se pudo completar el envio."""


@dataclass
class Paso:
    nombre: str
    ok: bool
    detalle: str = ""


@dataclass
class Envio:
    job_id: str
    ok: bool = False
    pasos: list[Paso] = field(default_factory=list)
    paquete: str = ""
    salida_remota: str = ""

    def paso(self, nombre: str, ok: bool, detalle: str = "") -> None:
        self.pasos.append(Paso(nombre, ok, detalle))


def _gcloud() -> str:
    ruta = shutil.which("gcloud")
    if not ruta:
        raise ErrorDespliegue(
            "No se encontro 'gcloud' en el PATH. Hace falta el CLI de Google Cloud."
        )
    return ruta


def _ssh(orden: str, tiempo_limite: int = 300) -> subprocess.CompletedProcess:
    return subprocess.run(
        [_gcloud(), "compute", "ssh", f"{USUARIO}@{VM}", f"--zone={ZONA}",
         "--quiet", f"--command={orden}"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=tiempo_limite, check=False,
    )


def _scp(local: Path, remoto: str, tiempo_limite: int = 300) -> subprocess.CompletedProcess:
    return subprocess.run(
        [_gcloud(), "compute", "scp", str(local), f"{USUARIO}@{VM}:{remoto}",
         f"--zone={ZONA}", "--quiet"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=tiempo_limite, check=False,
    )


def enviar_vm(job_id: str, simular: bool = False) -> Envio:
    """Exporta, transfiere e importa en la VM. Nunca publica."""
    envio = Envio(job_id=job_id)

    # --- 1. Exportar ---
    try:
        paquete = transferencia.exportar(job_id)
    except transferencia.ErrorTransferencia as exc:
        envio.paso("exportar", False, str(exc))
        return envio
    envio.paquete = str(paquete)
    envio.paso("exportar", True, f"{paquete.name} ({paquete.stat().st_size} bytes)")

    # --- 2. Preparar la carpeta de entrada en la VM ---
    r = _ssh(f"mkdir -p {ENTRADA_REMOTA} && echo listo")
    if r.returncode != 0 or "listo" not in (r.stdout or ""):
        envio.paso("preparar VM", False, (r.stderr or r.stdout or "")[-200:])
        return envio
    envio.paso("preparar VM", True, ENTRADA_REMOTA)

    # --- 3. Transferir ---
    r = _scp(paquete, f"{ENTRADA_REMOTA}/{paquete.name}")
    if r.returncode != 0:
        envio.paso("transferir", False, (r.stderr or "")[-200:])
        return envio
    envio.paso("transferir", True, f"{paquete.name} -> VM")

    # --- 4. Importar en la VM ---
    bandera = " --simular" if simular else ""
    orden = (
        f"cd {BASE_REMOTA}/CYMARQ_SOCIAL && "
        f"{PY_REMOTO} cymarq.py importar {ENTRADA_REMOTA}/{paquete.name}{bandera}"
    )
    r = _ssh(orden)
    envio.salida_remota = (r.stdout or "") + (r.stderr or "")
    if r.returncode != 0:
        envio.paso("importar", False, "la importacion remota devolvio error")
        return envio
    envio.paso("importar", True, "importada en produccion" if not simular else "simulada")

    # --- 5. Verificar en la VM, de forma independiente ---
    verificacion = (
        f"cd {BASE_REMOTA}/CYMARQ_SOCIAL && {PY_REMOTO} -c "
        f"\"import sys;sys.path.insert(0,'src');"
        f"from cymarq_social import historial as H;"
        f"r=H.buscar('{job_id}');"
        f"print('VERIFICADO' if r else 'AUSENTE', r['estado'] if r else '', "
        f"r.get('programado_para') or '' if r else '')\""
    )
    r = _ssh(verificacion)
    salida = (r.stdout or "").strip()
    if simular:
        envio.paso("verificar", "AUSENTE" in salida,
                   "simulacion: la VM no debe tenerla todavia — " + salida)
        envio.ok = "AUSENTE" in salida
    else:
        envio.paso("verificar", "VERIFICADO" in salida, salida)
        envio.ok = "VERIFICADO" in salida

    return envio


def estado_vm() -> dict[str, Any]:
    """Resumen del estado operativo de la VM. Solo lectura."""
    orden = (
        f"cd {BASE_REMOTA}/CYMARQ_SOCIAL && {PY_REMOTO} -c "
        "\"import sys,json;sys.path.insert(0,'src');"
        "from cymarq_social import historial as H, ejecutor as E;"
        "from collections import Counter;"
        "p=H.cargar()['publicaciones'];"
        "f=[x['programado_para'] for x in p if x.get('programado_para')];"
        "print(json.dumps({'publicaciones':len(p),"
        "'por_estado':dict(Counter(x['estado'] for x in p)),"
        "'franjas':len(f),'primera':min(f) if f else None,'ultima':max(f) if f else None,"
        "'motor':E.estado_motor()}))\""
    )
    r = _ssh(orden)
    import json as _json
    for linea in reversed((r.stdout or "").strip().splitlines()):
        try:
            return _json.loads(linea)
        except _json.JSONDecodeError:
            continue
    return {"error": (r.stderr or r.stdout or "sin respuesta")[-300:]}
