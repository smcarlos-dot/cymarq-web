"""Prepara material de PUBLICAR/ como historias 9:16 con la marca de CYMARQ.

QUE HACE, EN ORDEN
------------------
    origen (video o imagen, cualquier proporcion)
      -> recorte antimarca        quita la esquina donde firman los generadores de IA
      -> encaje 9:16              a pantalla completa si ya es vertical;
                                  fondo desenfocado del propio material si no
      -> sonda de luminosidad     mide la franja donde ira el logo
      -> capa de marca            logo blanco sobre fondo oscuro, logo negro
                                  sobre fondo claro
      -> MP4 1080x1920            listo para publicar como historia

POR QUE VIVE AQUI Y NO EN `src/`
--------------------------------
Necesita ffmpeg, y en la VM no hay ffmpeg ni se quiere anadir. Esto es
herramienta de PC: prepara el material, y lo que viaja a produccion es el MP4 ya
terminado. La VM no marca nada, solo publica lo que recibe.

NO PUBLICA NADA. NO TOCA LOS ORIGINALES.

    python herramientas/marca_estados.py --salida ../PUBLICAR/_MARCADOS
    python herramientas/marca_estados.py --solo "Render Cocina.mp4" --salida /tmp
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# .../CYMARQ WEB/09 WEB/CYMARQ_SOCIAL/herramientas/este archivo
RAIZ = Path(__file__).resolve().parents[3]          # ...\CYMARQ WEB
PUBLICAR = RAIZ / "PUBLICAR"
LOGOS = RAIZ / "01 LOGO"

ANCHO, ALTO = 1080, 1920

ORO = (214, 163, 0, 255)
ORO_PROFUNDO = (150, 112, 0, 255)   # el mismo dorado, legible sobre blanco
BLANCO = (255, 255, 255, 255)
TINTA = (17, 17, 17, 255)

CUENTA = "@cymarq.obras"

#: Extensiones que se admiten como origen.
VIDEOS = {".mp4", ".mov"}
IMAGENES = {".png", ".jpg", ".jpeg", ".webp"}

#: Material que NO entra. Unico descarte: la version apaisada del video del
#: logo, que es la misma animacion que ya existe nativa en 9:16.
EXCLUIDOS = {"VIDEO LOGO CYMARQ.mp4"}

#: Duracion del clip que se genera a partir de una imagen fija.
SEGUNDOS_IMAGEN = 6

#: Cuanto se recorta del borde derecho e inferior antes de encajar.
#:
#: Los generadores de video por IA (Veo, en este material) estampan su firma en
#: la esquina inferior derecha. Un 6% la elimina sin que la composicion se
#: resienta, y se aplica a todo por igual para no tener que ir marcando a mano
#: que archivo lleva firma y cual no.
RECORTE_ANTIMARCA = 0.06

#: Umbral de luminosidad (0-255) por debajo del cual la franja se considera
#: oscura y toca el logo blanco.
UMBRAL_OSCURO = 118


class ErrorMarca(RuntimeError):
    """No se pudo preparar la pieza."""


def _exe(nombre: str) -> str:
    ruta = shutil.which(nombre)
    if not ruta:
        raise ErrorMarca(f"No se encontro '{nombre}' en el PATH. Hace falta ffmpeg.")
    return ruta


def _correr(orden: list[str]) -> None:
    proceso = subprocess.run(orden, capture_output=True, text=True,
                             encoding="utf-8", errors="replace")
    if proceso.returncode != 0:
        cola = (proceso.stderr or "").strip().splitlines()[-6:]
        raise ErrorMarca("ffmpeg fallo:\n  " + "\n  ".join(cola))


# --------------------------------------------------------------------- #
# Lectura del origen                                                     #
# --------------------------------------------------------------------- #


@dataclass
class Origen:
    ruta: Path
    ancho: int
    alto: int
    duracion: float
    es_video: bool
    tiene_audio: bool

    @property
    def vertical(self) -> bool:
        """¿Ya es 9:16 (o muy cerca)? Entonces llena la pantalla sin fondo."""
        return abs(self.ancho / self.alto - 9 / 16) < 0.03


def leer_origen(ruta: Path) -> Origen:
    salida = subprocess.run(
        [_exe("ffprobe"), "-v", "error", "-print_format", "json",
         "-show_streams", "-show_format", str(ruta)],
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    if salida.returncode != 0:
        raise ErrorMarca(f"ffprobe no pudo leer {ruta.name}")
    datos = json.loads(salida.stdout)

    video = next((s for s in datos["streams"] if s.get("codec_type") == "video"), None)
    if video is None:
        raise ErrorMarca(f"{ruta.name} no tiene pista de video ni es una imagen valida")
    audio = any(s.get("codec_type") == "audio" for s in datos["streams"])

    es_video = ruta.suffix.lower() in VIDEOS
    duracion = float(datos.get("format", {}).get("duration") or 0) if es_video else SEGUNDOS_IMAGEN

    return Origen(ruta=ruta, ancho=int(video["width"]), alto=int(video["height"]),
                  duracion=duracion, es_video=es_video, tiene_audio=audio)


# --------------------------------------------------------------------- #
# Encaje 9:16                                                            #
# --------------------------------------------------------------------- #


def _filtro_encaje(o: Origen, con_zoom: bool) -> str:
    """Cadena de filtros que deja el contenido en un lienzo de 1080x1920.

    `con_zoom` anade un acercamiento muy lento; se usa solo con imagenes fijas,
    donde el movimiento es lo que separa una historia de una diapositiva.
    """
    # Recorte antimarca: se queda con la parte superior izquierda.
    r = 1 - RECORTE_ANTIMARCA
    recorte = f"crop=iw*{r}:ih*{r}:0:0"

    if o.vertical:
        # Ya es 9:16: se amplia hasta llenar y se recorta lo que sobre.
        base = (f"{recorte},scale={ANCHO}:{ALTO}:force_original_aspect_ratio=increase,"
                f"crop={ANCHO}:{ALTO},setsar=1")
        if not con_zoom:
            return f"[0:v]{base}[v]"
        return (f"[0:v]{recorte},scale={ANCHO*2}:-2,"
                f"zoompan=z='min(zoom+0.00035,1.12)':d={SEGUNDOS_IMAGEN*30}:"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={ANCHO}x{ALTO}:fps=30,"
                f"setsar=1[v]")

    # No es 9:16: fondo desenfocado del propio material y contenido centrado.
    # Recortar una fachada al 9:16 se comeria mas de la mitad de la imagen.
    fondo = (f"[0:v]{recorte},scale={ANCHO}:{ALTO}:force_original_aspect_ratio=increase,"
             f"crop={ANCHO}:{ALTO},gblur=sigma=34[bg]")
    if con_zoom:
        frente = (f"[0:v]{recorte},scale={ANCHO*2}:-2,"
                  f"zoompan=z='min(zoom+0.00035,1.12)':d={SEGUNDOS_IMAGEN*30}:"
                  f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                  f"s={ANCHO}x{round(ANCHO*o.alto/o.ancho/2)*2}:fps=30[fg]")
    else:
        frente = f"[0:v]{recorte},scale={ANCHO}:-2[fg]"
    return f"{fondo};{frente};[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]"


def _base_sin_marca(o: Origen, destino: Path) -> None:
    """Genera el lienzo 9:16 SIN la marca. Sirve para sondear la luminosidad."""
    con_zoom = not o.es_video
    filtro = _filtro_encaje(o, con_zoom)

    orden = [_exe("ffmpeg"), "-y", "-v", "error"]
    if not o.es_video:
        orden += ["-loop", "1", "-t", str(SEGUNDOS_IMAGEN)]
    orden += ["-i", str(o.ruta), "-filter_complex", filtro, "-map", "[v]",
              "-frames:v", "1", "-q:v", "2", str(destino)]
    _correr(orden)


def luminancia_banda(imagen: Path) -> float:
    """Luminosidad media de la franja donde se posa la marca.

    Se mide solo esa franja, no la imagen entera: lo que importa es si el logo
    va a quedar legible ahi, no si la foto es clara o no en conjunto.
    """
    with Image.open(imagen) as im:
        banda = im.convert("L").crop((0, 1380, ANCHO, 1700))
        pixeles = list(banda.getdata())
    return sum(pixeles) / len(pixeles)


# --------------------------------------------------------------------- #
# Capa de marca                                                          #
# --------------------------------------------------------------------- #

ALTO_LOGO = 158        # el usuario lo queria algo mas grande que los 132 iniciales
MARGEN_X = 84
BASE_Y = 1580


def capa_marca(sobre_oscuro: bool, destino: Path) -> None:
    """Dibuja el PNG transparente con el velo, el logo y la llamada a seguir.

    Dos versiones completas, no solo dos logos: sobre un fondo claro no vale
    con cambiar el logo a negro, tambien hay que cambiar el velo a blanco y el
    texto a tinta. Si no, el logo negro caeria sobre un degradado oscuro.
    """
    capa = Image.new("RGBA", (ANCHO, ALTO), (0, 0, 0, 0))

    # Velo inferior: da contraste sin tapar el contenido.
    #
    # El perfil NO es una rampa suave hasta abajo. Con una rampa, justo donde se
    # posa el texto (1440-1520) el velo apenas lleva un cuarto de su fuerza, y
    # el dorado sobre una fachada clara deja de leerse. Asi que sube deprisa
    # hasta la franja del texto y a partir de ahi se mantiene.
    velo_rgb = (0, 0, 0) if sobre_oscuro else (255, 255, 255)
    opacidad_max = 212 if sobre_oscuro else 228
    Y_INICIO, Y_MESETA = 1120, 1420
    NIVEL_MESETA = 0.74

    grad = Image.new("L", (1, ALTO), 0)
    for y in range(ALTO):
        if y < Y_INICIO:
            v = 0.0
        elif y < Y_MESETA:
            t = (y - Y_INICIO) / (Y_MESETA - Y_INICIO)
            v = NIVEL_MESETA * (t ** 1.35)
        else:
            t = (y - Y_MESETA) / (ALTO - Y_MESETA)
            v = NIVEL_MESETA + (1.0 - NIVEL_MESETA) * t
        grad.putpixel((0, y), int(opacidad_max * v))
    velo = Image.new("RGBA", (ANCHO, ALTO), velo_rgb + (255,))
    velo.putalpha(grad.resize((ANCHO, ALTO)))
    capa = Image.alpha_composite(capa, velo)

    d = ImageDraw.Draw(capa)

    archivo_logo = "Logo blanco.png" if sobre_oscuro else "logo negro.png"
    logo = Image.open(LOGOS / archivo_logo).convert("RGBA")
    ancho_logo = round(logo.width * ALTO_LOGO / logo.height)
    logo = logo.resize((ancho_logo, ALTO_LOGO), Image.LANCZOS)
    capa.paste(logo, (MARGEN_X, BASE_Y - ALTO_LOGO), logo)

    # El dorado de la web brilla sobre negro, pero sobre blanco pierde
    # contraste. Sobre fondo claro se usa una version mas profunda del mismo
    # color, no otro color.
    color_texto = BLANCO if sobre_oscuro else TINTA
    color_lema = ORO if sobre_oscuro else ORO_PROFUNDO
    x = MARGEN_X + ancho_logo + 40

    f_peq = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 32)
    f_gr = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 58)

    # Separacion entre letras a mano: PIL no la trae.
    cursor = x
    for ch in "SÍGUENOS EN":
        d.text((cursor, BASE_Y - 142), ch, font=f_peq, fill=color_lema)
        cursor += d.textlength(ch, font=f_peq) + 5

    d.text((x, BASE_Y - 92), CUENTA, font=f_gr, fill=color_texto)
    d.rectangle([MARGEN_X, BASE_Y + 28, MARGEN_X + 158, BASE_Y + 34], fill=color_lema)

    capa.save(destino)


# --------------------------------------------------------------------- #
# Pieza completa                                                         #
# --------------------------------------------------------------------- #


def nombre_destino(ruta: Path, todas: list[Path]) -> str:
    """Nombre del MP4 resultante, sin colisiones.

    En PUBLICAR/ conviven `FACHADA.jpeg` y `FACHADA.webp`, que son fotos
    DISTINTAS. Nombrar por el tronco a secas hacia que la segunda pisara a la
    primera en silencio y se perdiera una pieza. Cuando dos origenes comparten
    tronco, se les anade su extension.
    """
    mismo_tronco = [p for p in todas if p.stem == ruta.stem]
    if len(mismo_tronco) > 1:
        return f"{ruta.stem}-{ruta.suffix.lstrip('.').lower()}.mp4"
    return f"{ruta.stem}.mp4"


def preparar(ruta: Path, carpeta_salida: Path, temp: Path,
             todas: list[Path] | None = None) -> dict:
    """Deja el MP4 marcado en `carpeta_salida`. Devuelve el resumen."""
    o = leer_origen(ruta)

    sonda = temp / "sonda.jpg"
    _base_sin_marca(o, sonda)
    luz = luminancia_banda(sonda)
    sobre_oscuro = luz < UMBRAL_OSCURO

    capa = temp / "capa.png"
    capa_marca(sobre_oscuro, capa)

    destino = carpeta_salida / nombre_destino(ruta, todas if todas is not None else material())
    filtro = _filtro_encaje(o, con_zoom=not o.es_video)

    orden = [_exe("ffmpeg"), "-y", "-v", "error"]
    if not o.es_video:
        orden += ["-loop", "1", "-t", str(SEGUNDOS_IMAGEN)]
    orden += ["-i", str(ruta), "-i", str(capa)]
    # Una historia sin audio rinde peor, y una imagen no lo trae: se le pone
    # una pista silenciosa para que todas las piezas salgan iguales.
    if not o.tiene_audio:
        orden += ["-f", "lavfi", "-t", str(max(o.duracion, SEGUNDOS_IMAGEN)),
                  "-i", "anullsrc=r=44100:cl=stereo"]

    orden += ["-filter_complex", f"{filtro};[v][1:v]overlay=0:0[o]", "-map", "[o]"]
    orden += ["-map", "2:a"] if not o.tiene_audio else ["-map", "0:a"]
    orden += ["-c:v", "libx264", "-preset", "medium", "-crf", "24",
              "-maxrate", "4M", "-bufsize", "8M", "-pix_fmt", "yuv420p",
              "-c:a", "aac", "-b:a", "128k", "-shortest",
              "-movflags", "+faststart", str(destino)]
    _correr(orden)

    return {
        "archivo": ruta.name,
        "salida": destino.name,
        "origen": f"{o.ancho}x{o.alto}",
        "encaje": "pantalla completa" if o.vertical else "fondo desenfocado",
        "tipo": "video" if o.es_video else "imagen",
        "luz": round(luz, 1),
        "logo": "blanco" if sobre_oscuro else "negro",
        "peso": destino.stat().st_size,
        "duracion": round(o.duracion, 1),
    }


def material() -> list[Path]:
    """Todo lo publicable de PUBLICAR/, en orden estable."""
    admitidas = VIDEOS | IMAGENES
    return sorted(
        p for p in PUBLICAR.iterdir()
        if p.is_file() and p.suffix.lower() in admitidas and p.name not in EXCLUIDOS
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--salida", required=True, help="Carpeta donde dejar los MP4 marcados")
    ap.add_argument("--solo", action="append", help="Prepara solo estos archivos (por nombre)")
    ap.add_argument("--listar", action="store_true", help="Solo enumera el material")
    args = ap.parse_args()

    piezas = material()
    if args.solo:
        piezas = [p for p in piezas if p.name in set(args.solo)]

    if args.listar:
        for p in piezas:
            o = leer_origen(p)
            print(f"  {o.ancho}x{o.alto}  {o.duracion:5.1f}s  "
                  f"{'vertical' if o.vertical else 'apaisado'}  {p.name}")
        print(f"\n  {len(piezas)} piezas")
        return 0

    salida = Path(args.salida).expanduser().resolve()
    salida.mkdir(parents=True, exist_ok=True)
    temp = salida / "_temp"
    temp.mkdir(exist_ok=True)

    resumenes = []
    for i, p in enumerate(piezas, 1):
        try:
            r = preparar(p, salida, temp, todas=material())
        except ErrorMarca as exc:
            print(f"  [{i:2}/{len(piezas)}] FALLO  {p.name}\n           {exc}")
            continue
        resumenes.append(r)
        print(f"  [{i:2}/{len(piezas)}] {r['logo']:<6} {r['encaje']:<18} "
              f"{r['peso']/1048576:5.1f} MB  {r['salida']}")

    shutil.rmtree(temp, ignore_errors=True)
    total = sum(r["peso"] for r in resumenes)
    print(f"\n  {len(resumenes)} piezas · {total/1048576:.1f} MB en total")
    (salida / "resumen.json").write_text(
        json.dumps(resumenes, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0 if len(resumenes) == len(piezas) else 1


if __name__ == "__main__":
    sys.exit(main())
