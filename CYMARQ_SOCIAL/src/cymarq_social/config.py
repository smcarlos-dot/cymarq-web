"""Configuracion editable del sistema (CONFIG/config.json)."""

from __future__ import annotations

from typing import Any

from . import rutas, seguridad

CONFIG_POR_DEFECTO: dict[str, Any] = {
    # --- Identidad de marca ---
    "nombre_empresa": "CYMARQ",
    "eslogan": "Arquitectura - Diseño - Construccion",
    "sitio_web": "",
    "instagram": "https://www.instagram.com/cymarq_obras/",
    "instagram_usuario": "@cymarq_obras",
    "facebook": "https://www.facebook.com/cymarq.obras",
    "whatsapp": "+57 322 3656579",
    "correo": "contacto@cymarq.com.co",
    "ubicacion": "Colombia",

    # --- Programacion de publicaciones ---
    "frecuencia_publicacion": "semanal",
    "publicaciones_por_semana": 2,
    "dias_publicacion": ["martes", "jueves"],
    "hora_publicacion": "18:30",

    # --- Contenido ---
    "numero_hashtags": 18,
    "numero_hashtags_facebook": 6,
    "plataformas": ["instagram", "facebook"],
    "usar_renders": True,
    "usar_planos": False,
    "usar_videos": False,
    "usar_fotografias": True,
    "incluir_marca_agua": False,

    # --- Rotacion de proyectos ---
    "rotacion_activa": True,
    "proyectos_a_esperar_antes_de_repetir": 4,
    "dias_minimos_entre_publicaciones_mismo_proyecto": 14,
    "no_repetir_imagen": True,

    # --- Seguridad / control ---
    "modo_aprobacion": True,
    "publicacion_automatica": False,

    # --- Panel local ---
    "puerto_panel": 8787,
    "host_panel": "127.0.0.1",
}

# Claves que el sistema fuerza pase lo que pase en el fichero.
#
# `publicacion_automatica` estuvo aqui, forzada a false, durante todo el
# desarrollo: era la garantia de que nada podia publicar mientras se construia
# el sistema. Ya no: el interruptor pasa a mandarlo el fichero, porque la
# produccion desatendida es justamente lo que se ha puesto en marcha.
#
# Lo que protege ahora contra una publicacion accidental no es este candado,
# sino las barreras del motor: entorno de produccion, autorizacion individual
# para las express, preflight, lock y antiduplicacion.
_BLOQUEADAS: dict[str, Any] = {}
_BLOQUEADAS_EN_FASE_1 = _BLOQUEADAS  # nombre antiguo, se conserva por compatibilidad


def cargar() -> dict[str, Any]:
    """Carga config.json completando claves faltantes con los valores por defecto."""
    datos = seguridad.leer_json(rutas.ARCHIVO_CONFIG, por_defecto=None)

    if datos is None:
        datos = dict(CONFIG_POR_DEFECTO)
        guardar(datos)
        return datos

    fusionado = _fusionar(CONFIG_POR_DEFECTO, datos)
    fusionado.update(_BLOQUEADAS_EN_FASE_1)
    return fusionado


def guardar(datos: dict[str, Any]) -> None:
    datos = dict(datos)
    datos.update(_BLOQUEADAS_EN_FASE_1)
    seguridad.escribir_json(rutas.ARCHIVO_CONFIG, datos)


def _fusionar(base: dict[str, Any], encima: dict[str, Any]) -> dict[str, Any]:
    salida = dict(base)
    for clave, valor in encima.items():
        if isinstance(valor, dict) and isinstance(salida.get(clave), dict):
            salida[clave] = _fusionar(salida[clave], valor)
        else:
            salida[clave] = valor
    return salida
