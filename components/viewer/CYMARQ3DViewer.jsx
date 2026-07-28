'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ViewerEngine from '@/lib/viewer3d/ViewerEngine';
import fetchModel from '@/lib/viewer3d/fetchModel';
import {
  IconAxes,
  IconClose,
  IconCollapse,
  IconCube,
  IconExpand,
  IconEye,
  IconEyeOff,
  IconFit,
  IconGrid,
  IconInfo,
  IconLayers,
  IconReset,
  IconRotate,
} from '@/components/viewer/ViewerIcons';

/**
 * Visor 3D de CYMARQ.
 *
 * Reutilizable en cualquier proyecto:
 *   <CYMARQ3DViewer model="/models/casa-prueba.glb" title="Casa Moderna" />
 *
 * Todas las vistas y la grilla se calculan desde el bounding box del GLB,
 * de modo que no hay coordenadas específicas de ningún modelo.
 */

const VIEWS = [
  { key: 'FR', label: 'FR', title: 'Frente' },
  { key: 'BK', label: 'BK', title: 'Posterior' },
  { key: 'LT', label: 'LT', title: 'Izquierda' },
  { key: 'RT', label: 'RT', title: 'Derecha' },
  { key: 'TP', label: 'TP', title: 'Superior' },
  { key: 'BT', label: 'BT', title: 'Inferior' },
  { key: 'ISO', label: 'ISO', title: 'Isométrica' },
];

const SECONDARY_MODES = [
  { key: 'wireframe', label: 'Wireframe' },
  { key: 'solidwire', label: 'Sólido + malla' },
  { key: 'xray', label: 'Rayos X' },
];

const CHIP =
  'inline-flex items-center justify-center gap-2 border px-2.5 py-2 font-sans text-[10px] uppercase leading-none tracking-widest2 backdrop-blur-md transition-colors duration-300';
const CHIP_OFF =
  'border-white/15 bg-ink/55 text-white/65 hover:border-gold/60 hover:text-white';
const CHIP_ON = 'border-gold bg-gold text-ink';

const cx = (...parts) => parts.filter(Boolean).join(' ');

export default function CYMARQ3DViewer({
  model,
  title = 'Modelo 3D',
  fileLabel,
  onClose,
}) {
  const wrapRef = useRef(null);
  const hostRef = useRef(null);
  const engineRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Cargando modelo 3D');
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const [mode, setMode] = useState('textured');
  const [gridOn, setGridOn] = useState(true);
  const [axesOn, setAxesOn] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [view, setView] = useState('ISO');

  const [uiHidden, setUiHidden] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState('none'); // none | native | fallback

  /* ---------------------------------------------------------------- */
  /* Arranque: motor + descarga del GLB                                */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let engine;
    const controller = new AbortController();

    try {
      engine = new ViewerEngine(host);
      engineRef.current = engine;
    } catch (e) {
      setError('Tu navegador no admite WebGL, necesario para ver el modelo 3D.');
      setStatus('error');
      return undefined;
    }

    (async () => {
      try {
        const buffer = await fetchModel(
          model,
          (p) => setProgress(Math.round(p * 100)),
          controller.signal
        );
        if (controller.signal.aborted || engine.disposed) return;
        setPhase('Preparando la escena');
        const result = await engine.load(buffer);
        if (controller.signal.aborted || engine.disposed) return;
        setStats(result);
        setStatus('ready');
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e && e.message ? e.message : 'No se pudo cargar el modelo 3D.');
        setStatus('error');
      }
    })();

    return () => {
      controller.abort();
      engineRef.current = null;
      engine.dispose();
    };
  }, [model]);

  /* Pausa el bucle de render cuando el visor no está a la vista */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => engineRef.current?.setPaused(!entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(wrap);

    const onVisibility = () =>
      engineRef.current?.setPaused(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Acciones                                                          */
  /* ---------------------------------------------------------------- */

  const applyView = useCallback((key) => {
    setView(key);
    engineRef.current?.setView(key, true);
  }, []);

  const applyMode = useCallback((key) => {
    setMode(key);
    setMoreOpen(false);
    engineRef.current?.setMode(key);
  }, []);

  const toggleGrid = useCallback(() => {
    setGridOn((prev) => {
      engineRef.current?.setGridVisible(!prev);
      return !prev;
    });
  }, []);

  const toggleAxes = useCallback(() => {
    setAxesOn((prev) => {
      engineRef.current?.setAxesVisible(!prev);
      return !prev;
    });
  }, []);

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      engineRef.current?.setAutoRotate(!prev);
      return !prev;
    });
  }, []);

  const doFit = useCallback(() => engineRef.current?.fit(true), []);

  const doReset = useCallback(() => {
    setView('ISO');
    engineRef.current?.reset();
  }, []);

  /* Pantalla completa: nativa cuando el navegador la permite, si no una
     variante a pantalla total por CSS (iPhone no admite fullscreen en <div>). */
  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;

    const isNative =
      document.fullscreenElement === el || document.webkitFullscreenElement === el;

    if (isNative) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
      return;
    }
    if (fullscreen === 'fallback') {
      setFullscreen('none');
      return;
    }

    const request = el.requestFullscreen || el.webkitRequestFullscreen;
    if (request) {
      const result = request.call(el);
      if (result && result.catch) result.catch(() => setFullscreen('fallback'));
    } else {
      setFullscreen('fallback');
    }
  }, [fullscreen]);

  useEffect(() => {
    const onChange = () => {
      const el = wrapRef.current;
      const active =
        document.fullscreenElement === el || document.webkitFullscreenElement === el;
      setFullscreen((prev) => (active ? 'native' : prev === 'native' ? 'none' : prev));
      requestAnimationFrame(() => {
        engineRef.current?.resize();
        // El encuadre depende de la relación de aspecto: al cambiar de tamaño
        // se recalcula para que el modelo siga aprovechando toda la pantalla.
        engineRef.current?.fit(true);
      });
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  /* Bloqueo del scroll de fondo en el modo a pantalla total por CSS */
  useEffect(() => {
    if (fullscreen !== 'fallback') return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      engineRef.current?.resize();
      engineRef.current?.fit(true);
    });
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  /* Atajos de teclado */
  const onKeyDown = useCallback(
    (event) => {
      const key = event.key.toLowerCase();
      const shortcuts = {
        h: () => setUiHidden((v) => !v),
        f: toggleFullscreen,
        r: doReset,
        e: doFit,
        g: toggleGrid,
        x: toggleAxes,
        ' ': toggleAutoRotate,
      };
      const digits = ['1', '2', '3', '4', '5', '6', '7'];
      if (digits.includes(key)) {
        applyView(VIEWS[digits.indexOf(key)].key);
        event.preventDefault();
        return;
      }
      if (key === 'escape') {
        if (uiHidden) setUiHidden(false);
        if (fullscreen === 'fallback') setFullscreen('none');
        return;
      }
      if (shortcuts[key]) {
        shortcuts[key]();
        event.preventDefault();
      }
    },
    [
      applyView,
      doFit,
      doReset,
      fullscreen,
      toggleAutoRotate,
      toggleAxes,
      toggleFullscreen,
      toggleGrid,
      uiHidden,
    ]
  );

  /* ---------------------------------------------------------------- */
  /* Interfaz                                                          */
  /* ---------------------------------------------------------------- */

  const isFs = fullscreen !== 'none';
  const showUi = status === 'ready' && !uiHidden;

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="application"
      aria-label={`Visor 3D — ${title}`}
      className={cx(
        'relative w-full select-none overflow-hidden bg-ink outline-none',
        fullscreen === 'fallback' && 'fixed inset-0 z-[70]',
        fullscreen === 'native' && 'h-full',
        !isFs && 'h-[62vh] min-h-[380px] md:h-[78vh]'
      )}
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 40%, #262930 0%, #14161a 55%, #0a0b0d 100%)',
      }}
    >
      <div ref={hostRef} className="absolute inset-0" />

      {/* Carga */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-ink/70 px-8 text-center backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-widest2 text-gold">{phase}</p>
          <p className="font-display text-5xl text-white md:text-6xl">{progress}%</p>
          <div className="h-px w-56 max-w-full bg-white/15">
            <div
              className="h-px bg-gold transition-[width] duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="max-w-xs text-[11px] leading-relaxed text-white/45">
            {title}
            {fileLabel ? ` · ${fileLabel}` : ''}
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink/85 px-8 text-center">
          <p className="text-[11px] uppercase tracking-widest2 text-gold">
            No fue posible mostrar el modelo
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-white/70">{error}</p>
        </div>
      )}

      {/* Barra superior */}
      {showUi && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 md:p-4">
          <div className="pointer-events-auto border border-white/10 bg-ink/50 px-3 py-2 backdrop-blur-md">
            <p className="text-[9px] uppercase tracking-widest2 text-gold">Modelo 3D</p>
            <p className="mt-1 max-w-[42vw] truncate text-[11px] text-white/85 md:max-w-xs">
              {title}
            </p>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              title="Información técnica"
              aria-label="Información técnica"
              className={cx(CHIP, infoOpen ? CHIP_ON : CHIP_OFF)}
            >
              <IconInfo />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFs ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
              aria-label={isFs ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className={cx(CHIP, CHIP_OFF)}
            >
              {isFs ? <IconCollapse /> : <IconExpand />}
            </button>
            <button
              type="button"
              onClick={() => setUiHidden(true)}
              title="Ocultar controles (H)"
              aria-label="Ocultar controles"
              className={cx(CHIP, CHIP_OFF)}
            >
              <IconEyeOff />
            </button>
            {onClose && !isFs && (
              <button
                type="button"
                onClick={onClose}
                title="Cerrar visor"
                aria-label="Cerrar visor"
                className={cx(CHIP, CHIP_OFF)}
              >
                <IconClose />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Panel de información técnica */}
      {showUi && infoOpen && stats && (
        <div className="pointer-events-auto absolute right-3 top-[4.5rem] z-10 w-64 border border-white/10 bg-ink/80 p-4 backdrop-blur-md md:right-4 md:top-20">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[9px] uppercase tracking-widest2 text-gold">
              Información técnica
            </p>
            <button
              type="button"
              onClick={() => setInfoOpen(false)}
              aria-label="Cerrar información"
              className="text-white/50 transition-colors hover:text-white"
            >
              <IconClose className="h-3.5 w-3.5" />
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-[11px] text-white/70">
            <InfoRow label="Dimensiones">
              {stats.size.x.toFixed(2)} × {stats.size.z.toFixed(2)} ×{' '}
              {stats.size.y.toFixed(2)} m
            </InfoRow>
            <InfoRow label="Triángulos">{stats.triangles.toLocaleString('es-CO')}</InfoRow>
            <InfoRow label="Vértices">{stats.vertices.toLocaleString('es-CO')}</InfoRow>
            <InfoRow label="Mallas">{stats.meshes.toLocaleString('es-CO')}</InfoRow>
            <InfoRow label="Materiales">{stats.materials}</InfoRow>
            <InfoRow label="Formato">glTF binario (GLB)</InfoRow>
            {fileLabel && <InfoRow label="Archivo">{fileLabel}</InfoRow>}
          </dl>
          <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/35">
            Ancho × fondo × alto según el modelo. Atajos: H ocultar · F pantalla completa ·
            R reiniciar · G grilla · 1–7 vistas.
          </p>
        </div>
      )}

      {/* Vistas automáticas */}
      {showUi && (
        <div className="pointer-events-auto absolute left-3 top-1/2 z-10 -translate-y-1/2 md:left-4">
          <div className="flex flex-col gap-1">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => applyView(v.key)}
                title={v.title}
                aria-label={`Vista ${v.title}`}
                aria-pressed={view === v.key}
                className={cx(
                  CHIP,
                  'w-11 px-0',
                  view === v.key ? CHIP_ON : CHIP_OFF
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modos y herramientas */}
      {showUi && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-end gap-2 p-3 md:p-4">
          <div className="pointer-events-auto relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyMode('textured')}
              className={cx(CHIP, mode === 'textured' ? CHIP_ON : CHIP_OFF)}
            >
              <IconLayers className="h-3.5 w-3.5" />
              Texturas
            </button>
            <button
              type="button"
              onClick={() => applyMode('white')}
              className={cx(CHIP, mode === 'white' ? CHIP_ON : CHIP_OFF)}
            >
              <IconCube className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Maqueta blanca</span>
              <span className="sm:hidden">Maqueta</span>
            </button>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              title="Más modos de visualización"
              aria-label="Más modos de visualización"
              aria-expanded={moreOpen}
              className={cx(
                CHIP,
                SECONDARY_MODES.some((m) => m.key === mode) || moreOpen
                  ? CHIP_ON
                  : CHIP_OFF
              )}
            >
              ···
            </button>

            {moreOpen && (
              <div className="absolute bottom-full right-0 mb-1 flex min-w-[10rem] flex-col border border-white/10 bg-ink/85 backdrop-blur-md">
                {SECONDARY_MODES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => applyMode(m.key)}
                    className={cx(
                      'px-3 py-2.5 text-left text-[10px] uppercase tracking-widest2 transition-colors duration-300',
                      mode === m.key
                        ? 'bg-gold text-ink'
                        : 'text-white/65 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-1">
            <button
              type="button"
              onClick={doFit}
              title="Encuadrar modelo (E)"
              aria-label="Encuadrar modelo"
              className={cx(CHIP, CHIP_OFF)}
            >
              <IconFit />
            </button>
            <button
              type="button"
              onClick={doReset}
              title="Restablecer cámara (R)"
              aria-label="Restablecer cámara"
              className={cx(CHIP, CHIP_OFF)}
            >
              <IconReset />
            </button>
            <button
              type="button"
              onClick={toggleAutoRotate}
              title="Autorrotación (Espacio)"
              aria-label="Autorrotación"
              aria-pressed={autoRotate}
              className={cx(CHIP, autoRotate ? CHIP_ON : CHIP_OFF)}
            >
              <IconRotate />
            </button>
            <button
              type="button"
              onClick={toggleGrid}
              title="Grilla (G)"
              aria-label="Grilla"
              aria-pressed={gridOn}
              className={cx(CHIP, gridOn ? CHIP_ON : CHIP_OFF)}
            >
              <IconGrid />
            </button>
            <button
              type="button"
              onClick={toggleAxes}
              title="Ejes XYZ (X)"
              aria-label="Ejes XYZ"
              aria-pressed={axesOn}
              className={cx(CHIP, axesOn ? CHIP_ON : CHIP_OFF)}
            >
              <IconAxes />
            </button>
          </div>
        </div>
      )}

      {/* Reaparición discreta de la interfaz */}
      {status === 'ready' && uiHidden && (
        <button
          type="button"
          onClick={() => setUiHidden(false)}
          title="Mostrar controles (H)"
          aria-label="Mostrar controles"
          className="absolute bottom-3 right-3 z-10 border border-white/15 bg-ink/40 p-2 text-white/40 opacity-40 backdrop-blur-md transition-opacity duration-500 hover:opacity-100 md:bottom-4 md:right-4"
        >
          <IconEye />
        </button>
      )}
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[9px] uppercase tracking-widest2 text-white/40">{label}</dt>
      <dd className="text-right text-white/80">{children}</dd>
    </div>
  );
}
