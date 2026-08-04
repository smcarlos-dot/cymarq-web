"""Motor de ejecucion de publicaciones programadas.

Python decide QUE plataforma necesita trabajo. Node sigue siendo el unico que
habla con Meta. No hay un segundo cliente de Meta aqui.

    scheduler -> lista_para_publicar
                      |
                 ejecutor.py  (esta capa)
                      |  lee el estado por plataforma
                      |  valida
                      v
        scripts/social-publish.mjs  --platform=...
                      |
        instagram-publish.mjs / facebook-publish.mjs   <- ya probados
                      |
                     Meta

DOS IDEAS QUE GOBIERNAN TODO EL MODULO
--------------------------------------

1. El estado es POR PLATAFORMA. Publicar en Instagram y fallar en Facebook es
   el caso normal, no la excepcion. Un unico estado global no puede
   representarlo sin acabar republicando algo.

2. Ante la duda, NO se reintenta. Si una peticion salio hacia Meta y no
   sabemos si llego, la plataforma queda en `verificacion_requerida` y el motor
   no la vuelve a tocar. Preferimos una publicacion que falta a una duplicada:
   la primera se arregla, la segunda no.

GATE DE PUBLICACION REAL
------------------------
Mientras `publicacion_automatica` sea false en CONFIG/config.json, este modulo
NO puede invocar los publicadores con `--confirm`. La barrera esta en
`_invocar_node()`, en el camino por el que pasa cualquier publicacion: no es un
boton oculto en la interfaz, es una comprobacion en el codigo.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

from . import (catalogo_social, catalogo_video, config as cfg_mod,
               entorno as entorno_mod, historial, programacion, rutas)

PLATAFORMAS = ("instagram", "facebook")

# --------------------------------------------------------------------- #
# Estados por plataforma                                                 #
# --------------------------------------------------------------------- #

PENDIENTE = "pendiente"
PUBLICANDO = "publicando"
PUBLICADA = "publicada"
FALLIDA = "fallida"
VERIFICACION = "verificacion_requerida"
NO_APTA = "no_apta"

ESTADOS_PLATAFORMA = (PENDIENTE, PUBLICANDO, PUBLICADA, FALLIDA, VERIFICACION, NO_APTA)

#: Estados desde los que NO se debe volver a llamar a Meta.
INTOCABLES = (PUBLICADA, VERIFICACION, PUBLICANDO)

# Resultados globales derivados del estado de cada plataforma.
GLOBAL_PENDIENTE = "pendiente"
GLOBAL_PARCIAL = "parcial"
GLOBAL_PUBLICADA = "publicada"
GLOBAL_VERIFICAR = "requiere_verificacion"
GLOBAL_FALLIDA = "fallida"


class PublicacionBloqueada(RuntimeError):
    """El gate de configuracion impide publicar de verdad."""


class BloqueoActivo(RuntimeError):
    """Otro proceso esta trabajando en esta propuesta."""


# --------------------------------------------------------------------- #
# Gate                                                                   #
# --------------------------------------------------------------------- #


def publicacion_real_habilitada() -> bool:
    """¿Esta abierto el interruptor general?"""
    return bool(cfg_mod.cargar().get("publicacion_automatica", False))


# --- Segunda cerradura: autorizacion por propuesta -------------------- #

ARCHIVO_AUTORIZACIONES = rutas.CONFIG / "autorizaciones.json"


def cargar_autorizaciones() -> dict[str, Any]:
    try:
        return json.loads(ARCHIVO_AUTORIZACIONES.read_text(encoding="utf-8"))
    except Exception:
        return {"jobs": {}}


def _guardar_autorizaciones(datos: dict[str, Any]) -> None:
    ARCHIVO_AUTORIZACIONES.parent.mkdir(parents=True, exist_ok=True)
    ARCHIVO_AUTORIZACIONES.write_text(
        json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def autorizar_job(job_id: str, minutos: int = 30, nota: str = "") -> dict[str, Any]:
    """Autoriza UNA propuesta concreta a publicarse de verdad, con caducidad."""
    from datetime import timedelta

    datos = cargar_autorizaciones()
    expira = programacion.ahora() + timedelta(minutes=minutos)
    datos.setdefault("jobs", {})[job_id] = {
        "autorizado_en": programacion.guardar_iso(programacion.ahora()),
        "expira_en": programacion.guardar_iso(expira),
        "nota": nota,
    }
    _guardar_autorizaciones(datos)
    return datos["jobs"][job_id]


def limpiar_autorizaciones() -> int:
    """Vacia la lista. Se llama al terminar cualquier prueba."""
    datos = cargar_autorizaciones()
    n = len(datos.get("jobs") or {})
    _guardar_autorizaciones({"jobs": {}})
    return n


def jobs_autorizados() -> list[str]:
    """Autorizaciones vigentes, descartando las caducadas."""
    ahora = programacion.ahora()
    vigentes = []
    for job, d in (cargar_autorizaciones().get("jobs") or {}).items():
        expira = programacion.leer_iso(d.get("expira_en"))
        if expira is None or expira > ahora:
            vigentes.append(job)
    return sorted(vigentes)


def job_autorizado(job_id: str) -> bool:
    """¿Esta ESTA propuesta autorizada a publicarse de verdad?

    Es la segunda cerradura. El interruptor general no basta: aunque
    `publicacion_automatica` este en true, una propuesta que no aparezca aqui
    NO puede publicarse. Asi una prueba supervisada de un job no abre la puerta
    a las otras 48 del calendario.
    """
    return job_id in jobs_autorizados()


def es_express(job_id: str) -> bool:
    """¿Es una publicacion express?

    Se mira el registro, y como respaldo el prefijo del identificador: si por lo
    que sea el historial no se puede leer, un EXP- se sigue tratando como
    express. En una barrera de seguridad, la duda se resuelve del lado estricto.
    """
    if str(job_id).upper().startswith("EXP-"):
        return True
    reg = historial.buscar(job_id)
    return bool(reg and reg.get("express"))


def puede_publicar(job_id: str) -> tuple[bool, str]:
    """LA barrera. Unico sitio del sistema que decide si algo puede publicarse.

    Dos llaves, y la estrecha es la preferente:

    1. AUTORIZACION PUNTUAL por propuesta (`autorizar_job`), con caducidad. Es
       la que se usa en una prueba supervisada: abre exactamente un job y nada
       mas. Aunque otras 48 esten listas, se rechazan por no estar autorizadas.

    2. `publicacion_automatica` en config, para la futura ejecucion desatendida.
       Hoy esta forzada a false por `config._BLOQUEADAS_EN_FASE_1`.

    Sin ninguna de las dos, no hay ruta posible hacia Meta.
    """
    # BARRERA DE ENTORNO, antes que cualquier otra llave. Una maquina de
    # desarrollo no puede publicar ni con el gate abierto ni con autorizacion.
    if not entorno_mod.es_produccion():
        d = entorno_mod.detalle()
        return False, (
            f"entorno '{d['entorno']}': solo la VM de produccion puede publicar. "
            f"{d['motivo']}"
        )

    if job_autorizado(job_id):
        return True, "autorizacion puntual vigente"

    # Una EXPRESS SIEMPRE exige autorizacion individual, este el gate abierto o
    # cerrado. El gate automatiza el calendario, que es contenido revisado y con
    # fecha acordada; una express nace de una decision puntual y no debe poder
    # salir sola nunca.
    if es_express(job_id):
        return False, (
            f"{job_id} es una EXPRESS: exige autorizacion individual explicita, "
            "aunque publicacion_automatica este activada."
        )

    if publicacion_real_habilitada():
        return True, "publicacion_automatica activada"
    vigentes = jobs_autorizados()
    return False, (
        f"{job_id} no puede publicarse: publicacion_automatica=false y no tiene "
        "autorizacion puntual. Autorizadas ahora mismo: "
        + (", ".join(vigentes) if vigentes else "NINGUNA")
    )


def estado_motor() -> dict[str, str]:
    """Lo que se muestra al usuario, sin ambiguedad."""
    habilitada = publicacion_real_habilitada()
    autorizados = jobs_autorizados()
    ent = entorno_mod.entorno()
    return {
        "entorno": ent.upper(),
        "publicacion_automatica": "ACTIVADA" if habilitada else "DESACTIVADA",
        "motor": "OPERATIVO",
        # El modo dice la verdad: si hay una autorizacion puntual vigente, esto
        # ya NO es simulacion, aunque el interruptor general siga cerrado.
        # En desarrollo el modo es siempre simulacion, diga lo que diga el gate.
        "modo": ("SIMULACION (entorno de desarrollo)"
                 if ent != entorno_mod.PRODUCCION
                 else "PUBLICACION REAL" if habilitada
                 else "PUBLICACION REAL AUTORIZADA POR JOB" if autorizados
                 else "SIMULACION"),
        "publicaciones_reales_autorizadas": ", ".join(autorizados) if autorizados else "NINGUNA",
    }


# --------------------------------------------------------------------- #
# Bloqueo por propuesta                                                  #
# --------------------------------------------------------------------- #

CARPETA_LOCKS = rutas.CONFIG / "locks"

#: Un lock mas viejo que esto se considera huerfano de un proceso muerto.
LOCK_CADUCA_SEGUNDOS = 900


def _proceso_vivo(pid: int) -> bool:
    """¿Sigue existiendo ese proceso? Sin matarlo ni tocarlo."""
    if pid <= 0:
        return False
    if os.name == "nt":
        try:
            salida = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/NH"],
                capture_output=True, text=True, timeout=15, check=False,
            ).stdout
            return str(pid) in salida
        except Exception:
            return True  # ante la duda, se respeta el lock
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


@dataclass
class Bloqueo:
    """Lock de fichero para una propuesta. Se libera con `soltar()`."""

    ruta: Path
    adquirido: bool = False

    def soltar(self) -> None:
        if self.adquirido:
            self.ruta.unlink(missing_ok=True)
            self.adquirido = False


def tomar_bloqueo(job_id: str) -> Bloqueo:
    """Toma el lock de una propuesta o lanza `BloqueoActivo`.

    Se usa creacion exclusiva del fichero, que es atomica: si dos procesos
    arrancan a la vez, solo uno lo consigue. Un lock cuyo proceso ya no existe
    (o demasiado viejo) se considera huerfano y se recupera, para que un corte
    de luz no deje el sistema bloqueado para siempre.
    """
    CARPETA_LOCKS.mkdir(parents=True, exist_ok=True)
    ruta = CARPETA_LOCKS / f"{job_id}.lock"

    for _ in range(2):
        try:
            fd = os.open(str(ruta), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            datos = {}
            try:
                datos = json.loads(ruta.read_text(encoding="utf-8"))
            except Exception:
                pass
            pid = int(datos.get("pid") or 0)
            edad = time.time() - ruta.stat().st_mtime if ruta.exists() else 0
            if _proceso_vivo(pid) and edad < LOCK_CADUCA_SEGUNDOS:
                raise BloqueoActivo(
                    f"{job_id} lo esta procesando el PID {pid} "
                    f"(hace {int(edad)} s). No se toca."
                )
            # Huerfano: se recupera.
            ruta.unlink(missing_ok=True)
            continue
        else:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump({"pid": os.getpid(), "job": job_id,
                           "desde": programacion.guardar_iso(programacion.ahora())}, f)
            return Bloqueo(ruta=ruta, adquirido=True)

    raise BloqueoActivo(f"No se pudo tomar el bloqueo de {job_id}.")


# --------------------------------------------------------------------- #
# Estado por plataforma en el historial                                  #
# --------------------------------------------------------------------- #


def estado_plataformas(pub: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Devuelve el estado por plataforma, creandolo si el registro es antiguo.

    Compatibilidad: las publicaciones de antes de esta fase no tienen el bloque
    `plataformas`. Se deduce de lo que ya guardaban (`id_publicacion_meta` y
    `url_publicacion`), sin reescribir nada en disco.
    """
    guardado = pub.get("plataformas")
    if isinstance(guardado, dict) and guardado:
        return guardado

    previstas = pub.get("plataforma") or list(PLATAFORMAS)
    ids = pub.get("id_publicacion_meta") or {}
    urls = pub.get("url_publicacion") or {}

    deducido: dict[str, dict[str, Any]] = {}
    for p in previstas:
        identificador = ids.get(p)
        deducido[p] = {
            "estado": PUBLICADA if identificador else PENDIENTE,
            "id": identificador,
            "permalink": urls.get(p),
            "publicado_en": pub.get("fecha_publicacion") if identificador else None,
            "intentos": 1 if identificador else 0,
            "error": None,
            "ultimo_intento": None,
        }
    return deducido


def resultado_global(plataformas: dict[str, dict[str, Any]]) -> str:
    """Un solo estado global, derivado y nunca optimista."""
    estados = [v.get("estado", PENDIENTE) for v in plataformas.values()]
    if not estados:
        return GLOBAL_PENDIENTE
    if all(e == PUBLICADA for e in estados):
        return GLOBAL_PUBLICADA
    if any(e == VERIFICACION for e in estados):
        return GLOBAL_VERIFICAR
    if any(e == PUBLICADA for e in estados):
        return GLOBAL_PARCIAL
    if any(e == FALLIDA for e in estados):
        return GLOBAL_FALLIDA
    return GLOBAL_PENDIENTE


def _guardar_plataformas(job_id: str, plataformas: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """Persiste el estado por plataforma y ajusta el estado global.

    El estado global solo pasa a `publicada` cuando TODAS las plataformas
    previstas estan confirmadas. Nunca antes.
    """
    glob = resultado_global(plataformas)
    cambios: dict[str, Any] = {"plataformas": plataformas, "resultado_global": glob}

    ids = {p: d.get("id") for p, d in plataformas.items()}
    urls = {p: d.get("permalink") for p, d in plataformas.items()}
    cambios["id_publicacion_meta"] = ids
    cambios["url_publicacion"] = urls

    if glob == GLOBAL_PUBLICADA:
        fechas = [d.get("publicado_en") for d in plataformas.values() if d.get("publicado_en")]
        cambios["fecha_publicacion"] = min(fechas) if fechas else None
        cambios["publicado_por_sistema"] = True

    historial.actualizar(job_id, cambios)

    reg = historial.buscar(job_id) or {}
    if glob == GLOBAL_PUBLICADA and reg.get("estado") != "publicada":
        historial.cambiar_estado(job_id, "publicada")
    return historial.buscar(job_id) or reg


# --------------------------------------------------------------------- #
# Reconciliacion con los diarios de Node                                 #
# --------------------------------------------------------------------- #

DIARIOS = {
    "instagram": (".instagram-publish-state.json", "media_id"),
    "facebook": (".facebook-publish-state.json", "post_id"),
}


def leer_diario_node(plataforma: str, job_id: str) -> dict[str, Any] | None:
    """Lee la entrada del diario de Node. SOLO LECTURA: nunca se escribe."""
    nombre, _ = DIARIOS[plataforma]
    ruta = catalogo_social.repo_web() / nombre
    try:
        return json.loads(ruta.read_text(encoding="utf-8")).get(job_id)
    except Exception:
        return None


def reconciliar(job_id: str, plataforma: str,
                actual: dict[str, Any]) -> dict[str, Any]:
    """Cruza lo que cree Python con lo que registro Node, antes de publicar.

    Los diarios de Node son la ultima defensa del publicador y manda lo que
    digan. Si Node ya tiene un identificador, la plataforma esta publicada,
    aunque el historial de Python lo ignore: se adopta su id y su permalink en
    vez de intentar publicar otra vez.

    Si Node tiene un intento sin confirmar, no se reintenta: se marca para
    verificacion.
    """
    entrada = leer_diario_node(plataforma, job_id)
    if not entrada:
        return actual

    _, campo = DIARIOS[plataforma]
    identificador = entrada.get(campo)

    if identificador:
        if actual.get("estado") != PUBLICADA or not actual.get("id"):
            return {
                **actual,
                "estado": PUBLICADA,
                "id": str(identificador),
                "permalink": entrada.get("permalink") or actual.get("permalink"),
                "publicado_en": entrada.get("publicado_en") or actual.get("publicado_en"),
                "error": None,
                "nota": "Reconciliado con el diario de Node: ya estaba publicada.",
            }
        return actual

    if entrada.get("publish_attempted") and actual.get("estado") not in (PUBLICADA,):
        return {
            **actual,
            "estado": VERIFICACION,
            "error": "El diario de Node registra un intento sin resultado. "
                     "Hay que comprobar a mano si la publicacion existe.",
        }

    return actual


# --------------------------------------------------------------------- #
# Validacion previa                                                      #
# --------------------------------------------------------------------- #


@dataclass
class Validacion:
    ok: bool = True
    problemas: list[str] = field(default_factory=list)
    url_imagen: str | None = None
    url_video: str | None = None
    archivo_video: str | None = None
    tipo_medio: str = "image"
    metadata: Path | None = None

    def fallar(self, motivo: str) -> "Validacion":
        self.ok = False
        self.problemas.append(motivo)
        return self


#: Tipos de medio que el motor sabe publicar. `image` es el de siempre.
TIPOS_MEDIO = ("image", "reels", "video", "stories")

#: Tipos que no llevan texto. Una historia no tiene pie: Meta lo descarta, asi
#: que exigirle un caption almacenado abortaria una publicacion correcta.
TIPOS_SIN_TEXTO = ("stories",)


def validar(pub: dict[str, Any], plataforma: str | None = None) -> Validacion:
    """Comprueba todo lo que debe cumplirse ANTES de pensar en publicar."""
    v = Validacion()

    if pub.get("estado") != "lista_para_publicar":
        v.fallar(f"estado '{pub.get('estado')}', se esperaba lista_para_publicar")

    previstas = pub.get("plataforma") or []
    if plataforma and plataforma not in previstas:
        v.fallar(f"{plataforma} no esta entre las plataformas previstas")

    # El tipo de medio decide en que manifiesto se busca la URL y si hace falta
    # texto. Sin campo, es una publicacion de imagen: asi las 54 entradas ya
    # existentes siguen comportandose exactamente igual.
    tipo = pub.get("tipo_medio") or "image"
    if tipo not in TIPOS_MEDIO:
        v.fallar(f"tipo_medio '{tipo}' desconocido")
        tipo = "image"
    v.tipo_medio = tipo

    if tipo not in TIPOS_SIN_TEXTO:
        textos = pub.get("texto") or {}
        for p in ([plataforma] if plataforma else previstas):
            if not textos.get(p):
                v.fallar(f"sin caption almacenado para {p}")

    id_archivo = pub.get("id_archivo") or ""

    if tipo == "image":
        url = catalogo_social.url_publica(id_archivo) if id_archivo else None
        if not url:
            v.fallar("sin imagen publica en el manifiesto")
        else:
            v.url_imagen = url
    else:
        url = catalogo_video.url_publica(id_archivo) if id_archivo else None
        if not url:
            v.fallar("sin video publico en el manifiesto")
        elif not catalogo_video.desplegado(id_archivo):
            # El archivo tiene que existir en disco. Si falta, el commit y push
            # no se han hecho y Meta recibiria un 404 a mitad de publicacion.
            v.fallar("el derivado de video no esta en public/social/video/ (falta desplegar)")
        else:
            v.url_video = url
            # Ruta local del derivado. Facebook sube los bytes desde aqui.
            local = catalogo_video.ruta_local(id_archivo)
            if local is not None:
                v.archivo_video = str(local)

    carpeta = pub.get("carpeta_pendiente") or ""
    metadata = (rutas.RAIZ / carpeta / "metadata.json") if carpeta else None
    if not metadata or not metadata.is_file():
        v.fallar("no se encuentra el metadata.json de la propuesta")
    else:
        v.metadata = metadata

    return v


def credenciales_presentes(plataforma: str) -> bool:
    """¿Existe el fichero de credenciales que necesitara Node?

    No se leen los valores ni se comprueban contra Meta: eso lo hacen los
    propios scripts. Aqui solo se evita invocarlos a ciegas.
    """
    return (catalogo_social.repo_web() / ".env.local").is_file()


# --------------------------------------------------------------------- #
# Invocacion de Node                                                     #
# --------------------------------------------------------------------- #

ENVOLTORIO = "scripts/social-publish.mjs"


def _invocar_node(plataforma: str, job_id: str, metadata: Path,
                  url_imagen: str | None = None,
                  tiempo_limite: int = 300,
                  tipo_medio: str = "image",
                  url_video: str | None = None,
                  archivo_video: str | None = None) -> dict[str, Any]:
    """Lanza el envoltorio Node y devuelve su contrato JSON.

    ESTE ES EL GATE. Es el unico camino por el que una publicacion real puede
    salir del sistema, y esta cerrado mientras `publicacion_automatica` sea
    false. Sin esta comprobacion no hay ruta alternativa: el resto del modulo
    no sabe hablar con Meta.

    Un video tarda mucho mas que una imagen: Meta lo descarga y lo transcodifica,
    y el publicador sondea hasta cinco minutos. El tiempo limite se amplia para
    que un Reel legitimo no muera por reloj — un timeout aqui deja el estado
    indeterminado, que es el peor resultado posible.
    """
    permitido, motivo = puede_publicar(job_id)
    if not permitido:
        raise PublicacionBloqueada(motivo)

    node = shutil.which("node")
    if not node:
        return {"ok": False, "platform": plataforma, "job_id": job_id,
                "status": "failed", "retry_safe": True,
                "message": "No se encontro 'node' en el PATH."}

    if tipo_medio != "image" and tiempo_limite < 600:
        tiempo_limite = 600

    orden = [
        node, str(catalogo_social.repo_web() / ENVOLTORIO),
        f"--platform={plataforma}",
        f"--job={job_id}",
        f"--metadata={metadata}",
    ]
    if tipo_medio == "image":
        orden.append(f"--image-url={url_imagen}")
    else:
        # Una historia es historia en las dos redes: no se traduce. Fuera de
        # eso, Instagram no tiene video de feed y cualquier video suyo es un
        # Reel; en Facebook se respeta lo que pida la propuesta.
        if tipo_medio == "stories":
            efectivo = "stories"
        else:
            efectivo = "reels" if plataforma == "instagram" else tipo_medio
        orden.append(f"--media-type={efectivo}")
        orden.append(f"--video-url={url_video}")
        # Solo Facebook: sube los bytes en vez de hacer que Meta descargue la
        # URL. Su descargador obedece robots.txt y el gestionado de Cloudflare
        # bloquea `meta-externalagent`. Instagram no esta bloqueado y usa la URL.
        if (plataforma == "facebook"
                and efectivo in ("reels", "stories")
                and archivo_video):
            orden.append(f"--video-file={archivo_video}")
    orden.append("--confirm")

    try:
        proceso = subprocess.run(
            orden, cwd=str(catalogo_social.repo_web()),
            capture_output=True, text=True, encoding="utf-8", errors="replace",
            timeout=tiempo_limite, env=os.environ.copy(), check=False,
        )
    except subprocess.TimeoutExpired:
        # Un timeout NO significa que no se publicara. Estado indeterminado.
        return {"ok": False, "platform": plataforma, "job_id": job_id,
                "status": "verification_required", "retry_safe": False,
                "message": f"El publicador no respondio en {tiempo_limite} s. "
                           "No se sabe si la publicacion se creo."}

    linea = (proceso.stdout or "").strip().splitlines()
    for candidata in reversed(linea):
        try:
            return json.loads(candidata)
        except json.JSONDecodeError:
            continue

    return {"ok": False, "platform": plataforma, "job_id": job_id,
            "status": "verification_required", "retry_safe": False,
            "message": "El envoltorio no devolvio JSON. Estado indeterminado."}


# --------------------------------------------------------------------- #
# Simulacion                                                             #
# --------------------------------------------------------------------- #

#: Escenarios que se pueden pedir por plataforma en modo simulacion.
ESCENARIOS = ("ok", "fallo", "ambiguo", "no_ejecutado")


def parsear_escenarios(texto: str) -> dict[str, str]:
    """'instagram=ok,facebook=fallo' -> {'instagram': 'ok', 'facebook': 'fallo'}"""
    plan: dict[str, str] = {}
    for trozo in (texto or "").split(","):
        trozo = trozo.strip()
        if not trozo:
            continue
        if "=" not in trozo:
            raise ValueError(f"Escenario invalido: '{trozo}'. Usa plataforma=resultado.")
        p, r = (x.strip() for x in trozo.split("=", 1))
        if p not in PLATAFORMAS:
            raise ValueError(f"Plataforma desconocida: '{p}'.")
        if r not in ESCENARIOS:
            raise ValueError(f"Resultado desconocido: '{r}'. Usa: {', '.join(ESCENARIOS)}.")
        plan[p] = r
    return plan


def _simular_node(plataforma: str, job_id: str, escenario: str) -> dict[str, Any]:
    """Devuelve un contrato JSON como el que daria Node, sin tocar la red.

    Sirve para ejercitar la maquina completa: exito, fallo seguro, respuesta
    ambigua y plataforma no ejecutada.
    """
    marca = programacion.guardar_iso(programacion.ahora())
    campo = "media_id" if plataforma == "instagram" else "post_id"
    sufijo = job_id.replace("-", "")[-6:]

    if escenario == "ok":
        return {
            "ok": True, "platform": plataforma, "job_id": job_id,
            "status": "published", "retry_safe": False,
            campo: f"SIM{sufijo}",
            "permalink": f"https://simulado.local/{plataforma}/{sufijo}",
            "published_at": marca, "exit_code": 0,
            "message": "SIMULADO: publicacion correcta. No se llamo a Meta.",
        }
    if escenario == "fallo":
        return {
            "ok": False, "platform": plataforma, "job_id": job_id,
            "status": "failed", "retry_safe": True, "exit_code": 1,
            "error_code": "SIM_PREPOST",
            "message": "SIMULADO: fallo ANTES de enviar nada. Reintentar es seguro.",
        }
    if escenario == "ambiguo":
        return {
            "ok": False, "platform": plataforma, "job_id": job_id,
            "status": "verification_required", "retry_safe": False, "exit_code": 1,
            "message": "SIMULADO: la peticion salio y se perdio la respuesta. "
                       "NO reintentar.",
        }
    return {
        "ok": False, "platform": plataforma, "job_id": job_id,
        "status": "not_attempted", "retry_safe": True, "exit_code": 0,
        "message": "SIMULADO: no se ejecuto esta plataforma.",
    }


# --------------------------------------------------------------------- #
# Aplicacion del contrato al estado                                      #
# --------------------------------------------------------------------- #


def aplicar_contrato(estado: dict[str, Any], contrato: dict[str, Any]) -> dict[str, Any]:
    """Traduce el contrato JSON de Node a estado por plataforma."""
    marca = programacion.guardar_iso(programacion.ahora())
    nuevo = {**estado, "ultimo_intento": marca,
             "intentos": int(estado.get("intentos") or 0) + 1}
    situacion = contrato.get("status")

    if situacion in ("published", "already_published"):
        return {
            **nuevo,
            "estado": PUBLICADA,
            "id": contrato.get("media_id") or contrato.get("post_id"),
            "permalink": contrato.get("permalink"),
            "publicado_en": contrato.get("published_at") or marca,
            "error": None,
        }

    if situacion == "verification_required":
        return {**nuevo, "estado": VERIFICACION,
                "error": contrato.get("message") or "resultado indeterminado"}

    if situacion == "not_attempted":
        return {**nuevo, "estado": PENDIENTE, "intentos": estado.get("intentos") or 0,
                "error": contrato.get("message")}

    return {**nuevo, "estado": FALLIDA,
            "error": contrato.get("message") or "fallo sin detalle",
            "error_code": contrato.get("error_code"),
            "retry_safe": bool(contrato.get("retry_safe", False))}


# --------------------------------------------------------------------- #
# Ejecucion de una propuesta                                            #
# --------------------------------------------------------------------- #


@dataclass
class Ejecucion:
    job_id: str
    proyecto: str = ""
    plataformas: dict[str, dict[str, Any]] = field(default_factory=dict)
    global_antes: str = ""
    global_despues: str = ""
    acciones: list[str] = field(default_factory=list)
    bloqueada_por_gate: bool = False
    problemas: list[str] = field(default_factory=list)
    omitida: str = ""


def ejecutar_publicacion(job_id: str, simular: dict[str, str] | None = None,
                         forzar_real: bool = False,
                         parar_si_falla: bool = True) -> Ejecucion:
    """Procesa una propuesta: solo las plataformas que siguen pendientes.

    Nunca vuelve a llamar a una plataforma que ya esta publicada, ni a una que
    quedo en verificacion. Eso se comprueba dos veces: contra el estado
    persistente de Python y contra el diario de Node.
    """
    pub = historial.buscar(job_id)
    if pub is None:
        e = Ejecucion(job_id=job_id)
        e.omitida = "no existe"
        return e

    e = Ejecucion(job_id=job_id, proyecto=pub.get("proyecto_nombre", ""))

    try:
        bloqueo = tomar_bloqueo(job_id)
    except BloqueoActivo as exc:
        e.omitida = str(exc)
        return e

    try:
        plataformas = estado_plataformas(pub)

        # Reconciliacion ANTES de decidir nada: manda el diario de Node.
        for p in list(plataformas):
            antes = dict(plataformas[p])
            plataformas[p] = reconciliar(job_id, p, plataformas[p])
            if plataformas[p] != antes:
                e.acciones.append(f"{p}: reconciliado con el diario de Node "
                                  f"-> {plataformas[p]['estado']}")

        e.global_antes = resultado_global(plataformas)

        validacion = validar(pub)
        if not validacion.ok:
            e.problemas = validacion.problemas
            for p, d in plataformas.items():
                if d.get("estado") == PENDIENTE:
                    plataformas[p] = {**d, "estado": FALLIDA,
                                      "error": "; ".join(validacion.problemas),
                                      "ultimo_intento": programacion.guardar_iso(programacion.ahora())}
            e.plataformas = plataformas
            e.global_despues = resultado_global(plataformas)
            _guardar_plataformas(job_id, plataformas)
            return e

        for p in pub.get("plataforma") or []:
            actual = plataformas.get(p) or {"estado": PENDIENTE, "intentos": 0}

            if actual.get("estado") in INTOCABLES:
                e.acciones.append(f"{p}: omitida ({actual['estado']})")
                plataformas[p] = actual
                continue

            if simular is not None:
                contrato = _simular_node(p, job_id, simular.get(p, "no_ejecutado"))
            elif not puede_publicar(job_id)[0]:
                e.bloqueada_por_gate = True
                e.acciones.append(f"{p}: BLOQUEADA POR CONFIGURACION (no se invoco a Node)")
                plataformas[p] = actual
                continue
            else:
                if not credenciales_presentes(p):
                    contrato = {"ok": False, "platform": p, "job_id": job_id,
                                "status": "failed", "retry_safe": True,
                                "message": "No hay .env.local con credenciales."}
                else:
                    try:
                        contrato = _invocar_node(
                            p, job_id, validacion.metadata,
                            url_imagen=validacion.url_imagen,
                            tipo_medio=validacion.tipo_medio,
                            url_video=validacion.url_video,
                            archivo_video=validacion.archivo_video,
                        )
                    except PublicacionBloqueada as exc:
                        e.bloqueada_por_gate = True
                        e.acciones.append(f"{p}: BLOQUEADA POR CONFIGURACION — {exc}")
                        plataformas[p] = actual
                        continue

            plataformas[p] = aplicar_contrato(actual, contrato)
            e.acciones.append(f"{p}: {contrato.get('status')} -> {plataformas[p]['estado']}")

            # Orden estricto: si una plataforma no queda confirmada, se para y
            # no se toca la siguiente. Encadenar publicaciones sobre un estado
            # dudoso es como se acumulan los problemas difíciles de deshacer.
            if parar_si_falla and plataformas[p]["estado"] != PUBLICADA:
                e.acciones.append(
                    f"DETENIDO tras {p} ({plataformas[p]['estado']}): "
                    "no se intenta ninguna plataforma mas en esta pasada."
                )
                break

        e.plataformas = plataformas
        e.global_despues = resultado_global(plataformas)
        _guardar_plataformas(job_id, plataformas)
        return e
    finally:
        bloqueo.soltar()


def ejecutar_programadas(momento: datetime | None = None,
                         simular: dict[str, str] | None = None,
                         solo: str | None = None,
                         parar_si_falla: bool = True) -> dict[str, Any]:
    """Revisa el calendario y procesa lo que ya toca.

    Primero deja que el scheduler marque como listas las programaciones
    vencidas, y despues trabaja solo sobre `lista_para_publicar`.
    """
    informe = programacion.revisar(momento=momento, aplicar=True)

    ids = [e.id for e in informe.listas]
    if solo:
        ids = [i for i in ids if i == solo]

    ejecuciones = [ejecutar_publicacion(i, simular=simular, parar_si_falla=parar_si_falla)
                   for i in ids]

    return {
        "momento": informe.momento,
        "simulado_reloj": informe.simulado,
        "simulado_publicacion": simular is not None,
        "listas": informe.listas,
        "futuras": len(informe.futuras),
        "ejecuciones": ejecuciones,
        "motor": estado_motor(),
    }
