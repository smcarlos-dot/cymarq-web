"""Rotacion de ESTADOS: historias fijas los fines de semana, en bucle.

QUE ES, Y EN QUE SE DIFERENCIA DEL BANCO
----------------------------------------
El banco CYM son 46 publicaciones distintas, cada una con su texto, que salen
martes y viernes y se agotan. Los estados son otra cosa: un conjunto pequeno de
piezas de marca que salen sabados y domingos, sin texto, y que se REPITEN
cuando se acaba la vuelta. Una historia dura 24 h, asi que repetir a los meses
no es repetirse: es recordar.

    31 piezas marcadas  ->  se barajan  ->  se reparten en sabados y domingos
                            (semilla fija, reproducible)     a las 18:30
                        ->  se vuelven a barajar para el ciclo siguiente

SERIE PROPIA: EST-AAAA-NNNN
---------------------------
Ni CYM (ensuciaria el banco y su rotacion) ni EXP (una express exige
autorizacion individual explicita cada vez, y esto tiene que salir solo).
Una EST es una publicacion normal y corriente para el motor: sale sola cuando
`publicacion_automatica` esta activada, como una CYM.

POR QUE CADA HUECO ES UNA PUBLICACION APARTE
--------------------------------------------
Los diarios antiduplicados se indexan por identificador de trabajo. Si la misma
EST saliera dos veces, la segunda vez el diario diria "ya publicada" y no se
publicaria nada. Por eso 62 huecos son 62 identificadores, aunque solo haya 31
archivos detras: el archivo se comparte, el trabajo no.

EL PLAN VIAJA EN GIT, NO EN UN PAQUETE
--------------------------------------
`CONFIG/rotacion_estados.json` SI se versiona (el manifiesto de videos no).
Lleva las 31 piezas con sus datos publicos y los 62 huecos con su fecha. La VM
lo materializa en su propio historial con `materializar()`, que solo ANADE lo
que falta: nunca modifica ni borra un registro existente, ni toca diarios,
locks, autorizaciones ni credenciales.

Este modulo NO publica y NO llama a Meta.
"""

from __future__ import annotations

import hashlib
import json
import random
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from . import catalogo_social, catalogo_video, historial, programacion, rutas, seguridad

PREFIJO = "EST"

ARCHIVO_PLAN = rutas.CONFIG / "rotacion_estados.json"

#: Sabado y domingo, en la numeracion de `datetime.weekday()`.
DIAS = (5, 6)
HORA, MINUTO = 18, 30

VERSION_PLAN = 1


class ErrorEstados(RuntimeError):
    """No se puede construir o materializar la rotacion."""


# --------------------------------------------------------------------- #
# Identificadores y huecos                                               #
# --------------------------------------------------------------------- #


def siguiente_numero(datos: dict[str, Any] | None = None) -> int:
    """Primer numero libre de la serie EST del ano en curso."""
    datos = datos or historial.cargar()
    prefijo = f"{PREFIJO}-{programacion.ahora().year}-"
    usados = [
        int(p["id"].rsplit("-", 1)[-1])
        for p in datos["publicaciones"]
        if str(p.get("id", "")).startswith(prefijo)
        and p["id"].rsplit("-", 1)[-1].isdigit()
    ]
    return (max(usados) + 1) if usados else 1


def franjas(desde: datetime, cuantas: int) -> list[datetime]:
    """Los proximos `cuantas` sabados y domingos a las 18:30.

    Nunca devuelve una franja ya pasada: si hoy es sabado por la noche, el
    primer hueco es el domingo.
    """
    huecos: list[datetime] = []
    dia = desde.replace(hour=HORA, minute=MINUTO, second=0, microsecond=0)
    if dia <= desde:
        dia += timedelta(days=1)
    while len(huecos) < cuantas:
        if dia.weekday() in DIAS:
            huecos.append(dia)
        dia += timedelta(days=1)
    return huecos


# --------------------------------------------------------------------- #
# Construccion del plan (se hace en el PC)                               #
# --------------------------------------------------------------------- #


def _huella(ruta: Path) -> str:
    return hashlib.sha256(ruta.read_bytes()).hexdigest()


def _nombre_publico(ruta: Path, huella: str) -> str:
    return f"estado-{catalogo_video.slug(ruta.stem)}-{huella[:8]}.mp4"


def construir_plan(carpeta: Path, ciclos: int = 2,
                   semilla: int | None = None,
                   desde: datetime | None = None) -> dict[str, Any]:
    """Baraja las piezas, reparte los huecos y devuelve el plan completo.

    NO escribe nada ni copia archivos. `semilla` fija el azar: con la misma
    semilla sale exactamente el mismo orden, que es lo que permite revisar el
    plan y volver a generarlo igual si hace falta.
    """
    carpeta = Path(carpeta)
    archivos = sorted(p for p in carpeta.iterdir() if p.suffix.lower() == ".mp4")
    if not archivos:
        raise ErrorEstados(f"No hay MP4 en {carpeta}")

    semilla = semilla if semilla is not None else int(programacion.ahora().strftime("%Y%m%d"))
    desde = desde or programacion.ahora()

    piezas: list[dict[str, Any]] = []
    for ruta in archivos:
        info = catalogo_video.leer_info(ruta)
        problemas, _ = catalogo_video.validar(info, ruta.stat().st_size)
        if info and info.duracion and info.duracion > catalogo_video.DURACION_MAX_HISTORIA:
            problemas.append(f"dura {info.duracion:.1f} s, mas de los 60 s de una historia")
        if problemas:
            raise ErrorEstados(f"{ruta.name} no vale como historia:\n  - " + "\n  - ".join(problemas))

        huella = _huella(ruta)
        nombre = _nombre_publico(ruta, huella)
        piezas.append({
            "id_archivo": huella[:12],
            "sha256": huella,
            "nombre": nombre,
            "url": catalogo_video.BASE_URL + nombre,
            "origen": ruta.name,
            "titulo": ruta.stem.replace("_", " ").strip(),
            "ancho": info.ancho, "alto": info.alto,
            "duracion": round(info.duracion, 2) if info.duracion else None,
            "fps": round(info.fps, 2) if info.fps else None,
            "codec_video": info.codec_video, "codec_audio": info.codec_audio,
            "peso": ruta.stat().st_size,
        })

    total = len(piezas) * ciclos
    huecos = franjas(desde, total)

    # Una baraja distinta por ciclo. Se baraja el orden, no las piezas: asi
    # dentro de una vuelta cada pieza sale exactamente una vez.
    azar = random.Random(semilla)
    orden: list[int] = []
    for ciclo in range(ciclos):
        vuelta = list(range(len(piezas)))
        azar.shuffle(vuelta)
        orden.extend(vuelta)

    numero = siguiente_numero()
    anio = programacion.ahora().year
    publicaciones = []
    for i, (indice, cuando) in enumerate(zip(orden, huecos)):
        publicaciones.append({
            "id": f"{PREFIJO}-{anio}-{numero + i:04d}",
            "id_archivo": piezas[indice]["id_archivo"],
            "titulo": piezas[indice]["titulo"],
            "programado_para": programacion.guardar_iso(cuando),
            "ciclo": i // len(piezas) + 1,
        })

    return {
        "version": VERSION_PLAN,
        "creado_en": programacion.guardar_iso(programacion.ahora()),
        "semilla": semilla,
        "ciclos": ciclos,
        "dias": "sabados y domingos",
        "hora": f"{HORA:02d}:{MINUTO:02d} America/Bogota",
        "nota": ("Historias de marca. Sin texto, 24 h de vida. Se repiten al "
                 "cerrar el ciclo: es deliberado."),
        "piezas": piezas,
        "publicaciones": publicaciones,
    }


def desplegar_piezas(carpeta: Path, plan: dict[str, Any]) -> list[str]:
    """Copia los MP4 al catalogo publico del repositorio web.

    Solo copia. El commit y el push son cosa de quien llama: hasta que no estan
    en la web, Meta no puede descargarlos y el preflight lo detecta.
    """
    destino = catalogo_video.carpeta_video()
    destino.mkdir(parents=True, exist_ok=True)
    copiados = []
    for pieza in plan["piezas"]:
        origen = Path(carpeta) / pieza["origen"]
        final = destino / pieza["nombre"]
        if final.is_file() and _huella(final) == pieza["sha256"]:
            continue          # ya esta y es el mismo archivo
        shutil.copy2(origen, final)
        copiados.append(pieza["nombre"])
    return copiados


def guardar_plan(plan: dict[str, Any]) -> Path:
    seguridad.escribir_json(ARCHIVO_PLAN, plan)
    return ARCHIVO_PLAN


def cargar_plan() -> dict[str, Any]:
    plan = seguridad.leer_json(ARCHIVO_PLAN, por_defecto=None)
    if not plan or "publicaciones" not in plan:
        raise ErrorEstados(f"No hay plan de rotacion en {ARCHIVO_PLAN}")
    return plan


# --------------------------------------------------------------------- #
# Materializacion (se hace en la VM)                                     #
# --------------------------------------------------------------------- #


def materializar(simular: bool = False) -> dict[str, Any]:
    """Lleva el plan al historial y al manifiesto de esta maquina.

    SOLO ANADE. Si un identificador ya existe, se deja EXACTAMENTE como esta:
    puede llevar ya un resultado de publicacion, y pisarlo seria perder la
    unica prueba de que algo salio. Tampoco toca diarios, locks, autorizaciones
    ni credenciales.
    """
    plan = cargar_plan()
    manifiesto = catalogo_video.cargar_manifiesto()
    datos = historial.cargar()
    existentes = {p.get("id") for p in datos["publicaciones"]}

    resumen: dict[str, Any] = {
        "piezas_registradas": 0, "piezas_ya_estaban": 0, "piezas_sin_desplegar": [],
        "creadas": [], "ya_existian": 0, "simulado": simular,
    }

    carpeta = catalogo_video.carpeta_video()
    for pieza in plan["piezas"]:
        if not (carpeta / pieza["nombre"]).is_file():
            resumen["piezas_sin_desplegar"].append(pieza["nombre"])
            continue
        if pieza["id_archivo"] in manifiesto["videos"]:
            resumen["piezas_ya_estaban"] += 1
            continue
        manifiesto["videos"][pieza["id_archivo"]] = {
            "nombre": pieza["nombre"], "url": pieza["url"],
            "id_publicacion": None, "proyecto": "Estados CYMARQ",
            "archivo_origen": pieza["origen"], "ruta_original": "",
            "ancho": pieza["ancho"], "alto": pieza["alto"], "peso": pieza["peso"],
            "duracion": pieza["duracion"], "fps": pieza["fps"],
            "codec_video": pieza["codec_video"], "codec_audio": pieza["codec_audio"],
            "sha256": pieza["sha256"], "estado": True,
        }
        resumen["piezas_registradas"] += 1

    if resumen["piezas_sin_desplegar"]:
        raise ErrorEstados(
            "Faltan piezas en public/social/video/ (falta hacer git pull o el "
            "despliegue no ha llegado):\n  - "
            + "\n  - ".join(resumen["piezas_sin_desplegar"][:5])
        )

    por_archivo = {p["id_archivo"]: p for p in plan["piezas"]}
    nuevos = []
    for pub in plan["publicaciones"]:
        if pub["id"] in existentes:
            resumen["ya_existian"] += 1
            continue
        pieza = por_archivo[pub["id_archivo"]]
        carpeta_pend = rutas.PENDIENTES / f"ESTADOS/{pub['id']}"
        registro = {
            "id": pub["id"],
            "express": False,
            "estado_rotacion": True,
            "tipo_medio": "stories",
            "fecha_creacion": plan["creado_en"],
            "proyecto": "_ESTADOS",
            "proyecto_nombre": "Estados CYMARQ",
            "archivo": pieza["origen"],
            "ruta_original": "",
            "id_archivo": pub["id_archivo"],
            "carpeta_pendiente": rutas.ruta_relativa(carpeta_pend),
            "plataforma": ["instagram", "facebook"],
            "titulo": pub["titulo"],
            "ambiente": "estado",
            # Una historia no lleva pie. Se deja el diccionario vacio a
            # proposito: ni el motor ni el preflight lo reclaman ya.
            "texto": {},
            "hashtags": [], "hashtags_facebook": [], "llamada_a_la_accion": "",
            "programado_para": pub["programado_para"],
            "zona_horaria": "America/Bogota",
            "fecha_publicacion": None,
            "url_publicacion": {"instagram": None, "facebook": None},
            "id_publicacion_meta": {"instagram": None, "facebook": None},
            "video": {k: pieza[k] for k in
                      ("ancho", "alto", "duracion", "fps", "codec_video", "codec_audio")},
            "notas": f"Historia de marca, ciclo {pub['ciclo']}. Visible 24 h.",
            "publicado_por_sistema": False,
        }
        nuevos.append((registro, carpeta_pend))

    if simular:
        resumen["creadas"] = [r["id"] for r, _ in nuevos]
        return resumen

    catalogo_video.guardar_manifiesto(manifiesto)
    for registro, carpeta_pend in nuevos:
        carpeta_pend.mkdir(parents=True, exist_ok=True)
        seguridad.escribir_json(carpeta_pend / "metadata.json", registro)
        historial.registrar(registro)
        # Nace ya programada: el hueco lo decidio el plan, no el calendario del
        # banco. `programar()` exige pasar por 'aprobada' primero.
        historial.cambiar_estado(registro["id"], "aprobada", "estado de rotacion")
        historial.cambiar_estado(registro["id"], "programada", "hueco de fin de semana")
        resumen["creadas"].append(registro["id"])

    return resumen


def resumen_rotacion() -> dict[str, Any]:
    """Como va la rotacion, mirando el historial real de esta maquina."""
    pubs = [p for p in historial.cargar()["publicaciones"]
            if str(p.get("id", "")).startswith(f"{PREFIJO}-")]
    por_estado: dict[str, int] = {}
    for p in pubs:
        por_estado[p.get("estado", "?")] = por_estado.get(p.get("estado", "?"), 0) + 1
    futuras = sorted(p["programado_para"] for p in pubs
                     if p.get("estado") == "programada" and p.get("programado_para"))
    return {
        "total": len(pubs),
        "por_estado": por_estado,
        "proxima": futuras[0] if futuras else None,
        "ultima": futuras[-1] if futuras else None,
    }
