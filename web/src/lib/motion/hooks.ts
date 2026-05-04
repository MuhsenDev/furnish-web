'use client';

/*
  React hooks per Document 3 Section 5.4, 6.4, and 7.4.

  Each hook wraps an imperative motion function with React lifecycle
  awareness: cleans up on unmount, reads prefers-reduced-motion via
  useReducedMotion(), runs once per mount.

    useScrollReveal       Most common hook. 6-12x per page. Wraps
                          setupScrollReveal.
    useStaggeredReveal    Variant with explicit stagger control.
                          Same underlying primitive.
    useHeroSequence       Hero reveal choreography. 1x per home page.
    useCompareSlider      Drag interaction + auto-demo.

  All hooks return a ref to attach to the root element. The hook
  internally queries descendants via data-* attributes.
*/

import { useEffect, useRef, type RefObject } from 'react';
import { setupScrollReveal, type ScrollRevealOptions } from './scroll-reveal';
import { playHeroReveal, type HeroTargets } from './hero';
import { createCompareSlider, type CompareSliderInstance } from './compare-slider';
import { useReducedMotion } from './reduced-motion';

/*
  useScrollReveal()

  Attach the returned ref to a section element. Children matching
  options.childSelector (default '[data-reveal]') animate up + fade
  in when the section enters the viewport.
*/
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options?: ScrollRevealOptions,
): RefObject<T> {
  const ref = useRef<T>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!ref.current) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    setupScrollReveal(ref.current, options, prefersReduced).then((fn) => {
      if (cancelled) {
        fn();
        return;
      }
      cleanup = fn;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [prefersReduced]);

  return ref;
}

/*
  useStaggeredReveal()

  Same primitive as useScrollReveal but exposes the stagger and
  duration overrides as a more direct API. Use this when a section
  has a specific rhythm (e.g. a 3-card row that wants 200ms stagger
  for emphasis). For default reveals, use useScrollReveal.
*/
export interface StaggeredRevealOptions extends ScrollRevealOptions {
  /** Convenience alias for stagger. */
  staggerMs?: number;
}

export function useStaggeredReveal<T extends HTMLElement = HTMLElement>(
  options: StaggeredRevealOptions = {},
): RefObject<T> {
  const { staggerMs, ...rest } = options;
  const merged: ScrollRevealOptions = {
    ...rest,
    stagger: staggerMs != null ? staggerMs / 1000 : rest.stagger,
  };
  return useScrollReveal<T>(merged);
}

/*
  useHeroSequence()

  Attach the returned ref to the hero <section>. The hook queries
  these data attributes inside the section:

    [data-hero-image]
    [data-hero-eyebrow]
    [data-hero-headline-line]    (3 expected)
    [data-hero-subhead]
    [data-hero-cta-primary]
    [data-hero-cta-secondary]    (optional)

  Sequence runs once on mount.
*/
export function useHeroSequence<T extends HTMLElement = HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const imageEl = root.querySelector<HTMLElement>('[data-hero-image]');
    const eyebrowEl = root.querySelector<HTMLElement>('[data-hero-eyebrow]');
    const headlineLines = Array.from(
      root.querySelectorAll<HTMLElement>('[data-hero-headline-line]'),
    );
    const subheadEl = root.querySelector<HTMLElement>('[data-hero-subhead]');
    const primaryCtaEl = root.querySelector<HTMLElement>('[data-hero-cta-primary]');
    const secondaryCtaEl = root.querySelector<HTMLElement>('[data-hero-cta-secondary]');

    /* imageEl is now optional. The text-forward hero (no room photo)
       still animates the rest of the targets. */
    if (
      !eyebrowEl ||
      headlineLines.length === 0 ||
      !subheadEl ||
      !primaryCtaEl
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[useHeroSequence] Missing required data attributes. Hero reveal skipped.',
        );
      }
      return;
    }

    const targets: HeroTargets = {
      imageEl,
      eyebrowEl,
      headlineLines,
      subheadEl,
      primaryCtaEl,
      secondaryCtaEl,
    };

    playHeroReveal(targets, prefersReduced);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [prefersReduced]);

  return ref;
}

/*
  useCompareSlider()

  Wraps createCompareSlider. Pass refs to the container, two images,
  and the handle. Returns a ref-bag plus optional onPositionChange
  callback for external state hooks.
*/
export interface UseCompareSliderTargets {
  containerRef: RefObject<HTMLElement>;
  beforeImgRef: RefObject<HTMLImageElement>;
  afterImgRef: RefObject<HTMLImageElement>;
  handleRef: RefObject<HTMLElement>;
}

export interface UseCompareSliderOptions {
  initialPosition?: number;
  autoDemo?: boolean;
}

export function useCompareSlider(
  targets: UseCompareSliderTargets,
  options: UseCompareSliderOptions = {},
): void {
  const prefersReduced = useReducedMotion();
  const { containerRef, beforeImgRef, afterImgRef, handleRef } = targets;

  useEffect(() => {
    const container = containerRef.current;
    const beforeImg = beforeImgRef.current;
    const afterImg = afterImgRef.current;
    const handle = handleRef.current;

    if (!container || !beforeImg || !afterImg || !handle) return;

    let instance: CompareSliderInstance | null = null;
    let cancelled = false;

    createCompareSlider(container, beforeImg, afterImg, handle, {
      initialPosition: options.initialPosition,
      autoDemo: options.autoDemo,
      prefersReducedMotion: prefersReduced,
    }).then((created) => {
      if (cancelled) {
        created.destroy();
        return;
      }
      instance = created;
    });

    return () => {
      cancelled = true;
      instance?.destroy();
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [prefersReduced, options.initialPosition, options.autoDemo]);
}
