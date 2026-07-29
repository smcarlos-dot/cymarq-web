"""Panel local de revision y aprobacion (http://127.0.0.1:PUERTO).

Servidor HTTP de la libreria estandar: sin dependencias externas y escuchando
solo en la interfaz local. No expone el sistema a la red ni publica nada.
"""

from __future__ import annotations

import json
import mimetypes
import socket
import threading
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from . import (
    config as cfg_mod,
    generador,
    historial,
    inventario,
    catalogo_social,
    limites_redes,
    perfiles as perfiles_mod,
    programacion,
    rotacion,
    rutas,
)

WEB = Path(__file__).parent / "panel_web"


# --- Datos que consume la interfaz --------------------------------------


def _estado_completo() -> dict[str, Any]:
    cfg = cfg_mod.cargar()
    inv = inventario.cargar()
    fichas = perfiles_mod.cargar_perfiles()
    pubs = historial.listar()

    resumen = inv.get("resumen", {})
    por_proyecto = resumen.get("por_proyecto", {})

    proyectos = []
    for carpeta, ficha in fichas.items():
        stats = por_proyecto.get(carpeta, {"total": 0, "publicables": 0})
        usados = [p for p in pubs if p.get("proyecto") == carpeta
                  and p.get("estado") in historial.ESTADOS_QUE_OCUPAN]
        disponibles = [
            it for it in inv.get("items", [])
            if it["proyecto"] == carpeta and it["estado"] == "disponible"
            and it["apto_publicacion"]
        ]
        proyectos.append({
            "carpeta": carpeta,
            "nombre": ficha.get("nombre", carpeta),
            "ubicacion": ficha.get("ubicacion", ""),
            "anio": ficha.get("anio", ""),
            "tipologia": ficha.get("tipologia", ""),
            "temas": ficha.get("temas", []),
            "archivos": stats.get("total", 0),
            "publicables": stats.get("publicables", 0),
            "disponibles": len(disponibles),
            "publicaciones": len(usados),
            "ultima": max((p.get("fecha_creacion", "") for p in usados),
                          default=""),
        })
    proyectos.sort(key=lambda p: p["carpeta"])

    # "Pendiente" es todo lo que sigue vivo y aun no se ha publicado. Incluye
    # lo programado y lo que ya vencio: si no apareciera aqui, no habria forma
    # de verlo ni de reprogramarlo desde el panel.
    EN_CURSO = ("propuesta", "aprobada", "programada", "lista_para_publicar")
    pendientes = [p for p in pubs if p.get("estado") in EN_CURSO]
    publicadas = [p for p in pubs if p.get("estado") == "publicada"]

    # La URL publica de cada imagen sale del manifiesto, que se lee una sola
    # vez: con el banco completo son decenas de publicaciones y no tiene
    # sentido releer el archivo por cada una.
    catalogo = catalogo_social.cargar_manifiesto().get("imagenes", {})
    for p in pendientes:
        entrada = catalogo.get(p.get("id_archivo", ""))
        p["imagen_publica"] = (entrada or {}).get("url")

    # Se muestra primero lo que reclama una decision, en ese orden.
    actual = None
    for estado in EN_CURSO:
        actual = next((p for p in pendientes if p.get("estado") == estado), None)
        if actual is not None:
            break

    avisos: list[str] = []
    if actual:
        avisos += limites_redes.avisos_instagram(
            actual["texto"]["instagram"], actual.get("hashtags", [])
        )
        avisos += limites_redes.avisos_facebook(
            actual["texto"]["facebook"], actual.get("hashtags_facebook", [])
        )

    return {
        "empresa": {
            "nombre": cfg.get("nombre_empresa"),
            "eslogan": cfg.get("eslogan"),
            "instagram": cfg.get("instagram"),
            "facebook": cfg.get("facebook"),
            "whatsapp": cfg.get("whatsapp"),
            "correo": cfg.get("correo"),
        },
        "seguridad": {
            "modo_aprobacion": cfg.get("modo_aprobacion"),
            "publicacion_automatica": cfg.get("publicacion_automatica"),
            # La publicacion no la hace este proceso: la ejecuta el operador
            # a traves del puente hacia los publicadores Node.
            "publicacion_desde_el_panel": False,
            "scheduler": "OPERATIVO — MODO SIMULACIÓN",
        },
        "programacion": {
            "zona": programacion.NOMBRE_ZONA,
            "ahora": programacion.formato_humano(programacion.ahora()),
            "programado_para": (actual or {}).get("programado_para"),
            "texto": programacion.formato_humano((actual or {}).get("programado_para")),
            "programable": (actual or {}).get("estado") in programacion.PROGRAMABLES,
            "sugerida": programacion.guardar_iso(
                programacion.a_zona(rotacion.proxima_fecha(cfg))
            ),
        },
        "resumen": {
            "total_archivos": inv.get("total_archivos", 0),
            "publicables": resumen.get("publicables", 0),
            "por_tipo": resumen.get("por_tipo", {}),
            "por_estado": resumen.get("por_estado", {}),
            "proyectos": len(fichas),
            "escaneado": inv.get("generado", ""),
        },
        "proyectos": proyectos,
        "propuesta_actual": actual,
        "pendientes": pendientes,
        "publicadas": publicadas,
        "historial": pubs[:60],
        "avisos": avisos,
        "proxima_fecha": rotacion.proxima_fecha(cfg).strftime("%Y-%m-%d %H:%M"),
        "generado": datetime.now().astimezone().isoformat(timespec="seconds"),
    }


def _ruta_imagen(id_publicacion: str) -> Path | None:
    reg = historial.buscar(id_publicacion)
    if not reg:
        return None

    candidata = reg.get("copia_local", "")
    if candidata:
        ruta = (rutas.RAIZ / candidata).resolve()
        if ruta.is_file() and _dentro_pendientes(ruta):
            return ruta

    carpeta = (rutas.RAIZ / reg.get("carpeta_pendiente", "") / "imagen").resolve()
    if carpeta.is_dir() and _dentro_pendientes(carpeta):
        for archivo in sorted(carpeta.iterdir()):
            if archivo.is_file():
                return archivo
    return None


def _dentro_pendientes(ruta: Path) -> bool:
    try:
        ruta.resolve().relative_to(rutas.PENDIENTES.resolve())
        return True
    except ValueError:
        return False


# --- Servidor -----------------------------------------------------------


class Manejador(BaseHTTPRequestHandler):
    server_version = "CymarqSocial/1.0"

    def log_message(self, formato: str, *args: Any) -> None:  # silencio
        pass

    # -- utilidades --
    def _json(self, datos: Any, codigo: int = 200) -> None:
        cuerpo = json.dumps(datos, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(cuerpo)

    def _archivo(self, ruta: Path, tipo: str | None = None) -> None:
        if not ruta.is_file():
            self._json({"error": "No encontrado"}, 404)
            return
        datos = ruta.read_bytes()
        tipo = tipo or mimetypes.guess_type(ruta.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(datos)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(datos)

    def _cuerpo(self) -> dict[str, Any]:
        largo = int(self.headers.get("Content-Length") or 0)
        if not largo:
            return {}
        try:
            return json.loads(self.rfile.read(largo).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return {}

    # -- rutas --
    def do_GET(self) -> None:  # noqa: N802
        camino = unquote(urlparse(self.path).path)

        if camino in ("/", "/index.html"):
            self._archivo(WEB / "index.html", "text/html; charset=utf-8")
            return

        if camino == "/panel.css":
            self._archivo(WEB / "panel.css", "text/css; charset=utf-8")
            return

        if camino == "/panel.js":
            self._archivo(WEB / "panel.js", "application/javascript; charset=utf-8")
            return

        if camino == "/api/estado":
            try:
                self._json(_estado_completo())
            except Exception as exc:  # pragma: no cover
                self._json({"error": str(exc)}, 500)
            return

        if camino.startswith("/imagen/"):
            ident = camino.split("/imagen/", 1)[1].strip("/")
            ruta = _ruta_imagen(ident)
            if ruta:
                self._archivo(ruta)
            else:
                self._json({"error": "Imagen no disponible"}, 404)
            return

        self._json({"error": "Ruta desconocida"}, 404)

    def do_POST(self) -> None:  # noqa: N802
        camino = unquote(urlparse(self.path).path)
        datos = self._cuerpo()

        try:
            if camino == "/api/generar":
                reg = generador.generar_propuesta(
                    proyecto=datos.get("proyecto") or None
                )
                self._json({"ok": True, "publicacion": reg})
                return

            if camino == "/api/aprobar":
                reg = generador.aprobar(datos.get("id", ""))
                self._json({
                    "ok": bool(reg),
                    "publicacion": reg,
                    "mensaje": (
                        "Propuesta APROBADA y guardada. No se publico nada en "
                        "Instagram ni Facebook: la publicacion automatica esta "
                        "desactivada."
                    ),
                })
                return

            if camino == "/api/rechazar":
                reg = generador.rechazar(
                    datos.get("id", ""), datos.get("motivo", "")
                )
                self._json({"ok": bool(reg), "publicacion": reg})
                return

            if camino == "/api/programar":
                reg = programacion.programar(
                    datos.get("id", ""),
                    datos.get("fecha", ""),
                    datos.get("hora", "18:30"),
                )
                self._json({
                    "ok": True,
                    "publicacion": reg,
                    "mensaje": (
                        "Programada para: "
                        + programacion.formato_humano(reg.get("programado_para"))
                        + ". No se publicara sola: llegada la hora solo quedara"
                        " marcada como lista para publicar."
                    ),
                })
                return

            if camino == "/api/cancelar-programacion":
                reg = programacion.cancelar_programacion(datos.get("id", ""))
                self._json({
                    "ok": True,
                    "publicacion": reg,
                    "mensaje": "Programacion cancelada. La propuesta sigue aprobada.",
                })
                return

            if camino == "/api/otra":
                reg = generador.generar_otra(datos.get("id", ""))
                self._json({"ok": True, "publicacion": reg})
                return

            if camino == "/api/texto":
                reg = generador.regenerar_texto(datos.get("id", ""))
                self._json({"ok": bool(reg), "publicacion": reg})
                return

            if camino == "/api/escanear":
                inv = inventario.escanear()
                perfiles_mod.construir_perfiles()
                self._json({"ok": True, "total": inv.get("total_archivos", 0)})
                return

        except generador.SinContenido as exc:
            self._json({"ok": False, "error": str(exc)}, 409)
            return
        except (programacion.ErrorProgramacion, historial.TransicionInvalida, ValueError) as exc:
            self._json({"ok": False, "error": str(exc)}, 409)
            return
        except Exception as exc:  # pragma: no cover
            self._json({"ok": False, "error": str(exc)}, 500)
            return

        self._json({"error": "Ruta desconocida"}, 404)


def _puerto_libre(host: str, preferido: int, intentos: int = 20) -> int:
    for puerto in range(preferido, preferido + intentos):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind((host, puerto))
                return puerto
            except OSError:
                continue
    raise OSError(f"No hay puertos libres desde {preferido}.")


def iniciar(
    puerto: int | None = None,
    host: str | None = None,
    abrir_navegador: bool = True,
) -> None:
    cfg = cfg_mod.cargar()
    host = host or cfg.get("host_panel", "127.0.0.1")
    puerto = _puerto_libre(host, int(puerto or cfg.get("puerto_panel", 8787)))

    servidor = ThreadingHTTPServer((host, puerto), Manejador)
    url = f"http://{host}:{puerto}"

    print("=" * 62)
    print("  CYMARQ SOCIAL - Panel local")
    print("=" * 62)
    print(f"  URL        : {url}")
    print("  Publicacion automatica: DESACTIVADA")
    print("  Scheduler  : OPERATIVO - MODO SIMULACION (detecta, no publica)")
    print("  PROYECTOS  : solo lectura")
    print("  Detener    : Ctrl + C en esta ventana")
    print("=" * 62)

    if abrir_navegador:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n  Panel detenido. No se publico nada.")
    finally:
        servidor.server_close()
