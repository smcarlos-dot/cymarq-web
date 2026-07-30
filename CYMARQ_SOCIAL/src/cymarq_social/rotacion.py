"""Motor de rotacion de proyectos e imagenes.

Objetivo: que el feed no se convierta en el mismo proyecto una y otra vez.

Reglas, en orden:
  1. Un proyecto que nunca se ha publicado va primero.
  2. Entre los ya publicados, gana el que lleva mas tiempo sin salir.
  3. Se evita repetir un proyecto usado en las ultimas N publicaciones
     (config: proyectos_a_esperar_antes_de_repetir).
  4. Se evita repetir un proyecto usado hace menos de X dias.
  5. Dentro del proyecto elegido, se prefiere la imagen de mayor prioridad
     editorial que ademas muestre un ambiente distinto al ultimo publicado.
  6. Una imagen ya usada nunca se vuelve a proponer.

Si las restricciones dejan cero opciones, se relajan en el orden 3 -> 4,
antes que devolver "no hay contenido".
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from . import historial

# Formatos que rinden mejor en Instagram, de mejor a peor.
_BONO_FORMATO = {
    "vertical 4:5 (ideal Instagram)": 0,
    "cuadrado 1:1": 1,
    "vertical alto (recortar a 4:5)": 2,
    "horizontal 1.91:1": 3,
    "panoramico (recortar a 4:5 o 1:1)": 4,
    "desconocido": 5,
}


def _dias_desde(iso: str) -> float:
    if not iso:
        return 1e9
    try:
        fecha = datetime.fromisoformat(iso)
    except ValueError:
        return 1e9
    ahora = datetime.now(tz=fecha.tzinfo) if fecha.tzinfo else datetime.now()
    return (ahora - fecha).total_seconds() / 86400.0


def ordenar_proyectos(
    proyectos_disponibles: list[str],
    cfg: dict[str, Any],
) -> list[tuple[str, dict[str, Any]]]:
    """Devuelve los proyectos ordenados por turno, con su justificacion."""
    ultimo_uso = historial.ultimo_uso_por_proyecto()
    conteo = historial.conteo_por_proyecto()
    secuencia = historial.secuencia_proyectos()
    espera = int(cfg.get("proyectos_a_esperar_antes_de_repetir", 4))
    recientes = secuencia[-espera:] if espera > 0 else []

    filas: list[tuple[str, dict[str, Any]]] = []
    for proyecto in proyectos_disponibles:
        fecha = ultimo_uso.get(proyecto, "")
        dias = _dias_desde(fecha)
        nunca = proyecto not in ultimo_uso
        posicion_reciente = (
            len(recientes) - 1 - recientes[::-1].index(proyecto)
            if proyecto in recientes else -1
        )
        filas.append((proyecto, {
            "nunca_publicado": nunca,
            "ultima_publicacion": fecha or None,
            "dias_desde_ultima": None if nunca else round(dias, 1),
            "publicaciones_previas": conteo.get(proyecto, 0),
            "en_ventana_de_espera": posicion_reciente >= 0,
        }))

    # 0 para los nunca publicados, luego los mas antiguos primero.
    filas.sort(key=lambda f: (
        0 if f[1]["nunca_publicado"] else 1,
        f[1]["publicaciones_previas"],
        -(f[1]["dias_desde_ultima"] or 0),
        f[0],
    ))
    return filas


def elegir_proyecto(
    candidatos_por_proyecto: dict[str, list[dict[str, Any]]],
    cfg: dict[str, Any],
    proyecto_forzado: str | None = None,
    excluir: set[str] | None = None,
) -> tuple[str | None, dict[str, Any]]:
    """Elige el proyecto que toca. Devuelve (proyecto, explicacion)."""
    excluir = excluir or set()
    disponibles = [
        p for p, items in candidatos_por_proyecto.items()
        if items and p not in excluir
    ]

    if proyecto_forzado:
        if proyecto_forzado in disponibles:
            return proyecto_forzado, {
                "regla": "seleccion manual",
                "detalle": "Proyecto indicado explicitamente por el usuario.",
            }
        return None, {
            "regla": "seleccion manual",
            "detalle": f"'{proyecto_forzado}' no tiene material disponible.",
        }

    if not disponibles:
        return None, {"regla": "sin material", "detalle": "No quedan candidatos."}

    ordenados = ordenar_proyectos(disponibles, cfg)
    dias_minimos = int(cfg.get("dias_minimos_entre_publicaciones_mismo_proyecto", 14))

    # Pasada estricta: fuera de la ventana de espera y del minimo de dias.
    for proyecto, info in ordenados:
        if info["en_ventana_de_espera"]:
            continue
        if not info["nunca_publicado"] and (info["dias_desde_ultima"] or 0) < dias_minimos:
            continue
        return proyecto, {
            "regla": "rotacion normal",
            "detalle": (
                "Proyecto aun no publicado." if info["nunca_publicado"]
                else f"Ultima publicacion hace {info['dias_desde_ultima']} dias."
            ),
            **info,
        }

    # Relajacion 1: ignorar el minimo de dias.
    for proyecto, info in ordenados:
        if info["en_ventana_de_espera"]:
            continue
        return proyecto, {
            "regla": "rotacion relajada (dias minimos)",
            "detalle": "No hay proyectos que cumplan el minimo de dias.",
            **info,
        }

    # Relajacion 2: ignorar tambien la ventana de espera.
    proyecto, info = ordenados[0]
    return proyecto, {
        "regla": "rotacion relajada (ventana de espera)",
        "detalle": "Todos los proyectos estan dentro de la ventana de espera.",
        **info,
    }


def elegir_imagen(
    items: list[dict[str, Any]],
    cfg: dict[str, Any],
    ambientes_recientes: set[str] | None = None,
    excluir_ids: set[str] | None = None,
) -> dict[str, Any] | None:
    """Elige la mejor imagen del proyecto, evitando repetir ambiente."""
    ambientes_recientes = ambientes_recientes or set()
    excluir_ids = excluir_ids or set()

    libres = [it for it in items if it["id"] not in excluir_ids]
    if not libres:
        return None

    def clave(it: dict[str, Any]) -> tuple:
        return (
            it.get("prioridad", 99),
            0 if it.get("resolucion_suficiente", True) else 1,
            1 if it.get("ambiente") in ambientes_recientes else 0,
            _BONO_FORMATO.get(it.get("formato_instagram", "desconocido"), 5),
            -(it.get("tamano_bytes") or 0),
            it.get("archivo", ""),
        )

    return sorted(libres, key=clave)[0]


def proxima_fecha(cfg: dict[str, Any], desde: datetime | None = None) -> datetime:
    """Siguiente fecha/hora de publicacion segun dias_publicacion y hora."""
    dias_semana = {
        "lunes": 0, "martes": 1, "miercoles": 2, "miércoles": 2,
        "jueves": 3, "viernes": 4, "sabado": 5, "sábado": 5, "domingo": 6,
    }
    objetivo = {
        dias_semana[d.strip().lower()]
        for d in cfg.get("dias_publicacion", [])
        if d.strip().lower() in dias_semana
    } or {1, 3}

    hora_txt = str(cfg.get("hora_publicacion", "18:30"))
    try:
        hh, mm = (int(x) for x in hora_txt.split(":")[:2])
    except ValueError:
        hh, mm = 18, 30

    # Sin zona, `datetime.now()` da la hora del sistema: en la VM, UTC. Entre
    # las 19:00 y medianoche en Colombia eso ya es el dia siguiente, y la fecha
    # sugerida saldria corrida un dia. Se ancla explicitamente a Colombia.
    from . import programacion
    base = desde or programacion.ahora()
    for salto in range(1, 15):
        cand = (base + timedelta(days=salto)).replace(
            hour=hh, minute=mm, second=0, microsecond=0
        )
        if cand.weekday() in objetivo:
            return cand
    return base + timedelta(days=1)
