#!/usr/bin/env bash
#
# Un ciclo del motor de CYMARQ SOCIAL. Lo llama el servicio de systemd.
#
# Hace tres cosas, en este orden y siempre el mismo:
#
#   1. salud       ¿estan las credenciales y el sistema en condiciones?
#   2. programadas ¿alguna programacion ha vencido? -> lista_para_publicar
#   3. ejecutar    el motor decide plataforma por plataforma
#
# Si la salud da ERROR se para antes del paso 2. Preferimos no publicar a
# publicar con el sistema a medias: una publicacion que falta se recupera, una
# publicacion mal hecha no.
#
# El guion NO decide si se publica. Eso lo deciden, dentro del motor, la
# barrera de entorno, el gate, las autorizaciones, el preflight y los locks.
#
set -uo pipefail

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PY="$BASE/.venv/bin/python"
LOGS="$BASE/produccion/logs"
LOG="$LOGS/cymarq-social.log"

mkdir -p "$LOGS"

# Rotacion sencilla: un solo fichero, y cuando pasa de 5 MB se archiva. Nada de
# logrotate para no anadir otra pieza que mantener.
if [ -f "$LOG" ] && [ "$(stat -c%s "$LOG")" -gt 5242880 ]; then
  mv "$LOG" "$LOG.$(date +%Y%m%d-%H%M%S)"
  ls -1t "$LOGS"/cymarq-social.log.* 2>/dev/null | tail -n +6 | xargs -r rm --
fi

registrar() {
  printf '%s  %s\n' "$(TZ=America/Bogota date '+%Y-%m-%d %H:%M:%S %Z')" "$*" >> "$LOG"
}

registrar "----- ciclo inicio (pid $$) -----"

if [ ! -x "$PY" ]; then
  registrar "ERROR: no existe el interprete $PY"
  exit 1
fi

cd "$BASE" || { registrar "ERROR: no se pudo entrar en $BASE"; exit 1; }

# --- 1. Salud ---------------------------------------------------------
SALUD_JSON="$("$PY" cymarq.py salud --json 2>>"$LOG")"
SALUD_ESTADO="$(printf '%s' "$SALUD_JSON" | "$PY" -c 'import json,sys;print(json.load(sys.stdin).get("general","ERROR"))' 2>/dev/null || echo ERROR)"
registrar "salud: $SALUD_ESTADO"

if [ "$SALUD_ESTADO" = "ERROR" ]; then
  registrar "ABORTADO: la salud del sistema es ERROR. No se ejecuta el motor."
  printf '%s' "$SALUD_JSON" | "$PY" -c 'import json,sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for c in d.get("sistema", []):
    if c.get("estado") == "ERROR":
        print("  componente:", c["nombre"], "-", c["mensaje"])
for p, v in (d.get("meta", {}).get("plataformas") or {}).items():
    if v.get("estado") == "ERROR":
        print("  credenciales:", p, "-", v.get("estado"))' >> "$LOG" 2>&1
  registrar "----- ciclo fin (abortado) -----"
  exit 1
fi

# --- 2. Scheduler: marca lo vencido como listo ------------------------
"$PY" cymarq.py programadas >> "$LOG" 2>&1
registrar "scheduler: codigo $?"

# --- 3. Motor ---------------------------------------------------------
"$PY" cymarq.py ejecutar-programadas >> "$LOG" 2>&1
CODIGO=$?
registrar "motor: codigo $CODIGO"

registrar "----- ciclo fin -----"
exit 0
