#!/usr/bin/env python3
"""CYMARQ SOCIAL - linea de comandos.

Uso rapido:
    python cymarq.py escanear      Inventaria PROYECTOS (solo lectura)
    python cymarq.py generar       Crea una propuesta en PENDIENTES
    python cymarq.py panel         Abre el panel local en el navegador
    python cymarq.py estado        Resumen del sistema

Este programa NO publica en Instagram ni en Facebook.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

try:  # consola de Windows con acentos
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:  # pragma: no cover
    pass

from cymarq_social import (  # noqa: E402
    catalogo_social,
    config as cfg_mod,
    generador,
    historial,
    inventario,
    panel,
    perfiles,
    puente_node,
    rotacion,
    rutas,
)

LINEA = "=" * 66


def cmd_escanear(args: argparse.Namespace) -> int:
    print(LINEA)
    print("  Escaneando PROYECTOS (modo solo lectura)")
    print(LINEA)
    inv = inventario.escanear(verbose=args.detalle)
    fichas = perfiles.construir_perfiles(forzar=args.forzar)

    r = inv["resumen"]
    print(f"\n  Archivos registrados : {inv['total_archivos']}")
    print(f"  Publicables          : {r['publicables']}")
    print(f"  Proyectos con ficha  : {len(fichas)}")
    print("\n  Por tipo:")
    for tipo, n in r["por_tipo"].items():
        print(f"    {tipo:<24} {n}")
    print("\n  Por estado:")
    for estado, n in r["por_estado"].items():
        print(f"    {estado:<24} {n}")
    print(f"\n  Inventario -> {rutas.ruta_relativa(rutas.ARCHIVO_INVENTARIO)}")
    print(f"  Perfiles   -> {rutas.ruta_relativa(rutas.ARCHIVO_PERFILES)}")
    print("\n  Ningun archivo original fue modificado.")
    return 0


def cmd_generar(args: argparse.Namespace) -> int:
    try:
        reg = generador.generar_propuesta(
            proyecto=args.proyecto,
            plataformas=args.plataforma or None,
            variante=args.variante,
        )
    except generador.SinContenido as exc:
        print(f"  [!] {exc}")
        return 1

    print(LINEA)
    print(f"  PROPUESTA {reg['id']} generada")
    print(LINEA)
    print(f"  Proyecto : {reg['proyecto_nombre']}")
    print(f"  Imagen   : {reg['archivo']}")
    print(f"  Original : {reg['ruta_original']}  (intacto)")
    print(f"  Carpeta  : {reg['carpeta_pendiente']}")
    print(f"  Fecha    : {reg['fecha']} {reg['hora_propuesta']}")
    print(f"  Rotacion : {reg['rotacion'].get('regla')}")
    print("\n" + "-" * 66)
    print(reg["texto"]["instagram"])
    print("-" * 66)
    print("\n  No se publico nada. Revisa la propuesta en el panel local.")
    return 0


def cmd_listar(args: argparse.Namespace) -> int:
    pubs = historial.listar(args.estado)
    if not pubs:
        print("  Sin publicaciones registradas.")
        return 0
    print(f"  {'ID':<14} {'FECHA':<12} {'ESTADO':<12} PROYECTO / ARCHIVO")
    print("  " + "-" * 64)
    for p in pubs:
        print(f"  {p['id']:<14} {p.get('fecha',''):<12} "
              f"{p.get('estado',''):<12} {p.get('proyecto_nombre','')} "
              f"/ {p.get('archivo','')}")
    return 0


def cmd_aprobar(args: argparse.Namespace) -> int:
    reg = generador.aprobar(args.id)
    if not reg:
        print(f"  [!] No existe la publicacion {args.id}")
        return 1
    print(f"  {reg['id']} marcada como APROBADA.")
    print("  Recordatorio: esto NO publica en Instagram ni Facebook.")
    return 0


def cmd_rechazar(args: argparse.Namespace) -> int:
    reg = generador.rechazar(args.id, args.motivo)
    if not reg:
        print(f"  [!] No existe la publicacion {args.id}")
        return 1
    print(f"  {reg['id']} rechazada y archivada en PENDIENTES/_descartadas.")
    return 0


def cmd_estado(args: argparse.Namespace) -> int:
    cfg = cfg_mod.cargar()
    inv = inventario.cargar()
    pubs = historial.cargar()["publicaciones"]
    r = inv.get("resumen", {})

    print(LINEA)
    print("  CYMARQ SOCIAL - estado del sistema")
    print(LINEA)
    print(f"  Raiz              : {rutas.RAIZ}")
    print(f"  Archivos            : {inv.get('total_archivos', 0)}")
    print(f"  Publicables         : {r.get('publicables', 0)}")
    print(f"  Publicaciones       : {len(pubs)}")
    for estado in historial.ESTADOS:
        n = sum(1 for p in pubs if p.get("estado") == estado)
        if n:
            print(f"    - {estado:<16} {n}")
    print(f"  Proxima fecha       : "
          f"{rotacion.proxima_fecha(cfg).strftime('%Y-%m-%d %H:%M')}")
    print(f"  modo_aprobacion     : {cfg.get('modo_aprobacion')}")
    print(f"  publicacion_automatica: {cfg.get('publicacion_automatica')}")
    print(f"  Panel               : http://{cfg.get('host_panel')}:"
          f"{cfg.get('puerto_panel')}")
    return 0


def cmd_panel(args: argparse.Namespace) -> int:
    panel.iniciar(puerto=args.puerto, abrir_navegador=not args.sin_navegador)
    return 0


def cmd_catalogo(args: argparse.Namespace) -> int:
    """Prepara el catalogo de imagenes publicas. No publica ni hace commit."""
    print(LINEA)
    print("  Catalogo social publico")
    print(LINEA)
    print("  INVENTARIO LOCAL (PROYECTOS/) es privado y no entra aqui.")
    print("  Solo se incorpora material ya seleccionado para publicaciones.")
    print()

    res = catalogo_social.resumen()
    print(f"  Carpeta destino    {res['carpeta']}")
    print(f"  Base publica       {res['base_url']}")
    print(f"  Autorizadas        {res['autorizadas']}")
    print(f"  En el manifiesto   {res['en_manifiesto']}")
    print(f"  Archivos en disco  {res['archivos_en_disco']}")
    if res["sin_registrar"]:
        print(f"  [!] En disco sin registrar: {', '.join(res['sin_registrar'])}")
    if res["registradas_sin_archivo"]:
        print(f"  [!] Registradas sin archivo: {', '.join(res['registradas_sin_archivo'])}")
    print()

    if args.listar:
        for id_archivo, info in res["imagenes"].items():
            print(f"  {id_archivo}  {info['nombre']}")
            print(f"      {info['url']}")
            print(f"      {info['proyecto']} / {info['archivo_origen']} "
                  f"({info['ancho']}x{info['alto']}, {info['peso'] // 1024} KB)")
        return 0

    if args.adoptar:
        id_archivo, _, nombre = args.adoptar.partition("=")
        if not id_archivo or not nombre:
            print("  [!] Usa --adoptar <id_archivo>=<nombre.jpg>")
            return 1
        r = catalogo_social.adoptar_existente(id_archivo.strip(), nombre.strip())
        print(f"  [{r.accion.upper()}] {r.nombre}")
        if r.url:
            print(f"      {r.url}  ({r.ancho}x{r.alto}, {r.peso // 1024} KB)")
        print(f"      {r.detalle}")
        return 0 if r.ok else 1

    resultados = catalogo_social.preparar_catalogo(forzar=args.forzar, simular=args.simular)
    if not resultados:
        print("  No hay ninguna imagen autorizada todavia.")
        return 0

    print(LINEA)
    for r in resultados:
        print(f"  [{r.accion.upper():<11}] {r.id_publicacion}  {r.nombre or '(sin nombre)'}")
        if r.ancho:
            print(f"                {r.ancho}x{r.alto} px, {r.peso // 1024} KB")
        if r.url:
            print(f"                {r.url}")
        if r.detalle:
            print(f"                {r.detalle}")
        for aviso in r.avisos:
            print(f"                [!] {aviso}")
    print(LINEA)

    fallos = [r for r in resultados if not r.ok]
    print(f"  {len(resultados) - len(fallos)}/{len(resultados)} imagenes listas.")
    if args.simular:
        print("  SIMULACION: no se escribio ningun archivo ni el manifiesto.")
    else:
        print("  Los originales de PROYECTOS no se han modificado.")
        print("  No se ha hecho commit ni push: eso es un paso aparte y supervisado.")
    return 1 if fallos else 0


def cmd_puente(args: argparse.Namespace) -> int:
    """Ensayo del puente Python -> Node. NO publica: solo lanza los dry-run."""
    print(LINEA)
    print("  Puente CYMARQ SOCIAL -> publicadores Node (modo seguro)")
    print(LINEA)

    diag = puente_node.diagnostico()
    print(f"  Repositorio Node   {diag['repo_web']}")
    print(f"  Existe             {diag['repo_web_existe']}")
    print(f"  node               {diag['node']}")
    print(f"  .env.local         {'presente' if diag['env_local_presente'] else 'AUSENTE'}")
    print(f"  Modo               {diag['modo']}")
    faltan = [k for k, v in diag["scripts"].items() if not v]
    print(f"  Scripts            {len(diag['scripts']) - len(faltan)}/{len(diag['scripts'])} presentes")
    if faltan:
        print(f"  [!] Faltan: {', '.join(faltan)}")
        return 1
    print()

    if args.solo_diagnostico:
        print("  Solo diagnostico. No se ejecuto ningun script.")
        return 0

    registro = historial.buscar(args.id)
    if not registro:
        print(f"  [!] No existe la publicacion {args.id}")
        return 1

    try:
        trabajo = puente_node.preparar(registro, url_imagen=args.url_imagen)
    except puente_node.PuenteError as exc:
        print(f"  [!] {exc}")
        return 1

    print(f"  Propuesta          {trabajo.id}  ({registro.get('estado')})")
    print(f"  Proyecto           {trabajo.proyecto}")
    print(f"  metadata.json      {rutas.ruta_relativa(trabajo.metadata)}")
    print(f"  URL imagen         {trabajo.url_imagen}")
    print(f"  Plataformas        {', '.join(trabajo.plataformas)}")
    for aviso in trabajo.avisos:
        print(f"  [!] {aviso}")
    print(f"\n  Argumentos para Node: {' '.join(trabajo.argumentos())}")

    resultados = puente_node.ensayo(trabajo, tuple(args.plataforma) if args.plataforma else None)

    fallos = 0
    for plataforma, res in resultados.items():
        print()
        print(LINEA)
        print(f"  {plataforma.upper()} - dry-run")
        print(LINEA)
        if not res.ejecutado:
            print(f"  [!] No se ejecuto: {res.motivo}")
            fallos += 1
            continue
        if args.detalle:
            print(res.salida.rstrip())
        else:
            for linea in res.salida.splitlines():
                if any(m in linea for m in ("ESTADO:", "USERNAME", "PÁGINA  ", "PÁGINA      ",
                                            "CARACTERES", "URL PÚBLICA", "ID PROPUESTA",
                                            "JOB ", "[OK", "[FALLO", "AVISO")):
                    print(f"  {linea.strip()}")
        if res.errores.strip():
            print(f"  stderr: {res.errores.strip()[:300]}")
        print(f"  codigo de salida: {res.codigo_salida}")
        if not res.ok:
            fallos += 1

    print()
    print(LINEA)
    print("  Ningun script de publicacion fue invocado. No se escribio en Meta.")
    print(LINEA)
    return 1 if fallos else 0


def construir_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="cymarq",
        description="CYMARQ SOCIAL - preparacion local de contenido para redes.",
    )
    sub = p.add_subparsers(dest="comando", required=True)

    s = sub.add_parser("escanear", help="Inventaria PROYECTOS (solo lectura)")
    s.add_argument("--detalle", action="store_true", help="Lista archivo por archivo")
    s.add_argument("--forzar", action="store_true",
                   help="Regenera fichas incluso las editadas a mano")
    s.set_defaults(func=cmd_escanear)

    s = sub.add_parser("generar", help="Genera una propuesta en PENDIENTES")
    s.add_argument("--proyecto", help="Carpeta exacta del proyecto a usar")
    s.add_argument("--plataforma", action="append",
                   choices=["instagram", "facebook"])
    s.add_argument("--variante", type=int, default=0,
                   help="Variante de redaccion (0,1,2...)")
    s.set_defaults(func=cmd_generar)

    s = sub.add_parser("listar", help="Lista el historial de publicaciones")
    s.add_argument("--estado", choices=list(historial.ESTADOS))
    s.set_defaults(func=cmd_listar)

    s = sub.add_parser("aprobar", help="Marca una propuesta como aprobada")
    s.add_argument("id")
    s.set_defaults(func=cmd_aprobar)

    s = sub.add_parser("rechazar", help="Rechaza y archiva una propuesta")
    s.add_argument("id")
    s.add_argument("--motivo", default="")
    s.set_defaults(func=cmd_rechazar)

    s = sub.add_parser("estado", help="Resumen del sistema")
    s.set_defaults(func=cmd_estado)

    s = sub.add_parser("panel", help="Inicia el panel local")
    s.add_argument("--puerto", type=int)
    s.add_argument("--sin-navegador", action="store_true")
    s.set_defaults(func=cmd_panel)

    s = sub.add_parser("catalogo", help="Prepara el catalogo de imagenes publicas")
    s.add_argument("--simular", action="store_true", help="No escribe nada")
    s.add_argument("--forzar", action="store_true", help="Regenera aunque ya exista")
    s.add_argument("--listar", action="store_true", help="Solo lista el catalogo actual")
    s.add_argument("--adoptar", metavar="ID=NOMBRE.jpg",
                   help="Registra un derivado ya existente en public/social/")
    s.set_defaults(func=cmd_catalogo)

    s = sub.add_parser("puente", help="Ensayo del puente hacia los publicadores Node")
    s.add_argument("id", nargs="?", default="", help="ID de la propuesta")
    s.add_argument("--url-imagen", help="URL publica HTTPS del derivado JPEG")
    s.add_argument("--plataforma", action="append", choices=["instagram", "facebook"])
    s.add_argument("--detalle", action="store_true", help="Muestra la salida completa de Node")
    s.add_argument("--solo-diagnostico", action="store_true",
                   help="Solo comprueba la configuracion, no lanza nada")
    s.set_defaults(func=cmd_puente)

    return p


def main(argv: list[str] | None = None) -> int:
    rutas.asegurar_estructura()
    args = construir_parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
