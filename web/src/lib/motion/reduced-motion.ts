'use client';

import { useEffect, useState } from 'react';

/*
  useReducedMotion()

  Returns true when the user prefers reduced motion (OS-level
  accessibility setting OR a forced override). Components consume
  this to short-circuit non-essential animations into instant
  state changes.

  Per Document 2 Section 5.1.3 and Section 10.4, reduced-motion
  respect is non-negotiable on every animation. The blanket CSS
  override in globals.css covers transitions and CSS animations.
  This hook covers JS-driven animations (GSAP timelines, RAF
  loops, scroll-triggered choreography).

  Listens to media-query changes so the value updates live if
  the user toggles the OS setting mid-session.
*/
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}
