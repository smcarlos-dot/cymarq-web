"""Salud del sistema y preflight de una publicacion. NO PUBLICA NADA.

Responde a una sola pregunta: *si hubiera que publicar ahora mismo, ¿esta todo
tecnicamente preparado?* La idea es enterarse de los problemas ANTES de la hora
de publicacion, no descubrirlos cuando ya no se puede reaccionar.

    salud()              -> credenciales de Meta + comprobaciones locales
    preflight(job_id)    -> ¿esta ESTA publicacion lista?

Ninguna funcion de este modulo escribe: ni en Meta, ni en los diarios de Node,
ni en el historial, ni cambia el estado de nada. Las consultas a Meta las hace
`scripts/social-health.mjs`, que reutiliza los clientes ya probados de `lib/` en
solo lectura. No hay un segundo cliente de Meta en Python.

Los tokens no se imprimen nunca. Como maximo se dice si estan presentes y su
longitud, que basta para distinguir "ausente" de "presente" sin revelarlos.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any

from . import (catalogo_social, catalogo_video, config as cfg_mod, ejecutor,
               entorno as entorno_mod, historial, programacion, rutas)

OK = "OK"
ADVERTENCIA = "ADVERTENCIA"
ERROR = "ERROR"

_ORDEN = {OK: 0, ADVERTENCIA: 1, ERROR: 2}


def peor(estados) -> str:
    """El estado de un conjunto es el del peor de sus componentes."""
    n = max((_ORDEN.get(e, 0) for e in estados), default=0)
    return next(k for k, v in _ORDEN.items() if v == n)


@dataclass
class Chequeo:
    """Un componente comprobado."""

    nombre: str
    estado: str
    mensaje: str
    detalle: dict[str, Any] = field(default_factory=dict)

    def como_dict(self) -> dict[str, Any]:
        return {"nombre": self.nombre, "estado": self.estado,
                "mensaje": self.mensaje, **({"detalle": self.detalle} if self.detalle else {})}


def _c(nombre: str, condicion: bool, ok_msg: str, mal_msg: str,
       grave: bool = True, detalle: dict[str, Any] | None = None) -> Chequeo:
    return Chequeo(
        nombre=nombre,
        estado=OK if condicion else (ERROR if grave else ADVERTENCIA),
        mensaje=ok_msg if condicion else mal_msg,
        detalle=detalle or {},
    )


# --------------------------------------------------------------------- #
# Comprobaciones locales                                                 #
# --------------------------------------------------------------------- #

SCRIPTS_NECESARIOS = (
    "scripts/social-publish.mjs",
    "scripts/social-health.mjs",
    "scripts/instagram-publish.mjs",
    "scripts/facebook-publish.mjs",
    "lib/instagram/publish.mjs",
    "lib/facebook/publish.mjs",
)


def salud_sistema() -> list[Chequeo]:
    """Todo lo que se puede comprobar sin salir de este equipo."""
    repo = catalogo_social.repo_web()
    checks: list[Chequeo] = []

    d = entorno_mod.detalle()
    checks.append(Chequeo(
        nombre="entorno",
        estado=OK,
        mensaje=f"{d['entorno'].upper()} — {d['motivo']}",
        detalle=d,
    ))

    node = shutil.which("node")
    checks.append(_c("node", bool(node),
                     f"disponible en {node}", "no se encontro 'node' en el PATH"))

    faltan = [s for s in SCRIPTS_NECESARIOS if not (repo / s).is_file()]
    checks.append(_c("scripts", not faltan,
                     f"{len(SCRIPTS_NECESARIOS)} scripts presentes",
                     f"faltan: {', '.join(faltan)}"))

    env = repo / ".env.local"
    checks.append(_c("credenciales", env.is_file(),
                     f"{env.name} accesible", f"no existe {env}"))

    checks.append(_c("historial", rutas.ARCHIVO_HISTORIAL.is_file(),
                     "historial accesible", "no se encuentra el historial"))

    diarios = {p: (repo / n).is_file() for p, (n, _) in ejecutor.DIARIOS.items()}
    checks.append(_c("diarios_antiduplicados", all(diarios.values()),
                     "los dos diarios son accesibles",
                     f"diarios ausentes: {[p for p, ok in diarios.items() if not ok]}",
                     grave=False,
                     detalle={"nota": "un diario ausente no es grave: se crea al publicar"}))

    manifiesto = catalogo_social.cargar_manifiesto().get("imagenes", {})
    checks.append(_c("catalogo", bool(manifiesto),
                     f"manifiesto con {len(manifiesto)} imagenes publicas",
                     "el manifiesto esta vacio o no se puede leer"))

    # La zona horaria decide a que hora se publica: si falla, se publica a la
    # hora equivocada, que es peor que no publicar.
    try:
        ahora = programacion.ahora()
        zona_ok = ahora.utcoffset() is not None
        detalle = {"zona": programacion.NOMBRE_ZONA,
                   "ahora": programacion.formato_humano(ahora),
                   "desplazamiento": str(ahora.utcoffset())}
    except Exception as exc:
        zona_ok, detalle = False, {"error": str(exc)}
    checks.append(_c("zona_horaria", zona_ok,
                     f"{programacion.NOMBRE_ZONA} disponible",
                     "no se pudo resolver la zona horaria", detalle=detalle))

    return checks


def estado_gate() -> Chequeo:
    """El gate no es un fallo: se informa de como esta, sin juzgarlo."""
    motor = ejecutor.estado_motor()
    return Chequeo(
        nombre="gate_publicacion",
        estado=OK,
        mensaje=f"publicacion automatica {motor['publicacion_automatica']}, "
                f"autorizadas: {motor['publicaciones_reales_autorizadas']}",
        detalle=motor,
    )


# --------------------------------------------------------------------- #
# Credenciales de Meta, via Node                                         #
# --------------------------------------------------------------------- #

SCRIPT_SALUD = "scripts/social-health.mjs"


def salud_meta(tiempo_limite: int = 120) -> dict[str, Any]:
    """Consulta el estado de las credenciales. Solo lecturas contra Meta."""
    repo = catalogo_social.repo_web()
    node = shutil.which("node")
    if not node:
        return {"estado": ERROR, "plataformas": {},
                "error": "no se encontro 'node' en el PATH"}

    try:
        proceso = subprocess.run(
            [node, str(repo / SCRIPT_SALUD)],
            cwd=str(repo), capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=tiempo_limite, env=os.environ.copy(), check=False,
        )
    except subprocess.TimeoutExpired:
        return {"estado": ERROR, "plataformas": {},
                "error": f"la comprobacion no respondio en {tiempo_limite} s"}

    for linea in reversed((proceso.stdout or "").strip().splitlines()):
        try:
            return json.loads(linea)
        except json.JSONDecodeError:
            continue

    return {"estado": ERROR, "plataformas": {},
            "error": "la comprobacion no devolvio JSON",
            "stderr": (proceso.stderr or "")[-300:]}


# --------------------------------------------------------------------- #
# Salud general                                                          #
# --------------------------------------------------------------------- #


def salud(con_meta: bool = True) -> dict[str, Any]:
    """Informe completo. `con_meta=False` deja solo lo local, sin red."""
    sistema = salud_sistema()
    gate = estado_gate()
    meta = salud_meta() if con_meta else {"estado": OK, "plataformas": {},
                                          "omitido": "no se consulto a Meta"}

    estados = [c.estado for c in sistema] + [meta.get("estado", OK)]
    general = peor(estados)

    return {
        "comprobado_en": programacion.guardar_iso(programacion.ahora()),
        "general": general,
        "publicacion_segura": general != ERROR,
        "sistema": [c.como_dict() for c in sistema],
        "gate": gate.como_dict(),
        "meta": meta,
    }


def apto_para_publicar() -> tuple[bool, str, dict[str, Any]]:
    """Puerta reutilizable para el futuro scheduler.

    Devuelve (apto, motivo, informe). La idea de uso en la fase siguiente es:

        apto, motivo, _ = salud.apto_para_publicar()
        if not apto:
            # no publicar, avisar y salir
        else:
            # continuar con el ejecutor

    Se separa a proposito de `salud()` para que el scheduler no tenga que
    interpretar el informe: le basta un booleano y una razon.
    """
    informe = salud()
    if informe["general"] == ERROR:
        malos = [c["nombre"] for c in informe["sistema"] if c["estado"] == ERROR]
        plataformas = [p for p, d in (informe["meta"].get("plataformas") or {}).items()
                       if d.get("estado") == ERROR]
        partes = malos + [f"credenciales de {p}" for p in plataformas]
        return False, "con problemas en: " + (", ".join(partes) or "componentes de Meta"), informe
    return True, "todo en orden", informe


# --------------------------------------------------------------------- #
# Preflight de una publicacion                                           #
# --------------------------------------------------------------------- #


def _url_accesible(url: str, tiempo_limite: int = 30, es_video: bool = False) -> Chequeo:
    """Comprueba la URL como la vera Meta: sin credenciales.

    Se usa un User-Agent de navegador porque Cloudflare responde 403 al agente
    por defecto de Python. Ese 403 no dice nada sobre si Meta podra descargarla
    (y de hecho puede), asi que confundirlo con un fallo real seria un falso
    positivo molesto justo antes de publicar.

    Para video se exige ademas `Accept-Ranges`: el descargador de Meta pide el
    MP4 por rangos, y sin soporte de rangos la descarga puede fallar dentro de
    Meta, donde ya no hay forma de diagnosticarla.
    """
    tipos_ok = ("video/mp4", "video/quicktime") if es_video else ("image/jpeg",)
    etiqueta = "video" if es_video else "imagen"
    try:
        peticion = urllib.request.Request(
            url, method="HEAD",
            headers={"User-Agent": "Mozilla/5.0 (compatible; CYMARQ-preflight)"},
        )
        with urllib.request.urlopen(peticion, timeout=tiempo_limite) as r:
            tipo = (r.headers.get("Content-Type") or "").split(";")[0].strip()
            largo = r.headers.get("Content-Length")
            rangos = (r.headers.get("Accept-Ranges") or "").strip().lower()
            bien = r.status == 200 and tipo in tipos_ok
            if es_video and bien and rangos in ("", "none"):
                return _c("url_publica", False,
                          "", f"HTTP {r.status}, {tipo}: sin Accept-Ranges, "
                              "Meta descarga el MP4 por rangos",
                          detalle={"url": url, "status": r.status,
                                   "content_type": tipo, "accept_ranges": rangos})
            sufijo = f", rangos: {rangos}" if es_video else ""
            return _c("url_publica", bien,
                      f"HTTP {r.status}, {tipo}, {largo} bytes{sufijo}",
                      f"HTTP {r.status}, {tipo}: no es un "
                      f"{'MP4' if es_video else 'JPEG'} servido correctamente",
                      detalle={"url": url, "status": r.status, "content_type": tipo,
                               "accept_ranges": rangos or None})
    except urllib.error.HTTPError as exc:
        return _c("url_publica", False, "", f"HTTP {exc.code} al pedir el {etiqueta}",
                  detalle={"url": url, "status": exc.code})
    except Exception as exc:
        return _c("url_publica", False, "", f"no se pudo comprobar el {etiqueta}: {exc}",
                  detalle={"url": url})


def preflight(job_id: str, con_meta: bool = True, con_red: bool = True) -> dict[str, Any]:
    """¿Esta ESTA publicacion lista para salir? Sin publicar y sin escribir nada."""
    checks: list[Chequeo] = []

    pub = historial.buscar(job_id)
    if pub is None:
        return {
            "job": job_id,
            "comprobado_en": programacion.guardar_iso(programacion.ahora()),
            "resultado": "BLOQUEADA",
            "razones": [f"no existe ninguna publicacion con id {job_id}"],
            "chequeos": [_c("existe", False, "", f"no existe {job_id}").como_dict()],
        }

    checks.append(_c("existe", True, f"{job_id} encontrada en el historial", ""))

    estado = pub.get("estado", "")
    # Programada y lista son ambas coherentes: la primera es "aun no le toca".
    coherente = estado in ("programada", "lista_para_publicar")
    checks.append(_c("estado", coherente,
                     f"estado '{estado}'",
                     f"estado '{estado}': no es programada ni lista_para_publicar",
                     detalle={"estado": estado}))

    cuando = programacion.leer_iso(pub.get("programado_para"))
    checks.append(_c("fecha_hora", cuando is not None,
                     f"programada para {programacion.formato_humano(cuando)}",
                     "sin fecha de publicacion",
                     detalle={"programado_para": pub.get("programado_para"),
                              "vencida": bool(cuando and cuando <= programacion.ahora())}))

    previstas = pub.get("plataforma") or []
    checks.append(_c("plataformas", set(previstas) == {"instagram", "facebook"},
                     f"previstas: {', '.join(previstas)}",
                     f"plataformas inesperadas: {', '.join(previstas) or 'ninguna'}",
                     detalle={"plataformas": previstas}))

    # El medio decide en que manifiesto se busca, con que reglas se valida y si
    # hace falta texto. Sin `tipo_medio` es una imagen, que es lo que eran todas
    # las propuestas anteriores al soporte de video.
    id_archivo = pub.get("id_archivo") or ""
    tipo_medio = pub.get("tipo_medio") or "image"

    # Una historia no lleva pie: Meta lo descarta. Reclamarlo aqui marcaria como
    # no apta una publicacion perfectamente correcta.
    if tipo_medio not in ejecutor.TIPOS_SIN_TEXTO:
        textos = pub.get("texto") or {}
        for p in ("instagram", "facebook"):
            t = textos.get(p) or ""
            checks.append(_c(f"caption_{p}", bool(t),
                             f"{len(t)} caracteres almacenados",
                             f"sin caption almacenado para {p}"))

    es_video = tipo_medio != "image"
    etiqueta = "video" if es_video else "imagen"

    if es_video:
        url = catalogo_video.url_publica(id_archivo) if id_archivo else None
    else:
        url = catalogo_social.url_publica(id_archivo) if id_archivo else None

    checks.append(_c(f"{etiqueta}_en_manifiesto", bool(url),
                     f"{etiqueta} presente en el catalogo publico",
                     f"el {etiqueta} {id_archivo or '(sin id)'} no esta en el manifiesto",
                     detalle={"id_archivo": id_archivo, "url": url,
                              "tipo_medio": tipo_medio}))

    if es_video:
        # El derivado tiene que estar en disco. Si falta, no se ha hecho el
        # commit y el push, y Meta recibiria un 404 a mitad de publicacion.
        desplegado = catalogo_video.desplegado(id_archivo) if id_archivo else False
        checks.append(_c("video_desplegado", desplegado,
                         "el derivado esta en public/social/video/",
                         "el derivado no esta en public/social/video/: falta commit y push",
                         detalle={"id_archivo": id_archivo}))

    if url and con_red:
        checks.append(_url_accesible(url, es_video=es_video))
    elif url:
        checks.append(_c("url_publica", True, "no comprobada (--sin-red)", "", grave=False))

    # Formato: ya validado al entrar en el catalogo, se reporta lo registrado.
    if es_video:
        entrada = catalogo_video.cargar_manifiesto().get("videos", {}).get(id_archivo) or {}
    else:
        entrada = catalogo_social.cargar_manifiesto().get("imagenes", {}).get(id_archivo) or {}
    ancho, alto = entrada.get("ancho"), entrada.get("alto")
    if ancho and alto:
        ratio = ancho / alto
        if es_video:
            bien = (catalogo_video.RATIO_MIN <= ratio <= catalogo_video.RATIO_MAX
                    and ancho <= catalogo_video.ANCHO_MAX
                    and ancho >= catalogo_video.ANCHO_MIN
                    and alto >= catalogo_video.ALTO_MIN)
            extra = (f", {entrada.get('duracion')} s, {entrada.get('fps')} fps, "
                     f"{entrada.get('codec_video')}/{entrada.get('codec_audio')}")
        else:
            bien = (catalogo_social.RATIO_MIN <= ratio <= catalogo_social.RATIO_MAX
                    and ancho <= catalogo_social.ANCHO_MAX)
            extra = ""
        checks.append(_c(f"formato_{etiqueta}", bien,
                         f"{ancho}x{alto}, relacion {ratio:.4f}{extra}",
                         f"{ancho}x{alto}, relacion {ratio:.4f}: fuera de lo admitido",
                         detalle={"ancho": ancho, "alto": alto, "relacion": round(ratio, 4),
                                  "tipo_medio": tipo_medio}))

    # --- Estado por plataforma y diarios de Node ---
    plataformas = ejecutor.estado_plataformas(pub)
    for p in previstas:
        d = plataformas.get(p) or {}
        e = d.get("estado", ejecutor.PENDIENTE)
        checks.append(_c(f"sin_verificacion_{p}", e != ejecutor.VERIFICACION,
                         f"{p}: {e}",
                         f"{p} esta en verificacion_requerida: no se puede publicar "
                         "hasta comprobar a mano si ya existe",
                         detalle={"estado": e, "id": d.get("id")}))
        if e == ejecutor.PUBLICADA:
            checks.append(_c(f"no_publicada_{p}", False, "",
                             f"{p} ya esta publicada (id {d.get('id')}): no se republica",
                             grave=False, detalle={"id": d.get("id")}))

    for p in previstas:
        entrada_diario = ejecutor.leer_diario_node(p, job_id)
        if not entrada_diario:
            checks.append(_c(f"diario_{p}", True, f"{p}: sin registro previo", ""))
            continue
        _, campo = ejecutor.DIARIOS[p]
        if entrada_diario.get(campo):
            checks.append(_c(f"diario_{p}", False, "",
                             f"{p}: el diario ya tiene {campo}="
                             f"{entrada_diario[campo]}: ya fue publicada",
                             grave=False, detalle={campo: entrada_diario[campo]}))
        elif entrada_diario.get("publish_attempted"):
            checks.append(_c(f"diario_{p}", False, "",
                             f"{p}: el diario registra un intento sin resultado. "
                             "Hay que comprobar a mano si la publicacion existe",
                             detalle={"publish_attempted": True}))
        else:
            checks.append(_c(f"diario_{p}", True, f"{p}: diario sin conflicto", ""))

    # --- Lock ---
    lock = ejecutor.CARPETA_LOCKS / f"{job_id}.lock"
    if lock.exists():
        try:
            datos = json.loads(lock.read_text(encoding="utf-8"))
        except Exception:
            datos = {}
        pid = int(datos.get("pid") or 0)
        vivo = ejecutor._proceso_vivo(pid)
        checks.append(_c("sin_lock", not vivo,
                         f"lock huerfano del PID {pid}, recuperable",
                         f"lock activo del PID {pid}: otro proceso la esta procesando",
                         grave=vivo, detalle={"pid": pid, "proceso_vivo": vivo}))
    else:
        checks.append(_c("sin_lock", True, "sin bloqueo activo", ""))

    # --- Credenciales ---
    if con_meta:
        m = salud_meta()
        for p in previstas:
            d = (m.get("plataformas") or {}).get(p) or {}
            e = d.get("estado", ERROR)
            checks.append(Chequeo(
                nombre=f"credenciales_{p}",
                estado=e,
                mensaje=f"{p}: credenciales {e}",
                detalle={k: v for k, v in d.items()
                         if k in ("token", "cuenta", "identidad", "pagina", "cuota")},
            ))
    else:
        checks.append(_c("credenciales", True, "no comprobadas (--sin-meta)", "", grave=False))

    general = peor(c.estado for c in checks)
    razones = [c.mensaje for c in checks if c.estado in (ERROR, ADVERTENCIA)]

    return {
        "job": job_id,
        "proyecto": pub.get("proyecto_nombre", ""),
        "comprobado_en": programacion.guardar_iso(programacion.ahora()),
        "general": general,
        "resultado": "LISTA PARA PUBLICAR" if general == OK else "BLOQUEADA",
        "razones": razones,
        "chequeos": [c.como_dict() for c in checks],
    }
