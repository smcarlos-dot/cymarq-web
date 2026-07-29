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
import json
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
    ejecutor,
    generador,
    historial,
    inventario,
    panel,
    perfiles,
    programacion,
    puente_node,
    rotacion,
    salud as salud_mod,
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


def cmd_generar_banco(args: argparse.Namespace) -> int:
    """Genera propuestas hasta agotar el inventario publicable. No publica."""
    print(LINEA)
    print("  CYMARQ SOCIAL — banco de publicaciones")
    print(LINEA)
    print("  Usa el generador de siempre, en bucle. No cambia las reglas de")
    print("  redaccion ni toca los originales de PROYECTOS.")
    print()

    antes = {p["id"] for p in historial.listar()}

    def avance(reg):
        print(f"    {reg['id']}  {reg['proyecto_nombre'][:34]:<34} {reg['archivo'][:26]}")

    print("  Generando:")
    resultado = generador.generar_banco(maximo=args.maximo, avance=avance)
    creadas = resultado["creadas"]
    if not creadas:
        print("    (ninguna)")
    print()

    pubs = historial.listar()
    por_estado: dict[str, int] = {}
    for p in pubs:
        por_estado[p["estado"]] = por_estado.get(p["estado"], 0) + 1

    print(LINEA)
    print(f"  Nuevas publicaciones generadas : {len(creadas)}")
    print(f"  Ya almacenadas/reservadas      : {len(antes)}")
    print(f"  Disponibles sin preparar       : {resultado['restantes']}")
    print(f"  Total del banco                : {len(pubs)}")
    print(f"  Motivo de parada               : {resultado['motivo_fin']}")
    print()
    print("  Por estado:")
    for estado, n in sorted(por_estado.items()):
        print(f"    {estado:<22} {n}")
    print(LINEA)
    print("  Nada se ha publicado en Meta. Las nuevas quedan como 'propuesta',")
    print("  sin fecha: el calendario se asigna en otra fase.")
    print(LINEA)
    return 0


def cmd_programar(args: argparse.Namespace) -> int:
    """Fija la fecha y hora de una propuesta aprobada. No publica."""
    try:
        if args.cancelar:
            reg = programacion.cancelar_programacion(args.id)
            print(f"  Programacion cancelada. {reg['id']} vuelve a '{reg['estado']}'.")
            return 0
        reg = programacion.programar(args.id, args.fecha, args.hora)
    except (programacion.ErrorProgramacion, historial.TransicionInvalida, ValueError) as exc:
        print(f"  [!] {exc}")
        return 1

    print(LINEA)
    print(f"  {reg['id']} — {reg.get('proyecto_nombre', '')}")
    print(LINEA)
    print(f"  Estado             {reg['estado']}")
    print(f"  Programada para    {programacion.formato_humano(reg.get('programado_para'))}")
    print(f"  Zona horaria       {programacion.NOMBRE_ZONA}")
    print(f"  Guardado como      {reg.get('programado_para')}")
    if reg.get("programacion_anterior"):
        print(f"  Programacion previa {reg['programacion_anterior']}")
    print()
    print("  No se ha publicado nada. Llegada la hora, el scheduler solo la")
    print("  marcara como lista_para_publicar.")
    return 0


def _pinta_chequeo(c, sangria="    "):
    marca = {"OK": "OK   ", "ADVERTENCIA": "AVISO", "ERROR": "ERROR"}.get(c["estado"], "?")
    print(f"{sangria}[{marca}] {c['nombre']:<24} {c['mensaje']}")


def cmd_salud(args: argparse.Namespace) -> int:
    """Comprueba credenciales y sistema. No publica ni escribe nada."""
    inf = salud_mod.salud(con_meta=not args.sin_meta)

    if args.json:
        print(json.dumps(inf, ensure_ascii=False, indent=2))
        return 0 if inf["general"] != salud_mod.ERROR else 1

    print(LINEA)
    print("  CYMARQ SOCIAL — salud del sistema")
    print(LINEA)
    print(f"  Comprobado : {programacion.formato_humano(inf['comprobado_en'])}")
    print()
    print("  SISTEMA")
    for c in inf["sistema"]:
        _pinta_chequeo(c)
    print()
    meta = inf["meta"]
    for nombre, d in (meta.get("plataformas") or {}).items():
        print(f"  {nombre.upper()}  ->  {d.get('estado')}")
        for clave in ("credencial", "token", "cuenta", "identidad", "pagina",
                      "publicada", "permisos", "cuota"):
            c = d.get(clave)
            if not c:
                continue
            _pinta_chequeo({"nombre": clave, "estado": c["estado"], "mensaje": c["mensaje"]})
            if clave == "token":
                if c.get("expiracion_determinable"):
                    print(f"           caduca el {c.get('expira_en')}"
                          f"  ({c.get('dias_restantes')} dias)")
                else:
                    print("           fecha de expiracion: no determinable de forma fiable")
        if d.get("error"):
            print(f"    [ERROR] {d['error']}")
        print()
    if meta.get("error"):
        print(f"  [ERROR] {meta['error']}")
        print()
    print("  GATE")
    _pinta_chequeo(inf["gate"])
    print()
    print(LINEA)
    print(f"  SALUD GENERAL: {inf['general']}")
    if not inf["publicacion_segura"]:
        print("  PUBLICACION AUTOMATICA NO SEGURA")
    print(LINEA)
    return 0 if inf["general"] != salud_mod.ERROR else 1


def cmd_preflight(args: argparse.Namespace) -> int:
    """Comprueba si un job concreto podria publicarse. No publica."""
    inf = salud_mod.preflight(args.id, con_meta=not args.sin_meta,
                              con_red=not args.sin_red)
    if args.json:
        print(json.dumps(inf, ensure_ascii=False, indent=2))
        return 0 if inf.get("general") == salud_mod.OK else 1

    print(LINEA)
    print(f"  PREFLIGHT {inf['job']}  {inf.get('proyecto','')}")
    print(LINEA)
    for c in inf["chequeos"]:
        _pinta_chequeo(c, "  ")
    print()
    print(LINEA)
    print(f"  RESULTADO: {inf['resultado']}")
    if inf["razones"]:
        print("  Motivos:")
        for r in inf["razones"]:
            print(f"    · {r}")
    print("  No se ha publicado nada ni se ha cambiado ningun estado.")
    print(LINEA)
    return 0 if inf.get("general") == salud_mod.OK else 1


def cmd_autorizar(args: argparse.Namespace) -> int:
    """Autoriza o revoca la publicacion real de UNA propuesta concreta."""
    if args.limpiar:
        n = ejecutor.limpiar_autorizaciones()
        print(f"  Autorizaciones eliminadas: {n}")
        print("  PUBLICACIONES REALES AUTORIZADAS: NINGUNA")
        return 0
    if not args.id:
        vigentes = ejecutor.jobs_autorizados()
        print("  PUBLICACIONES REALES AUTORIZADAS: "
              + (", ".join(vigentes) if vigentes else "NINGUNA"))
        return 0
    reg = historial.buscar(args.id)
    if not reg:
        print(f"  [!] No existe la publicacion {args.id}")
        return 1
    d = ejecutor.autorizar_job(args.id, minutos=args.minutos, nota=args.nota)
    print(f"  AUTORIZADA: {args.id}  ({reg.get('proyecto_nombre','')})")
    print(f"    caduca en : {programacion.formato_humano(d['expira_en'])}")
    print(f"    vigentes  : {', '.join(ejecutor.jobs_autorizados())}")
    print("  Ninguna otra propuesta puede publicarse, aunque este lista.")
    return 0


def cmd_ejecutar_programadas(args: argparse.Namespace) -> int:
    """Motor de ejecucion. En esta fase NO publica: el gate esta cerrado."""
    try:
        momento = programacion.parsear(args.ahora) if args.ahora else None
        simular = ejecutor.parsear_escenarios(args.simular) if args.simular else None
    except ValueError as exc:
        print(f"  [!] {exc}")
        return 1

    motor = ejecutor.estado_motor()

    print(LINEA)
    print("  CYMARQ SOCIAL — motor de ejecucion")
    print(LINEA)
    print(f"  PUBLICACION AUTOMATICA : {motor['publicacion_automatica']}")
    print(f"  MOTOR                  : {motor['motor']}")
    print(f"  MODO                   : {motor['modo']}")
    if simular is not None:
        print(f"  Escenarios simulados   : "
              + ', '.join(f'{k}={v}' for k, v in sorted(simular.items())))
        print("                           (no se invoca a Node ni a Meta)")
    print()

    r = ejecutor.ejecutar_programadas(momento=momento, simular=simular, solo=args.solo)

    print(f"  Hora de referencia : {programacion.formato_humano(r['momento'])}"
          + ("   [SIMULADA]" if r["simulado_reloj"] else ""))
    print(f"  Listas para publicar: {len(r['listas'])}   |   Futuras: {r['futuras']}")
    print()

    if not r["ejecuciones"]:
        print("  Nada que ejecutar en este momento.")
    for e in r["ejecuciones"]:
        print(LINEA)
        print(f"  {e.job_id}  {e.proyecto}")
        if e.omitida:
            print(f"    OMITIDA: {e.omitida}")
            continue
        for p, d in sorted(e.plataformas.items()):
            linea = f"    {p:<10} {d.get('estado','?'):<22}"
            if d.get("id"):
                linea += f" id={d['id']}"
            if d.get("permalink"):
                linea += f" {d['permalink']}"
            print(linea)
            if d.get("error"):
                print(f"               error: {str(d['error'])[:100]}")
        print(f"    global     {e.global_antes} -> {e.global_despues}")
        for a in e.acciones:
            print(f"    · {a}")
        for p in e.problemas:
            print(f"    [!] validacion: {p}")
        if e.bloqueada_por_gate:
            print("    PUBLICACION REAL: BLOQUEADA POR CONFIGURACION")

    print(LINEA)
    # El mensaje debe reflejar lo que REALMENTE paso. Decir "0 POST" cuando una
    # autorizacion puntual acaba de publicar de verdad seria mentir en el sitio
    # donde mas importa la exactitud.
    publicadas = sum(
        1 for e in r["ejecuciones"] for d in e.plataformas.values()
        if d.get("estado") == "publicada" and (d.get("ultimo_intento") or "")
    )
    if simular is not None:
        print("  Resultados SIMULADOS. 0 POST a Meta.")
    elif any(e.bloqueada_por_gate for e in r["ejecuciones"]) or not r["ejecuciones"]:
        print("  No se ha invocado a ningun publicador. 0 POST a Meta.")
    else:
        print(f"  Se invocaron publicadores REALES. Plataformas publicadas: {publicadas}.")
        print("  Autorizaciones vigentes: "
              + (", ".join(ejecutor.jobs_autorizados()) or "NINGUNA"))
    print(LINEA)
    return 0


def cmd_calendarizar_banco(args: argparse.Namespace) -> int:
    """Asigna martes y viernes 18:30 a todo el banco apto. No publica."""
    print(LINEA)
    print("  CYMARQ SOCIAL — calendarizar el banco")
    print(LINEA)
    print(f"  Franjas   : martes y viernes a las 18:30 ({programacion.NOMBRE_ZONA})")
    print(f"  Modo      : {'SIMULACION (no escribe)' if args.simular else 'asignacion real de fechas'}")
    print("  Calendarizar solo asigna fechas: no toca imagenes ni textos.")
    print()

    r = programacion.calendarizar_banco(simular=args.simular)

    if r["asignadas"]:
        print("  NUEVAS PROGRAMACIONES")
        for a in r["asignadas"]:
            print(f"    {a['id']}  {programacion.formato_humano(a['cuando'])}"
                  f"  {a['proyecto'][:34]}")
        print()

    if r["ya_programadas"]:
        print("  YA PROGRAMADAS (no se tocan)")
        for a in r["ya_programadas"]:
            print(f"    {a['id']}  {programacion.formato_humano(a['programado_para'])}"
                  f"  {a['proyecto'][:34]}")
        print()

    if r["excluidas"]:
        print("  EXCLUIDAS")
        for a in r["excluidas"]:
            print(f"    {a['id']}  {a['motivo']:<34} {a['proyecto'][:28]}")
        print()

    print(LINEA)
    print(f"  Nuevas programaciones : {len(r['asignadas'])}")
    print(f"  Ya programadas        : {len(r['ya_programadas'])}")
    print(f"  Excluidas/no aptas    : {len(r['excluidas'])}")
    if r["asignadas"]:
        print(f"  Primera franja nueva  : {programacion.formato_humano(r['asignadas'][0]['cuando'])}")
        print(f"  Ultima franja         : {programacion.formato_humano(r['asignadas'][-1]['cuando'])}")
    print(LINEA)
    print("  Nada se ha publicado en Meta.")
    print(LINEA)
    return 0


def cmd_programadas(args: argparse.Namespace) -> int:
    """Scheduler. SOLO DETECTA: nunca publica ni llama a Meta."""
    try:
        momento = programacion.parsear(args.ahora) if args.ahora else None
    except ValueError as exc:
        print(f"  [!] {exc}")
        return 1

    inf = programacion.revisar(momento=momento, aplicar=not args.solo_ver)

    print(LINEA)
    print("  CYMARQ SOCIAL — publicaciones programadas")
    print(LINEA)
    cfg = cfg_mod.cargar()
    print(f"  PUBLICACION AUTOMATICA : {'ACTIVADA' if cfg.get('publicacion_automatica') else 'DESACTIVADA'}")
    print(f"  Scheduler              : OPERATIVO — MODO SIMULACION")
    print(f"  Hora actual            : {programacion.formato_humano(inf.momento)}"
          + ("   [HORA SIMULADA]" if inf.simulado else ""))
    if args.solo_ver:
        print("  Modo                   : solo lectura (--solo-ver), sin transiciones")
    print()

    if inf.futuras:
        print("  PROGRAMADAS (aun no les toca)")
        for e in inf.futuras:
            print(f"    {e.id}  {e.proyecto}")
            print(f"      Programada: {e.texto_programada}")
            print(f"      Estado: PROGRAMADA")
        print()

    if inf.listas:
        print("  LISTAS PARA PUBLICAR")
        for e in inf.listas:
            print(f"    {e.id}  {e.proyecto}")
            print(f"      Programada: {e.texto_programada}")
            print(f"      Hora actual: {programacion.formato_humano(inf.momento)}")
            print(f"      Estado: LISTA PARA PUBLICAR")
            if e.transicion:
                print(f"      (transicion aplicada ahora; retraso {e.minutos_retraso} min)")
            else:
                print(f"      (ya estaba lista; sin cambios)")
        print()

    if inf.sin_hora:
        print("  PROGRAMADAS SIN HORA (revisar a mano)")
        for e in inf.sin_hora:
            print(f"    {e.id}  {e.proyecto}")
        print()

    if not (inf.futuras or inf.listas or inf.sin_hora):
        print("  No hay ninguna publicacion programada.")
        print()

    print(LINEA)
    print(f"  Programadas {len(inf.futuras)} | Listas {len(inf.listas)} | "
          f"Transiciones en este pase {len(inf.transiciones)} | Ignoradas {inf.ignoradas}")
    print("  MODO SIMULACION — NO SE ENVIO NADA A META")
    print(LINEA)
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

    s = sub.add_parser("generar-banco",
                       help="Genera propuestas hasta agotar el material publicable")
    s.add_argument("--maximo", type=int, default=None,
                   help="Tope de propuestas a crear en esta pasada")
    s.set_defaults(func=cmd_generar_banco)

    s = sub.add_parser("programar", help="Fija fecha y hora de una propuesta aprobada")
    s.add_argument("id")
    s.add_argument("--fecha", default="", help="AAAA-MM-DD (hora de Colombia)")
    s.add_argument("--hora", default="18:30", help="HH:MM (hora de Colombia)")
    s.add_argument("--cancelar", action="store_true",
                   help="Quita la programacion y vuelve a 'aprobada'")
    s.set_defaults(func=cmd_programar)

    s = sub.add_parser("salud", help="Comprueba credenciales y sistema. No publica.")
    s.add_argument("--json", action="store_true", help="Salida estructurada")
    s.add_argument("--sin-meta", action="store_true", help="Solo comprobaciones locales")
    s.set_defaults(func=cmd_salud)

    s = sub.add_parser("preflight", help="Comprueba si un job podria publicarse. No publica.")
    s.add_argument("id")
    s.add_argument("--json", action="store_true")
    s.add_argument("--sin-meta", action="store_true", help="No consulta credenciales")
    s.add_argument("--sin-red", action="store_true", help="No comprueba la URL de la imagen")
    s.set_defaults(func=cmd_preflight)

    s = sub.add_parser("autorizar",
                       help="Autoriza la publicacion real de UNA propuesta concreta")
    s.add_argument("id", nargs="?", default="", help="ID a autorizar; sin ID, lista las vigentes")
    s.add_argument("--minutos", type=int, default=30, help="Caducidad de la autorizacion")
    s.add_argument("--nota", default="")
    s.add_argument("--limpiar", action="store_true", help="Revoca todas las autorizaciones")
    s.set_defaults(func=cmd_autorizar)

    s = sub.add_parser("ejecutar-programadas",
                       help="Motor de ejecucion. No publica: el gate esta cerrado.")
    s.add_argument("--ahora", default="", help="Hora simulada, solo para pruebas")
    s.add_argument("--simular", default="",
                   help="Escenarios por plataforma, p. ej. 'instagram=ok,facebook=fallo'. "
                        f"Resultados: {', '.join(ejecutor.ESCENARIOS)}")
    s.add_argument("--solo", default=None, help="Procesar solo este ID")
    s.set_defaults(func=cmd_ejecutar_programadas)

    s = sub.add_parser("calendarizar-banco",
                       help="Asigna martes y viernes 18:30 a todo el banco apto")
    s.add_argument("--simular", action="store_true",
                   help="Muestra el calendario que asignaria, sin escribir")
    s.set_defaults(func=cmd_calendarizar_banco)

    s = sub.add_parser("programadas",
                       help="Scheduler: detecta que toca publicar. NO publica.")
    s.add_argument("--ahora", default="",
                   help="Hora simulada SOLO para pruebas, p. ej. '2026-07-30 18:31'. "
                        "No altera el reloj del sistema ni habilita publicar.")
    s.add_argument("--solo-ver", action="store_true",
                   help="No aplica ninguna transicion, solo informa")
    s.set_defaults(func=cmd_programadas)

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
