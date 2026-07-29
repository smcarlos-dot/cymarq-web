"""Programacion temporal de publicaciones. NO publica.

Este modulo es el reloj del sistema: decide CUANDO una propuesta aprobada
deberia salir, y detecta cuando ese momento ha llegado. Nada mas.

    propuesta -> aprobada -> programada -> [llega la hora] -> lista_para_publicar

`lista_para_publicar` es la frontera. Quien la cruce y publique de verdad sera
otro componente, en una fase posterior. Aqui NO se importa `puente_node`, ni se
lanza ningun proceso, ni se toca la red. Una propuesta vencida se queda en
`lista_para_publicar` indefinidamente hasta que alguien la procese; el scheduler
jamas la marca como publicada.

ZONA HORARIA
------------
La hora oficial del sistema es America/Bogota y todos los instantes se guardan
con desplazamiento explicito. No se usan fechas naive: una fecha sin zona es
ambigua en cuanto el equipo cambia de configuracion regional, y aqui una
ambiguedad de horas significa publicar cuando no toca.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from . import historial

# --------------------------------------------------------------------- #
# Zona horaria                                                           #
# --------------------------------------------------------------------- #

NOMBRE_ZONA = "America/Bogota"

try:  # pragma: no cover - depende de la base de datos IANA del sistema
    from zoneinfo import ZoneInfo

    ZONA = ZoneInfo(NOMBRE_ZONA)
except Exception:  # pragma: no cover
    # Colombia no aplica horario de verano desde 1993, asi que un
    # desplazamiento fijo de -05:00 es exacto. Sirve de red de seguridad si el
    # equipo no tiene instalada la base de datos de zonas horarias.
    ZONA = timezone(timedelta(hours=-5), NOMBRE_ZONA)


def ahora() -> datetime:
    """Instante actual en hora de Colombia, siempre con zona."""
    return datetime.now(ZONA)


def a_zona(momento: datetime) -> datetime:
    """Lleva cualquier instante a hora de Colombia.

    Si llega una fecha naive se interpreta como hora de Colombia, que es la
    unica lectura razonable: es la que escribe el usuario en el panel.
    """
    if momento.tzinfo is None:
        return momento.replace(tzinfo=ZONA)
    return momento.astimezone(ZONA)


_FORMATOS = (
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%M",
    "%d/%m/%Y %H:%M",
    "%Y-%m-%d",
)


def parsear(texto: str) -> datetime:
    """Interpreta una fecha/hora escrita a mano, en hora de Colombia."""
    texto = (texto or "").strip()
    if not texto:
        raise ValueError("Falta la fecha/hora.")

    # ISO con desplazamiento incluido: se respeta el que traiga.
    try:
        return a_zona(datetime.fromisoformat(texto))
    except ValueError:
        pass

    for formato in _FORMATOS:
        try:
            return a_zona(datetime.strptime(texto, formato))
        except ValueError:
            continue

    raise ValueError(
        f"No entiendo la fecha/hora '{texto}'. "
        "Usa por ejemplo 2026-07-30 18:30 o 30/07/2026 18:30."
    )


def combinar(fecha: str, hora: str) -> datetime:
    """Une una fecha AAAA-MM-DD y una hora HH:MM en hora de Colombia."""
    fecha = (fecha or "").strip()
    hora = (hora or "").strip() or "18:30"
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", fecha):
        raise ValueError(f"Fecha invalida: '{fecha}'. Formato AAAA-MM-DD.")
    if not re.fullmatch(r"\d{1,2}:\d{2}", hora):
        raise ValueError(f"Hora invalida: '{hora}'. Formato HH:MM.")
    return parsear(f"{fecha} {hora}")


def formato_humano(momento: datetime | str | None) -> str:
    """'30/07/2026 18:30 — Colombia', que es lo que ve el usuario."""
    if momento is None:
        return "sin programar"
    if isinstance(momento, str):
        try:
            momento = datetime.fromisoformat(momento)
        except ValueError:
            return momento
    return a_zona(momento).strftime("%d/%m/%Y %H:%M") + " — Colombia"


def guardar_iso(momento: datetime) -> str:
    """Formato de almacenamiento: ISO 8601 con desplazamiento explicito."""
    return a_zona(momento).isoformat(timespec="seconds")


def leer_iso(valor: str | None) -> datetime | None:
    if not valor:
        return None
    try:
        return a_zona(datetime.fromisoformat(valor))
    except ValueError:
        return None


# --------------------------------------------------------------------- #
# Errores                                                                #
# --------------------------------------------------------------------- #


class ErrorProgramacion(RuntimeError):
    """Se intento programar algo que no admite programacion."""


# --------------------------------------------------------------------- #
# Programar / reprogramar / cancelar                                     #
# --------------------------------------------------------------------- #

#: Estados desde los que tiene sentido fijar una hora.
PROGRAMABLES = ("aprobada", "programada", "lista_para_publicar")


def programar(id_publicacion: str, cuando: datetime | str,
              hora: str | None = None) -> dict[str, Any]:
    """Fija (o cambia) el instante de publicacion de una propuesta aprobada.

    Acepta un datetime, una cadena completa, o fecha + hora por separado, que
    es como llegan desde el panel.

    Programar algo ya programado es reprogramarlo: no crea un registro nuevo.
    """
    reg = historial.buscar(id_publicacion)
    if reg is None:
        raise ErrorProgramacion(f"No existe la publicacion {id_publicacion}.")

    estado = reg.get("estado", "")
    if estado not in PROGRAMABLES:
        raise ErrorProgramacion(
            f"{id_publicacion} esta en estado '{estado}'. Solo se puede programar "
            f"lo que este en: {', '.join(PROGRAMABLES)}. "
            "Apruebala primero si aun es una propuesta."
        )

    if isinstance(cuando, datetime):
        momento = a_zona(cuando)
    elif hora is not None:
        momento = combinar(str(cuando), hora)
    else:
        momento = parsear(str(cuando))

    previo = reg.get("programado_para")

    cambios: dict[str, Any] = {
        "programado_para": guardar_iso(momento),
        "zona_horaria": NOMBRE_ZONA,
        "programado_en": guardar_iso(ahora()),
    }
    if previo:
        cambios["programacion_anterior"] = previo

    historial.actualizar(id_publicacion, cambios)

    # lista_para_publicar -> programada es una reprogramacion: vuelve a esperar.
    if estado != "programada":
        historial.cambiar_estado(id_publicacion, "programada")

    return historial.buscar(id_publicacion) or reg


def cancelar_programacion(id_publicacion: str) -> dict[str, Any]:
    """Quita la hora y devuelve la propuesta a 'aprobada'. No la descarta."""
    reg = historial.buscar(id_publicacion)
    if reg is None:
        raise ErrorProgramacion(f"No existe la publicacion {id_publicacion}.")
    if reg.get("estado") not in ("programada", "lista_para_publicar"):
        raise ErrorProgramacion(
            f"{id_publicacion} no esta programada (estado '{reg.get('estado')}')."
        )

    historial.actualizar(id_publicacion, {
        "programacion_anterior": reg.get("programado_para"),
        "programado_para": None,
        "programado_en": None,
    })
    historial.cambiar_estado(id_publicacion, "aprobada", "programacion cancelada")
    return historial.buscar(id_publicacion) or reg


# --------------------------------------------------------------------- #
# Scheduler                                                              #
# --------------------------------------------------------------------- #

#: Estados que el scheduler ignora por completo.
IGNORADOS = ("publicada", "rechazada", "cancelada")


@dataclass
class Entrada:
    """Una publicacion vista por el scheduler."""

    id: str
    estado: str
    proyecto: str = ""
    programado_para: datetime | None = None
    situacion: str = ""       # futura | vencida | ya_lista | sin_hora
    minutos_retraso: int = 0
    transicion: bool = False  # ¿este pase la movio a lista_para_publicar?

    @property
    def texto_programada(self) -> str:
        return formato_humano(self.programado_para)


@dataclass
class Informe:
    """Resultado de una revision. Solo lectura salvo las transiciones."""

    momento: datetime
    simulado: bool = False
    futuras: list[Entrada] = field(default_factory=list)
    listas: list[Entrada] = field(default_factory=list)
    sin_hora: list[Entrada] = field(default_factory=list)
    ignoradas: int = 0

    @property
    def transiciones(self) -> list[Entrada]:
        return [e for e in self.listas if e.transicion]


def revisar(momento: datetime | None = None, aplicar: bool = True) -> Informe:
    """Revisa el historial y marca como listas las programaciones vencidas.

    IDEMPOTENTE. La unica escritura posible es `programada ->
    lista_para_publicar`, y solo ocurre una vez por publicacion: en las
    siguientes pasadas la entrada ya esta en `lista_para_publicar` y solo se
    reconoce. No genera propuestas, no toca imagenes ni textos, no publica y no
    escribe en los diarios de Instagram o Facebook.

    Una programacion vencida NO se descarta ni se reprograma sola: si el equipo
    estuvo apagado a su hora, al encenderse sigue estando lista. Esa es la
    diferencia entre un recordatorio y un despertador que se rinde.

    `aplicar=False` deja la revision en solo lectura, para inspeccionar sin
    cambiar nada.
    """
    referencia = a_zona(momento) if momento else ahora()
    informe = Informe(momento=referencia, simulado=momento is not None)

    for pub in historial.cargar().get("publicaciones", []):
        estado = pub.get("estado", "")
        if estado in IGNORADOS:
            informe.ignoradas += 1
            continue
        if estado not in ("programada", "lista_para_publicar"):
            continue

        cuando = leer_iso(pub.get("programado_para"))
        entrada = Entrada(
            id=pub.get("id", ""),
            estado=estado,
            proyecto=pub.get("proyecto_nombre", ""),
            programado_para=cuando,
        )

        if cuando is None:
            # Programada sin hora: incoherente, se reporta y no se toca.
            entrada.situacion = "sin_hora"
            informe.sin_hora.append(entrada)
            continue

        if estado == "lista_para_publicar":
            entrada.situacion = "ya_lista"
            entrada.minutos_retraso = max(0, int((referencia - cuando).total_seconds() // 60))
            informe.listas.append(entrada)
            continue

        if cuando > referencia:
            entrada.situacion = "futura"
            informe.futuras.append(entrada)
            continue

        # Ha llegado la hora (o ya paso).
        entrada.situacion = "vencida"
        entrada.minutos_retraso = int((referencia - cuando).total_seconds() // 60)
        if aplicar:
            historial.cambiar_estado(entrada.id, "lista_para_publicar")
            historial.actualizar(entrada.id, {"listo_desde": guardar_iso(referencia)})
            entrada.estado = "lista_para_publicar"
            entrada.transicion = True
        informe.listas.append(entrada)

    informe.futuras.sort(key=lambda e: e.programado_para or referencia)
    informe.listas.sort(key=lambda e: e.programado_para or referencia)
    return informe
