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

# Claves que el sistema fuerza mientras estemos en fase de desarrollo.
# La publicacion se lanza a mano por el puente; nada aqui la automatiza.
_BLOQUEADAS_EN_FASE_1 = {"publicacion_automatica": False}


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
