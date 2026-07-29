/* CYMARQ SOCIAL - panel local.
   Solo lee y escribe en el sistema local. No habla con ninguna red social. */

const $ = (id) => document.getElementById(id);
let ESTADO = null;
let TRABAJANDO = false;

/* ---------------------------------------------------------------- red */

async function api(ruta, cuerpo) {
  const opciones = cuerpo
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo) }
    : {};
  const r = await fetch(ruta, opciones);
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
  return datos;
}

function aviso(texto, tipo = 'ok') {
  const el = $('aviso');
  el.textContent = texto;
  el.className = `aviso ${tipo}`;
  clearTimeout(aviso._t);
  aviso._t = setTimeout(() => el.classList.add('oculto'), 9000);
}

function bloquear(v) {
  TRABAJANDO = v;
  document.querySelectorAll('.acciones .btn, #btn-escanear, #btn-generar-vacio')
    .forEach((b) => (b.disabled = v));
}

/* ------------------------------------------------------------ pintado */

async function cargar() {
  try {
    ESTADO = await api('/api/estado');
    pintar();
  } catch (e) {
    aviso('No se pudo leer el estado: ' + e.message, 'error');
  }
}

function pintar() {
  pintarSeguridad();
  pintarPropuesta();
  pintarProyectos();
  pintarContenido();
  pintarListas();
  pintarHistorial();
  $('pie-proxima').textContent =
    'Próxima publicación sugerida: ' + (ESTADO.proxima_fecha || '—');
}

function pintarSeguridad() {
  const s = ESTADO.seguridad;
  $('txt-seguridad').textContent = s.publicacion_automatica
    ? 'ATENCIÓN: publicación automática activada'
    : 'Publicación automática desactivada · nada se envía a Meta';
}

function pintarPropuesta() {
  const p = ESTADO.propuesta_actual;
  const vacia = $('propuesta-vacia');
  const caja = $('propuesta');

  if (!p) {
    vacia.classList.remove('oculto');
    caja.classList.add('oculto');
    return;
  }
  vacia.classList.add('oculto');
  caja.classList.remove('oculto');

  $('img-propuesta').src = `/imagen/${encodeURIComponent(p.id)}?t=${Date.now()}`;
  $('img-nombre').textContent = p.archivo || '—';
  $('img-ruta').textContent = p.ruta_original || '—';
  const d = p.dimensiones || {};
  $('img-formato').textContent =
    `${d.ancho || '?'} × ${d.alto || '?'} px · ${p.formato_imagen || '—'}`;

  $('etq-id').textContent = p.id;
  $('etq-estado').textContent = p.estado;
  $('etq-estado').className =
    'etiqueta' + (p.estado === 'aprobada' ? ' verde' : '');
  $('etq-fecha').textContent = `${p.fecha} · ${p.hora_propuesta}`;

  $('proyecto-linea').textContent =
    `${p.proyecto}  ·  plataformas: ${(p.plataforma || []).join(', ')}`;
  $('titulo-propuesta').textContent = p.titulo || p.proyecto_nombre;

  const rot = p.rotacion || {};
  $('rotacion-linea').textContent =
    `Rotación: ${rot.regla || '—'} — ${rot.detalle || ''}`;

  $('txt-instagram').textContent = (p.texto || {}).instagram || '';
  $('txt-facebook').textContent = (p.texto || {}).facebook || '';

  const cont = $('hashtags');
  cont.innerHTML = '';
  (p.hashtags || []).forEach((h) => {
    const s = document.createElement('span');
    s.textContent = h;
    cont.appendChild(s);
  });
  $('txt-hashtags').textContent = (p.hashtags || []).join(' ');
  $('cta').textContent = p.llamada_a_la_accion || '—';

  pintarProgramacion(p);

  if ((ESTADO.avisos || []).length) {
    aviso('Revisión técnica: ' + ESTADO.avisos.join(' | '), 'error');
  }
}

/* Programación: estado actual, instante fijado y controles. */
function pintarProgramacion(p) {
  const g = ESTADO.programacion || {};

  $('estado-actual').textContent = 'Estado actual: ' + (p.estado || '—');

  $('programada-para').textContent = g.programado_para
    ? 'Programada para: ' + g.texto
    : 'Sin programar. Hora del sistema: ' + (g.ahora || '—');

  // Se rellena con lo ya programado; si no hay nada, con la fecha que propone
  // la rotación. Así el caso normal es pulsar PROGRAMAR sin escribir nada.
  const base = (g.programado_para || g.sugerida || '').slice(0, 16);
  if (base && !$('fecha-prog').dataset.tocado) {
    $('fecha-prog').value = base.slice(0, 10);
    $('hora-prog').value = base.slice(11, 16);
  }

  $('btn-programar').textContent = g.programado_para ? 'REPROGRAMAR' : 'PROGRAMAR';
  $('btn-programar').disabled = !g.programable;
  $('btn-desprogramar').disabled = !g.programado_para;
  $('bloque-programacion').title = g.programable
    ? ''
    : 'Solo se puede programar una propuesta aprobada.';
}

function pintarProyectos() {
  const r = ESTADO.resumen;
  const tarjetas = [
    ['Proyectos', r.proyectos],
    ['Archivos', r.total_archivos],
    ['Publicables', r.publicables],
    ['Disponibles', (r.por_estado || {}).disponible || 0],
    ['Pendientes', (r.por_estado || {}).pendiente || 0],
    ['Publicados', (r.por_estado || {}).publicado || 0],
  ];
  $('tarjetas-resumen').innerHTML = tarjetas
    .map(([e, n]) => `<div class="tarjeta"><div class="n">${n}</div><div class="e">${e}</div></div>`)
    .join('');

  const tb = document.querySelector('#tabla-proyectos tbody');
  tb.innerHTML = (ESTADO.proyectos || [])
    .map((p) => `
      <tr>
        <td><strong>${esc(p.nombre)}</strong><br><span class="tenue mini">${esc(p.carpeta)}</span></td>
        <td>${esc(p.ubicacion || '—')}</td>
        <td>${esc(p.anio || '—')}</td>
        <td>${esc(p.tipologia || '—')}</td>
        <td>${p.archivos}</td>
        <td>${p.publicables}</td>
        <td>${p.disponibles}</td>
        <td>${p.publicaciones}</td>
        <td><button class="btn mini" data-proyecto="${esc(p.carpeta)}">Generar</button></td>
      </tr>`)
    .join('');

  tb.querySelectorAll('button[data-proyecto]').forEach((b) => {
    b.onclick = () => generar(b.dataset.proyecto);
  });
}

function pintarContenido() {
  const r = ESTADO.resumen;
  $('barras-tipo').innerHTML = barras(r.por_tipo || {});
  $('barras-estado').innerHTML = barras(r.por_estado || {});
  $('pie-escaneo').textContent = 'Último escaneo: ' + (r.escaneado || '—');
}

function barras(obj) {
  const entradas = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entradas.map((e) => e[1]));
  return entradas
    .map(([k, v]) => `
      <div class="barra-fila">
        <span class="tenue">${esc(k)}</span>
        <span class="barra-pista"><span class="barra-relleno" style="width:${(v / max) * 100}%"></span></span>
        <span>${v}</span>
      </div>`)
    .join('');
}

function pintarListas() {
  $('lista-pendientes').innerHTML = filasBanco(
    ESTADO.pendientes, 'No hay publicaciones pendientes.');
  $('lista-publicadas').innerHTML =
    filas(ESTADO.publicadas, 'Todavía no se ha publicado nada.');
  engancharDetalle();
}

/* Banco de publicaciones: una fila por propuesta almacenada.
   Los textos NO se regeneran: se muestran los que ya están guardados. */
function filasBanco(lista, vacio) {
  if (!lista || !lista.length) return `<p class="tenue">${vacio}</p>`;

  const conFecha = lista.filter((p) => p.programado_para).length;
  const cab = `<p class="tenue mini">${lista.length} publicaciones almacenadas ·
    ${conFecha} programadas · ${lista.length - conFecha} sin fecha.
    En orden cronológico de publicación. Los textos ya están guardados;
    abrir una no vuelve a generarlos.</p>`;

  return cab + lista.map((p) => {
    const prog = p.programado_para
      ? `<span class="etiqueta verde">${esc(fechaCorta(p.programado_para))}</span>`
      : '<span class="tenue mini">sin fecha</span>';
    const pub = p.imagen_publica
      ? '<span class="etiqueta verde" title="Derivado JPEG publicado">imagen lista</span>'
      : '<span class="etiqueta roja" title="Relación de aspecto no admitida por Instagram: no apta, no programada">NO APTA</span>';
    return `
      <div class="fila banco" data-id="${esc(p.id)}">
        <img class="miniatura" src="/imagen/${encodeURIComponent(p.id)}" alt="" loading="lazy">
        <div class="izq">
          <div class="titulo">${esc(p.titulo || p.proyecto_nombre)}</div>
          <div class="tenue mini">${esc(p.id)} · ${esc(p.proyecto_nombre || '')}</div>
          <div class="tenue mini">${esc(p.archivo)} · ${esc(p.ambiente || 'sin clasificar')}</div>
          <div class="tenue mini">${(p.plataforma || []).map(esc).join(' · ')}</div>
        </div>
        <div class="der">
          <span class="etiqueta ${p.estado === 'aprobada' ? 'verde' : 'gris'}">${esc(p.estado)}</span>
          ${pub}
          ${prog}
        </div>
        <div class="detalle oculto">
          <h4>Resultado por plataforma</h4>
          ${porPlataforma(p)}
          <h4>Instagram</h4>
          <pre>${esc((p.texto || {}).instagram || '')}</pre>
          <h4>Facebook</h4>
          <pre>${esc((p.texto || {}).facebook || '')}</pre>
          <p class="tenue mini">id_archivo: ${esc(p.id_archivo || '')}</p>
          ${p.imagen_publica
            ? `<p class="tenue mini">URL pública: ${esc(p.imagen_publica)}</p>` : ''}
        </div>
      </div>`;
  }).join('');
}

/* Resultado independiente de cada plataforma, con su enlace si existe. */
function porPlataforma(p) {
  const plat = p.plataformas || {};
  const clase = {
    publicada: 'verde',
    fallida: 'roja',
    verificacion_requerida: 'roja',
    publicando: 'gris',
    pendiente: 'gris',
  };
  const filas = Object.keys(plat).sort().map((nombre) => {
    const d = plat[nombre] || {};
    const e = d.estado || 'pendiente';
    const enlace = d.permalink
      ? ` <a href="${esc(d.permalink)}" target="_blank" rel="noopener">${esc(d.permalink)}</a>`
      : '';
    const err = d.error ? `<div class="tenue mini">${esc(String(d.error).slice(0, 160))}</div>` : '';
    return `<div class="mini">
        <strong>${esc(nombre)}</strong>
        <span class="etiqueta ${clase[e] || 'gris'}">${esc(e)}</span>
        ${d.id ? `<span class="tenue">id ${esc(d.id)}</span>` : ''}${enlace}
        ${err}
      </div>`;
  }).join('');
  return filas + `<div class="mini tenue">global: ${esc(p.resultado_global || 'pendiente')}</div>`;
}

function fechaCorta(iso) {
  const m = String(iso).slice(0, 16);
  return m.slice(8, 10) + '/' + m.slice(5, 7) + '/' + m.slice(0, 4) + ' ' + m.slice(11, 16);
}

function engancharDetalle() {
  document.querySelectorAll('.fila.banco').forEach((f) => {
    f.onclick = () => f.querySelector('.detalle').classList.toggle('oculto');
  });
}

function filas(lista, vacio) {
  if (!lista || !lista.length) return `<p class="tenue">${vacio}</p>`;
  return lista
    .map((p) => `
      <div class="fila">
        <div class="izq">
          <div class="titulo">${esc(p.titulo || p.proyecto_nombre)}</div>
          <div class="tenue mini">${esc(p.id)} · ${esc(p.fecha)} · ${esc(p.archivo)}</div>
          <div class="tenue mini">${esc(p.carpeta_pendiente || '')}</div>
        </div>
        <span class="etiqueta ${p.estado === 'aprobada' ? 'verde' : 'gris'}">${esc(p.estado)}</span>
      </div>`)
    .join('');
}

function pintarHistorial() {
  const tb = document.querySelector('#tabla-historial tbody');
  const h = ESTADO.historial || [];
  if (!h.length) {
    tb.innerHTML = '<tr><td colspan="7" class="tenue">Historial vacío.</td></tr>';
    return;
  }
  tb.innerHTML = h
    .map((p) => {
      const u = p.url_publicacion || {};
      const url = u.instagram || u.facebook || '—';
      return `<tr>
        <td>${esc(p.id)}</td>
        <td>${esc(p.fecha)}</td>
        <td>${esc(p.proyecto_nombre || p.proyecto)}</td>
        <td>${esc(p.archivo)}</td>
        <td>${esc((p.plataforma || []).join(', '))}</td>
        <td>${esc(p.estado)}</td>
        <td>${esc(url)}</td>
      </tr>`;
    })
    .join('');
}

function esc(t) {
  return String(t === undefined || t === null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ----------------------------------------------------------- acciones */

async function generar(proyecto) {
  if (TRABAJANDO) return;
  bloquear(true);
  try {
    const r = await api('/api/generar', { proyecto: proyecto || null });
    aviso('Propuesta ' + r.publicacion.id + ' generada. Nada se ha publicado.');
    await cargar();
    verVista('propuesta');
  } catch (e) {
    aviso(e.message, 'error');
  } finally {
    bloquear(false);
  }
}

function idActual() {
  return ESTADO && ESTADO.propuesta_actual ? ESTADO.propuesta_actual.id : null;
}

async function accion(ruta, cuerpo, mensaje) {
  if (TRABAJANDO) return;
  bloquear(true);
  try {
    const r = await api(ruta, cuerpo);
    aviso(r.mensaje || mensaje);
    await cargar();
  } catch (e) {
    aviso(e.message, 'error');
  } finally {
    bloquear(false);
  }
}

/* -------------------------------------------------------------- vistas */

function verVista(nombre) {
  document.querySelectorAll('.tab').forEach((t) =>
    t.classList.toggle('activo', t.dataset.vista === nombre));
  document.querySelectorAll('.vista').forEach((v) =>
    v.classList.toggle('activo', v.id === 'vista-' + nombre));
}

document.querySelectorAll('.tab').forEach((t) => {
  t.onclick = () => verVista(t.dataset.vista);
});

document.querySelectorAll('[data-copiar]').forEach((b) => {
  b.onclick = async () => {
    const texto = $(b.dataset.copiar).textContent;
    try {
      await navigator.clipboard.writeText(texto);
      aviso('Texto copiado al portapapeles.');
    } catch {
      aviso('No se pudo copiar automáticamente.', 'error');
    }
  };
});

$('btn-generar-vacio').onclick = () => generar(null);
$('btn-escanear').onclick = () =>
  accion('/api/escanear', {}, 'Inventario actualizado.');

$('btn-aprobar').onclick = () => {
  const id = idActual();
  if (!id) return;
  accion('/api/aprobar', { id }, 'Propuesta aprobada localmente.');
};

$('btn-rechazar').onclick = () => {
  const id = idActual();
  if (!id) return;
  const motivo = prompt('Motivo del rechazo (opcional):') || '';
  accion('/api/rechazar', { id, motivo }, 'Propuesta rechazada y archivada.');
};

$('btn-otra').onclick = () => {
  const id = idActual();
  // Sin propuesta actual no hay nada que reemplazar, pero se genera una nueva
  // en vez de no hacer nada: un botón que no responde ni avisa es un fallo
  // invisible, y así fue como este mismo caso pasó desapercibido.
  if (!id) {
    generar(null);
    return;
  }
  accion('/api/otra', { id }, 'Se generó una propuesta distinta.');
};

['fecha-prog', 'hora-prog'].forEach((id) => {
  $(id).oninput = () => { $('fecha-prog').dataset.tocado = '1'; };
});

$('btn-programar').onclick = () => {
  const id = idActual();
  if (!id) return;
  const fecha = $('fecha-prog').value;
  const hora = $('hora-prog').value || '18:30';
  if (!fecha) {
    aviso('Indica la fecha de publicación.', 'error');
    return;
  }
  accion('/api/programar', { id, fecha, hora }, 'Propuesta programada.');
};

$('btn-desprogramar').onclick = () => {
  const id = idActual();
  if (!id) return;
  accion('/api/cancelar-programacion', { id }, 'Programación cancelada.');
};

$('btn-texto').onclick = () => {
  const id = idActual();
  if (!id) return;
  accion('/api/texto', { id }, 'Textos reescritos con otra variante.');
};

/* Salud del sistema. Se pide en una llamada aparte porque consulta a Meta y
   tarda unos segundos; el panel se refresca a menudo y no debe quedarse
   esperando. La CLI (`python cymarq.py salud`) sigue siendo la vía operativa. */
async function cargarSalud() {
  const el = $('txt-salud');
  if (!el) return;
  el.textContent = 'salud: comprobando…';
  try {
    const s = await api('/api/salud');
    const plat = (s.meta && s.meta.plataformas) || {};
    const ig = (plat.instagram || {}).estado || '—';
    const fb = (plat.facebook || {}).estado || '—';
    const auto = ((s.gate || {}).detalle || {}).publicacion_automatica || '—';
    el.textContent = `salud ${s.general} · IG ${ig} · FB ${fb} · auto ${auto}`;
    el.title = 'Última comprobación: ' + (s.comprobado_en || '')
      + ' · publicación automática: ' + auto;
    el.className = 'salud ' + (s.general === 'OK' ? 'verde' : 'roja');
  } catch (e) {
    el.textContent = 'salud: no disponible';
    el.className = 'salud roja';
  }
}

cargar();
cargarSalud();
