"""Limites de texto de Instagram y Facebook, para avisar ANTES de aprobar.

Esto NO es un cliente de Meta ni publica nada. Es solo una comprobacion local
que el panel usa para avisar de que un texto se pasaria de largo, mientras aun
se puede corregir.

La publicacion tiene una unica ruta y no pasa por aqui:

    CYMARQ_SOCIAL (Python) -> puente_node.py -> publicadores Node -> Meta

Los publicadores Node vuelven a validar estos mismos limites justo antes de
enviar nada, asi que este modulo es una comodidad para el panel, no la
garantia. La garantia esta en Node, pegada a la llamada real.
"""

from __future__ import annotations

import re

#: Limites oficiales de Instagram para el caption de una publicacion.
INSTAGRAM = {
    "caracteres": 2200,
    "hashtags": 30,
    "menciones": 20,
}

#: Facebook solo limita la longitud del mensaje.
FACEBOOK = {
    "caracteres": 63206,
}

_HASHTAG = re.compile(r"(?<![^\W_])#[^\W_][\w]*", re.UNICODE)
_MENCION = re.compile(r"(?<![\w.])@[\w.]+", re.UNICODE)


def contar(texto: str) -> dict[str, int]:
    """Recuentos de un texto. Los caracteres se cuentan por puntos de codigo,
    igual que hace la app: una tilde o un emoji valen uno."""
    texto = texto or ""
    return {
        "caracteres": len(list(texto)),
        "hashtags": len(_HASHTAG.findall(texto)),
        "menciones": len(_MENCION.findall(texto)),
    }


def avisos_instagram(texto: str, hashtags: list[str] | None = None) -> list[str]:
    datos = contar(texto)
    n_hashtags = max(datos["hashtags"], len(hashtags or []))
    avisos: list[str] = []
    if datos["caracteres"] > INSTAGRAM["caracteres"]:
        avisos.append(
            f"Instagram: {datos['caracteres']} caracteres, el limite es "
            f"{INSTAGRAM['caracteres']}."
        )
    if n_hashtags > INSTAGRAM["hashtags"]:
        avisos.append(f"Instagram: {n_hashtags} hashtags, el maximo es {INSTAGRAM['hashtags']}.")
    if datos["menciones"] > INSTAGRAM["menciones"]:
        avisos.append(
            f"Instagram: {datos['menciones']} menciones, el maximo es {INSTAGRAM['menciones']}."
        )
    return avisos


def avisos_facebook(texto: str, hashtags: list[str] | None = None) -> list[str]:
    datos = contar(texto)
    if datos["caracteres"] > FACEBOOK["caracteres"]:
        return [
            f"Facebook: {datos['caracteres']} caracteres, el limite es "
            f"{FACEBOOK['caracteres']}."
        ]
    return []
