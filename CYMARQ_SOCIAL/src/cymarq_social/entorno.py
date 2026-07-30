"""Identidad del entorno: ¿esta maquina puede publicar de verdad?

Solo la VM de Google Cloud es entorno de PRODUCCION. Cualquier otra maquina,
incluido el PC de desarrollo, es DESARROLLO y no puede publicar aunque el gate
este abierto, existan credenciales validas y alguien ejecute el comando a mano.

COMO SE DECIDE, Y POR QUE ASI
-----------------------------
La autoridad es un fichero marcador, `CONFIG/entorno.json`, que existe SOLO en
la VM y esta en `.gitignore`. Dentro guarda el `machine-id` de la maquina donde
se creo.

    { "entorno": "production", "machine_id": "...", "creado_en": "..." }

Dos condiciones, y hacen falta las dos:

  1. el marcador dice "production";
  2. el `machine_id` del marcador coincide con el de esta maquina.

La segunda condicion es la que hace que el marcador no sea copiable: si alguien
lo trae en un backup, un zip o un `git add -f`, en otra maquina no vale. No se
usa el hostname, que se puede cambiar con una orden.

La variable `CYMARQ_ENV` puede DEGRADAR a desarrollo, nunca ascender a
produccion. Sirve para ensayar en la propia VM sin poder publicar. Un
`CYMARQ_ENV=production` en el PC no habilita nada.

Este modulo no importa nada del sistema salvo rutas: se consulta desde el punto
mas bajo del flujo, y tiene que poder responder aunque el resto falle.
"""

from __future__ import annotations

import json
import os
import platform
from pathlib import Path
from typing import Any

from . import rutas

PRODUCCION = "production"
DESARROLLO = "development"

ARCHIVO_MARCADOR = rutas.CONFIG / "entorno.json"


def machine_id() -> str | None:
    """Identificador estable de la maquina. `None` si no se puede leer.

    En Linux viene de systemd. En Windows no existe, y devolver `None` es la
    respuesta correcta: sin identidad comprobable no hay produccion.
    """
    for ruta in ("/etc/machine-id", "/var/lib/dbus/machine-id"):
        try:
            valor = Path(ruta).read_text(encoding="utf-8").strip()
            if valor:
                return valor
        except OSError:
            continue
    return None


def leer_marcador() -> dict[str, Any]:
    try:
        return json.loads(ARCHIVO_MARCADOR.read_text(encoding="utf-8"))
    except Exception:
        return {}


def entorno() -> str:
    """Devuelve "production" o "development". Ante cualquier duda, desarrollo."""
    marcador = leer_marcador()
    if marcador.get("entorno") != PRODUCCION:
        return DESARROLLO

    esperado = marcador.get("machine_id")
    actual = machine_id()
    if not esperado or not actual or esperado != actual:
        # Marcador de otra maquina: se ignora. Asi no viaja en un backup.
        return DESARROLLO

    # La variable solo puede degradar.
    if (os.environ.get("CYMARQ_ENV") or "").strip().lower() == DESARROLLO:
        return DESARROLLO

    return PRODUCCION


def es_produccion() -> bool:
    return entorno() == PRODUCCION


def detalle() -> dict[str, Any]:
    """Explicacion legible de por que esta maquina es lo que es."""
    marcador = leer_marcador()
    actual = machine_id()
    esperado = marcador.get("machine_id")
    env = (os.environ.get("CYMARQ_ENV") or "").strip().lower() or None

    if not marcador:
        motivo = "no existe CONFIG/entorno.json: esta maquina es de desarrollo"
    elif marcador.get("entorno") != PRODUCCION:
        motivo = f"el marcador dice '{marcador.get('entorno')}', no '{PRODUCCION}'"
    elif not actual:
        motivo = "no se puede leer el machine-id de esta maquina"
    elif esperado != actual:
        motivo = "el marcador pertenece a otra maquina (machine-id distinto)"
    elif env == DESARROLLO:
        motivo = "CYMARQ_ENV=development degrada esta ejecucion a desarrollo"
    else:
        motivo = "marcador de produccion valido para esta maquina"

    return {
        "entorno": entorno(),
        "motivo": motivo,
        "marcador_presente": bool(marcador),
        "marcador": str(ARCHIVO_MARCADOR),
        "machine_id_coincide": bool(actual and esperado and actual == esperado),
        "cymarq_env": env,
        "host": platform.node(),
        "sistema": platform.system(),
    }


def marcar_produccion() -> dict[str, Any]:
    """Crea el marcador de produccion para ESTA maquina.

    Se ejecuta una sola vez, a mano, en la VM. No se versiona.
    """
    from datetime import datetime, timezone

    identificador = machine_id()
    if not identificador:
        raise RuntimeError(
            "No hay machine-id legible: esta maquina no puede marcarse como "
            "produccion. Solo Linux con systemd."
        )
    datos = {
        "entorno": PRODUCCION,
        "machine_id": identificador,
        "host": platform.node(),
        "creado_en": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "nota": "Marcador de produccion. No versionar. Solo vale en esta maquina.",
    }
    ARCHIVO_MARCADOR.parent.mkdir(parents=True, exist_ok=True)
    ARCHIVO_MARCADOR.write_text(
        json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return datos
