"""Puente PC -> VM: exportar contenido nuevo e importarlo sin pisar producción.

El PC crea contenido. La VM manda sobre el estado operativo. Copiar el
historial de una máquina a otra destruiría ese reparto, así que aquí no se
copia nada: se EXPORTA una publicación concreta y se IMPORTA fusionándola con
lo que la VM ya tiene.

    exportar(ID)   -> paquete .zip autocontenido
    importar(zip)  -> valida todo, hace copia de seguridad, importa, verifica

LO QUE UN PAQUETE NO PUEDE TOCAR, NUNCA
---------------------------------------
Diarios antiduplicados, locks, autorizaciones, credenciales, config y las
publicaciones ya publicadas. Un paquete solo puede AÑADIR una entrada nueva al
historial, registrar su imagen en el manifiesto y dejar su carpeta en
PENDIENTES. Cualquier otra cosa se rechaza antes de escribir.

TRANSACCIONAL
-------------
Validar todo -> respaldo -> importar -> verificar -> confirmar. Si algo falla en
cualquier punto, se restaura el respaldo y la VM queda exactamente como estaba.
Media importación es peor que ninguna.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import zipfile
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from . import catalogo_social, historial, programacion, rutas, seguridad

VERSION_PAQUETE = 1

#: Lo que un paquete jamas puede contener ni modificar. Se comprueba por nombre
#: para que un paquete manipulado no pueda colar un fichero de estado.
PROHIBIDO = (
    "historial_publicaciones.json",
    "inventario_contenido.json",
    "imagenes_publicas.json",
    "perfiles_proyectos.json",
    "autorizaciones.json",
    "entorno.json",
    "config.json",
    ".env",
    ".env.local",
    "publish-state",
    "locks",
)


class ErrorTransferencia(RuntimeError):
    """El paquete no se puede crear o no se puede importar."""


def _sha256(datos: bytes) -> str:
    return hashlib.sha256(datos).hexdigest()


# --------------------------------------------------------------------- #
# Exportacion                                                            #
# --------------------------------------------------------------------- #

#: Campos del historial que viajan. Los de estado operativo se quedan en casa.
CAMPOS = (
    "id", "express", "fecha_creacion", "fecha", "hora_propuesta",
    "proyecto", "proyecto_nombre", "archivo", "ruta_original", "id_archivo",
    "plataforma", "titulo", "ambiente", "texto", "hashtags",
    "hashtags_facebook", "llamada_a_la_accion", "variante_texto",
    "formato_imagen", "dimensiones", "notas", "rotacion",
    "programado_para", "zona_horaria",
)


def exportar(job_id: str, destino: Path | str | None = None) -> Path:
    """Crea un paquete .zip con todo lo necesario para incorporar una publicacion.

    Incluye la ficha, la entrada del manifiesto de la imagen publica y una copia
    de la imagen. NO incluye ningun dato de estado operativo.
    """
    reg = historial.buscar(job_id)
    if reg is None:
        raise ErrorTransferencia(f"No existe la publicacion {job_id}.")
    if reg.get("estado") == "publicada":
        raise ErrorTransferencia(
            f"{job_id} ya esta publicada: no tiene sentido enviarla a produccion."
        )

    id_archivo = reg.get("id_archivo") or ""
    entrada = catalogo_social.cargar_manifiesto().get("imagenes", {}).get(id_archivo)
    if not entrada:
        raise ErrorTransferencia(
            f"{job_id} no tiene imagen preparada en el catalogo publico. "
            "Ejecuta 'catalogo' antes de exportar."
        )

    copia = rutas.RAIZ / (reg.get("copia_local") or "")
    if not copia.is_file():
        raise ErrorTransferencia(f"No se encuentra la copia de la imagen: {copia}")

    publicacion = {c: reg[c] for c in CAMPOS if c in reg}
    # El estado viaja siempre normalizado: quien decide el estado operativo es
    # la VM, no el paquete.
    publicacion["estado"] = "programada" if reg.get("programado_para") else "propuesta"

    bytes_imagen = copia.read_bytes()
    paquete = {
        "version": VERSION_PAQUETE,
        "creado_en": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "tipo": "EXPRESS" if reg.get("express") else "PROGRAMADA",
        "publicacion": publicacion,
        "imagen_publica": {
            "id_archivo": id_archivo,
            "nombre": entrada["nombre"],
            "url": entrada["url"],
            "ancho": entrada.get("ancho"),
            "alto": entrada.get("alto"),
            "peso": entrada.get("peso"),
        },
        "imagen_origen": {
            "nombre": copia.name,
            "sha256": _sha256(bytes_imagen),
            "bytes": len(bytes_imagen),
        },
    }
    paquete["checksum"] = _sha256(
        json.dumps(paquete, sort_keys=True, ensure_ascii=False).encode("utf-8"))

    if destino is None:
        rutas.CONFIG.mkdir(parents=True, exist_ok=True)
        carpeta = rutas.RAIZ / "PAQUETES"
        carpeta.mkdir(parents=True, exist_ok=True)
        destino = carpeta / f"{job_id}.cymarq.zip"
    destino = Path(destino)
    destino.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("paquete.json", json.dumps(paquete, ensure_ascii=False, indent=2))
        z.writestr(f"imagen/{copia.name}", bytes_imagen)

    return destino


# --------------------------------------------------------------------- #
# Validacion                                                             #
# --------------------------------------------------------------------- #


@dataclass
class Validacion:
    ok: bool = True
    problemas: list[str] = field(default_factory=list)
    avisos: list[str] = field(default_factory=list)
    paquete: dict[str, Any] | None = None

    def fallar(self, motivo: str) -> None:
        self.ok = False
        self.problemas.append(motivo)


def _nombre_seguro(nombre: str) -> bool:
    """Rechaza rutas absolutas, escapes con .. y nombres de estado operativo."""
    if nombre.startswith(("/", "\\")) or ":" in nombre:
        return False
    partes = Path(nombre).parts
    if any(p == ".." for p in partes):
        return False
    if any(p.lower() in {x.lower() for x in PROHIBIDO} for p in partes):
        return False
    return any(nombre == "paquete.json" or nombre.startswith("imagen/") for _ in (0,))


def validar(ruta_zip: Path | str) -> Validacion:
    """Comprueba TODO antes de tocar nada. No escribe."""
    v = Validacion()
    ruta_zip = Path(ruta_zip)

    if not ruta_zip.is_file():
        v.fallar(f"no existe el paquete: {ruta_zip}")
        return v

    try:
        with zipfile.ZipFile(ruta_zip) as z:
            nombres = z.namelist()

            # 10. Path traversal y ficheros que no deberian estar.
            for n in nombres:
                if not _nombre_seguro(n):
                    v.fallar(f"entrada no permitida en el paquete: {n!r}")
            if "paquete.json" not in nombres:
                v.fallar("el paquete no contiene paquete.json")
            if v.problemas:
                return v

            datos = json.loads(z.read("paquete.json").decode("utf-8"))
            imagenes = [n for n in nombres if n.startswith("imagen/")]
            bytes_imagen = z.read(imagenes[0]) if imagenes else b""
    except (zipfile.BadZipFile, json.JSONDecodeError, KeyError) as exc:
        v.fallar(f"paquete ilegible: {exc}")
        return v

    v.paquete = datos

    # 3. Integridad.
    if datos.get("version") != VERSION_PAQUETE:
        v.fallar(f"version de paquete no soportada: {datos.get('version')}")
    copia = dict(datos)
    esperado = copia.pop("checksum", None)
    calculado = _sha256(json.dumps(copia, sort_keys=True, ensure_ascii=False).encode("utf-8"))
    if esperado != calculado:
        v.fallar("el checksum del paquete no cuadra: puede estar manipulado o corrupto")

    pub = datos.get("publicacion") or {}
    job_id = pub.get("id")
    if not job_id:
        v.fallar("el paquete no trae identificador de publicacion")
        return v

    # 1. ID no existente.
    if historial.buscar(job_id) is not None:
        v.fallar(f"{job_id} ya existe en el historial de esta maquina: no se sobrescribe")

    # 2. Imagen valida.
    origen = datos.get("imagen_origen") or {}
    if not bytes_imagen:
        v.fallar("el paquete no incluye la imagen")
    elif _sha256(bytes_imagen) != origen.get("sha256"):
        v.fallar("la imagen del paquete no coincide con su huella")

    publica = datos.get("imagen_publica") or {}
    if not publica.get("url") or not publica.get("nombre"):
        v.fallar("el paquete no trae la imagen publica registrada")
    if publica.get("id_archivo") != pub.get("id_archivo"):
        v.fallar("el id_archivo del manifiesto no coincide con el de la publicacion")

    # 4 y 6. Colisiones y calendario.
    cuando = pub.get("programado_para")
    if cuando:
        ocupadas = {
            p["programado_para"] for p in historial.cargar()["publicaciones"]
            if p.get("programado_para") and p.get("estado") not in ("rechazada", "cancelada")
        }
        if cuando in ocupadas:
            v.fallar(
                f"la franja {programacion.formato_humano(cuando)} ya esta ocupada: "
                "importar movería el calendario existente"
            )

    # 5. Publicadas intocables: se comprueba que el paquete no reutilice una
    #    imagen ya publicada, que es la unica via por la que podria afectarlas.
    ya_publicadas = {
        p.get("id_archivo") for p in historial.cargar()["publicaciones"]
        if p.get("estado") == "publicada"
    }
    if pub.get("id_archivo") in ya_publicadas:
        v.avisos.append(
            "la imagen de este paquete ya se publico en otra ocasion; "
            "se importa igual, pero saldra contenido visualmente repetido"
        )

    if not (pub.get("texto") or {}).get("instagram"):
        v.fallar("sin caption de Instagram")
    if not (pub.get("texto") or {}).get("facebook"):
        v.fallar("sin caption de Facebook")

    return v


# --------------------------------------------------------------------- #
# Importacion transaccional                                              #
# --------------------------------------------------------------------- #


@dataclass
class Importacion:
    ok: bool = False
    job_id: str = ""
    tipo: str = ""
    mensaje: str = ""
    problemas: list[str] = field(default_factory=list)
    avisos: list[str] = field(default_factory=list)
    respaldo: str = ""
    detalle: dict[str, Any] = field(default_factory=dict)


def importar(ruta_zip: Path | str, simular: bool = False) -> Importacion:
    """Incorpora un paquete al estado de esta maquina. Transaccional.

    Solo AÑADE: una entrada de historial, una entrada de manifiesto y una
    carpeta en PENDIENTES. No toca diarios, locks, autorizaciones, credenciales
    ni ninguna publicacion existente.
    """
    ruta_zip = Path(ruta_zip)
    v = validar(ruta_zip)
    imp = Importacion(problemas=list(v.problemas), avisos=list(v.avisos))

    if not v.ok or v.paquete is None:
        imp.mensaje = "El paquete no supera la validacion. No se ha tocado nada."
        return imp

    pub = dict(v.paquete["publicacion"])
    publica = v.paquete["imagen_publica"]
    imp.job_id = pub["id"]
    imp.tipo = v.paquete.get("tipo", "PROGRAMADA")

    if simular:
        imp.ok = True
        imp.mensaje = "SIMULACION: el paquete es valido y se podria importar."
        imp.detalle = {"id": imp.job_id, "tipo": imp.tipo,
                       "programado_para": pub.get("programado_para"),
                       "url": publica["url"]}
        return imp

    # --- Respaldo de lo unico que se va a modificar ---
    sello = programacion.ahora().strftime("%Y%m%d-%H%M%S")
    carpeta_resp = rutas.CONFIG / "respaldos-importacion" / f"{imp.job_id}-{sello}"
    carpeta_resp.mkdir(parents=True, exist_ok=True)
    respaldos: list[tuple[Path, Path]] = []
    for original in (rutas.ARCHIVO_HISTORIAL, catalogo_social.ARCHIVO_MANIFIESTO):
        if original.is_file():
            copia = carpeta_resp / original.name
            shutil.copy2(original, copia)
            respaldos.append((original, copia))
    imp.respaldo = str(carpeta_resp)

    carpeta_destino: Path | None = None
    try:
        # --- 1. Carpeta y metadata en PENDIENTES ---
        base = rutas.PENDIENTES / (
            f"{(pub.get('programado_para') or pub.get('fecha') or 'sin-fecha')[:10]}"
            f"_{'EXPRESS_' if v.paquete.get('tipo') == 'EXPRESS' else ''}{imp.job_id}")
        carpeta_destino = base
        n = 2
        while carpeta_destino.exists():
            carpeta_destino = base.with_name(f"{base.name}_{n}")
            n += 1
        seguridad.verificar_destino(carpeta_destino)
        (carpeta_destino / "imagen").mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(ruta_zip) as z:
            nombre_img = next(n for n in z.namelist() if n.startswith("imagen/"))
            # Se reconstruye el nombre: nunca se usa la ruta del zip tal cual.
            destino_img = carpeta_destino / "imagen" / Path(nombre_img).name
            destino_img.write_bytes(z.read(nombre_img))

        pub["copia_local"] = rutas.ruta_relativa(destino_img)
        pub["carpeta_pendiente"] = rutas.ruta_relativa(carpeta_destino)
        pub["importado_en"] = programacion.guardar_iso(programacion.ahora())
        pub["importado_desde"] = ruta_zip.name
        pub.setdefault("fecha_publicacion", None)
        pub.setdefault("url_publicacion", {"instagram": None, "facebook": None})
        pub.setdefault("id_publicacion_meta", {"instagram": None, "facebook": None})
        pub.setdefault("publicado_por_sistema", False)

        seguridad.escribir_json(carpeta_destino / "metadata.json", pub)

        # --- 2. Historial: se AÑADE, nunca se reescribe lo existente ---
        datos = historial.cargar()
        antes = len(datos["publicaciones"])
        datos["publicaciones"].append(pub)
        historial.guardar(datos)

        # --- 3. Manifiesto de imagenes publicas ---
        manifiesto = catalogo_social.cargar_manifiesto()
        manifiesto["imagenes"][publica["id_archivo"]] = {
            "nombre": publica["nombre"], "url": publica["url"],
            "id_publicacion": imp.job_id,
            "proyecto": pub.get("proyecto_nombre", ""),
            "archivo_origen": pub.get("archivo", ""),
            "ruta_original": pub.get("ruta_original", ""),
            "ancho": publica.get("ancho"), "alto": publica.get("alto"),
            "peso": publica.get("peso"),
            "importada": True,
        }
        catalogo_social.guardar_manifiesto(manifiesto)

        # --- 4. Verificacion posterior ---
        comprobado = historial.buscar(imp.job_id)
        despues = len(historial.cargar()["publicaciones"])
        if comprobado is None:
            raise ErrorTransferencia("tras importar, la publicacion no aparece en el historial")
        if despues != antes + 1:
            raise ErrorTransferencia(
                f"el historial paso de {antes} a {despues} entradas: se esperaba una mas")
        if catalogo_social.url_publica(publica["id_archivo"]) != publica["url"]:
            raise ErrorTransferencia("la imagen no quedo registrada en el manifiesto")
        if not (rutas.RAIZ / comprobado["copia_local"]).is_file():
            raise ErrorTransferencia("la imagen no quedo en PENDIENTES")

        imp.ok = True
        imp.mensaje = f"{imp.job_id} importada correctamente."
        imp.detalle = {
            "estado": comprobado["estado"],
            "programado_para": comprobado.get("programado_para"),
            "carpeta": comprobado["carpeta_pendiente"],
            "url": publica["url"],
            "historial": f"{antes} -> {despues}",
        }
        return imp

    except Exception as exc:
        # --- ROLLBACK ---
        for original, copia in respaldos:
            shutil.copy2(copia, original)
        if carpeta_destino is not None and carpeta_destino.exists():
            shutil.rmtree(carpeta_destino, ignore_errors=True)
        imp.ok = False
        imp.problemas.append(f"fallo durante la importacion: {exc}")
        imp.mensaje = (
            "ROLLBACK aplicado: historial y manifiesto restaurados desde el "
            f"respaldo {carpeta_resp}. La maquina esta como antes."
        )
        return imp


def estado_operativo_intacto() -> dict[str, Any]:
    """Huellas de lo que una importacion NUNCA debe tocar.

    Se toma antes y despues de importar para demostrar que no cambio.
    """
    repo = catalogo_social.repo_web()
    huellas: dict[str, Any] = {}
    for etiqueta, ruta in (
        ("diario_instagram", repo / ".instagram-publish-state.json"),
        ("diario_facebook", repo / ".facebook-publish-state.json"),
        ("autorizaciones", rutas.CONFIG / "autorizaciones.json"),
        ("config", rutas.ARCHIVO_CONFIG),
        ("entorno", rutas.CONFIG / "entorno.json"),
        ("credenciales", repo / ".env.local"),
    ):
        huellas[etiqueta] = _sha256(ruta.read_bytes()) if ruta.is_file() else None
    locks = rutas.CONFIG / "locks"
    huellas["locks"] = sorted(p.name for p in locks.glob("*.lock")) if locks.is_dir() else []
    return huellas
