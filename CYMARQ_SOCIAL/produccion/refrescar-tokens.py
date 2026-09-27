#!/usr/bin/env python3
"""Renovacion desatendida del token de larga duracion de Instagram.

POR QUE EXISTE
--------------
Los tokens `IGAA...` de *Instagram API with Instagram Login* caducan a los 60
dias, y Meta no ofrece forma de consultar esa fecha: `salud` como mucho puede
decir "valido ahora mismo". Sin este guion el token muere en silencio y
Instagram deja de publicar sin que salte ninguna alarma, mientras Facebook
sigue funcionando con normalidad. Ese fue exactamente el sintoma observado en
agosto de 2026: "solo se publico en Facebook".

COMO FUNCIONA
-------------
Meta permite refrescar un token vigente y devuelve otro con 60 dias nuevos.
Como la fecha no se puede consultar, la ANOTAMOS al renovar en
`CONFIG/tokens_estado.json`, y de ahi la lee `salud` para avisar con tiempo.

Solo renueva cuando faltan menos de `--margen` dias (10 por defecto), de modo
que es seguro ejecutarlo a diario desde un timer.

SEGURIDAD
---------
  - copia de seguridad FUERA del repositorio antes de escribir;
  - escritura atomica (temporal + os.replace) con permisos 600;
  - verificacion posterior: mismas claves y token bien escrito;
  - si algo no cuadra, RESTAURA la copia y sale con error.

El valor del token no se imprime nunca, ni en la salida ni en el diario. Un
token solo puede refrescarse mientras siga vigente y tenga mas de 24 h de
vida: por eso importa no dejar que caduque.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
import tempfile
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent        # .../CYMARQ_SOCIAL
REPO = BASE.parent                                    # .../cymarq-web
ENV = REPO / ".env.local"
ESTADO = BASE / "CONFIG" / "tokens_estado.json"       # ignorado por git
CLAVE = "INSTAGRAM_PUBLISH_TOKEN"

#: Las copias van a una carpeta propia FUERA del repositorio, para que nunca
#: puedan acabar en git y para que el servicio de systemd solo necesite
#: permiso de escritura sobre ella y no sobre todo /home.
RESPALDOS = Path.home() / "respaldos-tokens"
URL_REFRESCO = "https://graph.instagram.com/refresh_access_token"

MARGEN_POR_DEFECTO = 10      # dias antes de caducar en que se renueva
FORMATO_FECHA = "%Y-%m-%d %H:%M UTC"


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


def _scrub(texto) -> str:
    """Borra cualquier rastro de token antes de mostrar un texto."""
    return re.sub(r"(access_token=|IGAA)[A-Za-z0-9_\-.]+", r"\1<oculto>", str(texto))


# --------------------------------------------------------------------- #
# Estado anotado                                                         #
# --------------------------------------------------------------------- #


def leer_estado() -> dict:
    try:
        return json.loads(ESTADO.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def escribir_estado(datos: dict) -> None:
    ESTADO.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(ESTADO.parent), prefix=".tmp_estado_")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(datos, fh, ensure_ascii=False, indent=2)
        os.replace(tmp, ESTADO)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


def dias_restantes(estado: dict) -> float | None:
    caduca = (estado.get("instagram") or {}).get("caduca")
    if not caduca:
        return None
    try:
        fecha = datetime.fromisoformat(caduca)
    except ValueError:
        return None
    if fecha.tzinfo is None:
        fecha = fecha.replace(tzinfo=timezone.utc)
    return (fecha - _ahora()).total_seconds() / 86400.0


# --------------------------------------------------------------------- #
# .env.local                                                             #
# --------------------------------------------------------------------- #


def _claves(texto: str) -> dict:
    salida = {}
    for linea in texto.splitlines():
        s = linea.strip()
        if s and not s.startswith("#") and "=" in s:
            clave, _, valor = s.partition("=")
            salida[clave.strip()] = len(valor.strip())
    return salida


def leer_token() -> str:
    for linea in ENV.read_text(encoding="utf-8").splitlines():
        s = linea.strip()
        if s and not s.startswith("#") and "=" in s:
            clave, _, valor = s.partition("=")
            if clave.strip() == CLAVE:
                return valor.strip().strip('"').strip("'")
    return ""


def guardar_token(nuevo: str) -> Path:
    """Sustituye el token conservando el resto del fichero.

    Devuelve la ruta de la copia de seguridad. Si la verificacion posterior
    falla, restaura esa copia y lanza RuntimeError.
    """
    original = ENV.read_text(encoding="utf-8")
    marca = _ahora().strftime("%Y%m%d-%H%M%S")
    RESPALDOS.mkdir(parents=True, exist_ok=True)
    os.chmod(RESPALDOS, 0o700)
    copia = RESPALDOS / ("env.local.bak." + marca)
    shutil.copy2(ENV, copia)
    os.chmod(copia, 0o600)

    # Conservar solo las 10 copias mas recientes.
    antiguas = sorted(RESPALDOS.glob("env.local.bak.*"), reverse=True)[10:]
    for vieja in antiguas:
        try:
            vieja.unlink()
        except OSError:
            pass

    lineas = []
    sustituido = False
    for linea in original.splitlines():
        s = linea.strip()
        es_la_clave = (
            s and not s.startswith("#") and "=" in s
            and s.partition("=")[0].strip() == CLAVE
        )
        if es_la_clave:
            lineas.append(CLAVE + "=" + nuevo)
            sustituido = True
        else:
            lineas.append(linea)

    if not sustituido:
        raise RuntimeError("no se encontro la linea " + CLAVE + " en " + str(ENV))

    texto = "\n".join(lineas) + ("\n" if original.endswith("\n") else "")
    fd, tmp = tempfile.mkstemp(dir=str(ENV.parent), prefix=".env.tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(texto)
        os.chmod(tmp, 0o600)
        os.replace(tmp, ENV)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise

    antes = _claves(original)
    despues = _claves(ENV.read_text(encoding="utf-8"))
    if set(antes) != set(despues) or despues.get(CLAVE) != len(nuevo):
        shutil.copy2(copia, ENV)
        raise RuntimeError("el fichero no quedo integro: se restauro la copia")

    return copia


# --------------------------------------------------------------------- #
# Meta                                                                   #
# --------------------------------------------------------------------- #


def pedir_refresco(token: str):
    """Llama a ig_refresh_token. Devuelve (token_nuevo, segundos)."""
    url = URL_REFRESCO + "?grant_type=ig_refresh_token&access_token=" + token
    try:
        with urllib.request.urlopen(url, timeout=45) as respuesta:
            datos = json.load(respuesta)
    except urllib.error.HTTPError as exc:
        try:
            cuerpo = json.load(exc)
        except Exception:
            cuerpo = {}
        detalle = _scrub(json.dumps(cuerpo, ensure_ascii=False))[:300]
        raise RuntimeError("Meta respondio HTTP " + str(exc.code) + ": " + detalle) from None
    except Exception as exc:
        raise RuntimeError("error de red: " + _scrub(exc)[:200]) from None

    nuevo = datos.get("access_token", "")
    segundos = int(datos.get("expires_in") or 0)
    if not nuevo or len(nuevo) < 50 or segundos <= 0:
        raise RuntimeError("la respuesta de Meta no trae un token utilizable")
    return nuevo, segundos


# --------------------------------------------------------------------- #
# Acciones                                                               #
# --------------------------------------------------------------------- #


def sembrar(caduca_iso: str) -> int:
    """Anota una caducidad ya conocida, sin llamar a Meta."""
    try:
        fecha = datetime.fromisoformat(caduca_iso)
    except ValueError:
        print("  ERROR: fecha no valida (usa ISO, p. ej. 2026-11-25T23:41:00+00:00)",
              file=sys.stderr)
        return 1
    if fecha.tzinfo is None:
        fecha = fecha.replace(tzinfo=timezone.utc)

    estado = leer_estado()
    previo = (estado.get("instagram") or {}).get("renovaciones", 0)
    estado["instagram"] = {
        "caduca": fecha.isoformat(),
        "renovado": _ahora().isoformat(),
        "origen": "anotado a mano",
        "renovaciones": previo,
    }
    estado["actualizado"] = _ahora().isoformat()
    escribir_estado(estado)
    print("  caducidad anotada: " + fecha.strftime(FORMATO_FECHA))
    print("  estado -> " + str(ESTADO))
    return 0


def renovar(margen: int, forzar: bool, simular: bool) -> int:
    estado = leer_estado()
    restantes = dias_restantes(estado)

    if restantes is None:
        print("  sin registro previo de caducidad: se renueva para fijarla.")
    else:
        print("  caducidad anotada: quedan " + format(restantes, ".1f") + " dias")
        if restantes > margen and not forzar:
            print("  no hace falta renovar todavia (margen: " + str(margen) + " dias).")
            return 0
        if restantes <= 0:
            print("  AVISO: segun el registro ya caduco; se intenta de todos modos.")

    if simular:
        print("  SIMULACION: aqui se llamaria a Meta. No se toca nada.")
        return 0

    token = leer_token()
    if not token:
        print("  ERROR: no hay " + CLAVE + " en " + str(ENV), file=sys.stderr)
        return 1
    print("  token actual presente (longitud " + str(len(token)) + ")")

    try:
        nuevo, segundos = pedir_refresco(token)
    except RuntimeError as exc:
        print("  ERROR: " + str(exc), file=sys.stderr)
        return 1

    caduca = _ahora() + timedelta(seconds=segundos)
    print("  token nuevo recibido (longitud " + str(len(nuevo)) + ")")
    print("  vigencia " + format(segundos / 86400.0, ".1f") + " dias -> caduca "
          + caduca.strftime(FORMATO_FECHA))

    try:
        copia = guardar_token(nuevo)
    except (RuntimeError, OSError) as exc:
        print("  ERROR al escribir: " + str(exc), file=sys.stderr)
        return 1
    print("  copia de seguridad: " + str(copia))

    previo = (estado.get("instagram") or {}).get("renovaciones", 0)
    estado["instagram"] = {
        "caduca": caduca.isoformat(),
        "renovado": _ahora().isoformat(),
        "vigencia_dias": round(segundos / 86400.0, 1),
        "origen": "refresh_access_token",
        "renovaciones": previo + 1,
    }
    estado["actualizado"] = _ahora().isoformat()
    escribir_estado(estado)
    print("  renovado correctamente.")
    return 0


def main(argv=None) -> int:
    p = argparse.ArgumentParser(
        prog="refrescar-tokens",
        description="Renueva el token de Instagram si esta cerca de caducar.",
    )
    p.add_argument("--margen", type=int, default=MARGEN_POR_DEFECTO,
                   help="dias antes de caducar en que se renueva (def. "
                        + str(MARGEN_POR_DEFECTO) + ")")
    p.add_argument("--forzar", action="store_true",
                   help="renueva aunque falte mucho (Meta exige >24 h de vida)")
    p.add_argument("--simular", action="store_true",
                   help="dice que haria, sin llamar a Meta ni escribir")
    p.add_argument("--sembrar", metavar="FECHA_ISO",
                   help="anota una caducidad ya conocida, sin llamar a Meta")
    p.add_argument("--estado", action="store_true",
                   help="muestra la caducidad anotada y sale")
    a = p.parse_args(argv)

    if a.estado:
        est = leer_estado()
        if not est:
            print("  sin registro de caducidad todavia.")
            return 0
        print(json.dumps(est, ensure_ascii=False, indent=2))
        return 0

    if a.sembrar:
        return sembrar(a.sembrar)

    return renovar(a.margen, a.forzar, a.simular)


if __name__ == "__main__":
    raise SystemExit(main())
