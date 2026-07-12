import { useEffect, useLayoutEffect } from 'react';

/**
 * useLayoutEffect seguro para SSR.
 *
 * Importante para GSAP ScrollTrigger con `pin`: la limpieza de useLayoutEffect
 * se ejecuta de forma SÍNCRONA antes de que React elimine los nodos del DOM
 * al navegar entre páginas. Con useEffect (asíncrono), el `pin-spacer` que
 * GSAP inserta seguiría en el DOM y React fallaría con
 * "NotFoundError: Failed to execute 'removeChild' on 'Node'".
 */
const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsoLayoutEffect;
