/*
  Motion library public API per Document 3 Section 17.1.

  Components must import from '@/lib/motion' only. NEVER from
  internal motion files (e.g. '@/lib/motion/hero'). This boundary
  keeps the public surface curated and lets us refactor internals
  without breaking callers.

  Re-exports:
    - Hooks (React-aware wrappers)
    - Imperative motion functions (for non-React contexts)
    - Type exports
*/

/* React hooks */
export { useReducedMotion } from './reduced-motion';
export {
  useScrollReveal,
  useStaggeredReveal,
  useHeroSequence,
  useCompareSlider,
} from './hooks';

/* Loader-related */
export { getGsap } from './gsap-loader';
export { isMobile, getDurationMs, getDurationSec, getAllDurations } from './durations';
export type { DurationToken } from './durations';
export type { FurnishEaseName } from './eases';

/* Imperative motion functions */
export { playLoaderSequence, isFirstLoadOfSession } from './loader';
export type { LoaderTargets } from './loader';

export { playHeroReveal } from './hero';
export type { HeroTargets } from './hero';

export { setupScrollReveal } from './scroll-reveal';
export type { ScrollRevealOptions } from './scroll-reveal';

export { createCompareSlider } from './compare-slider';
export type {
  CompareSliderInstance,
  CompareSliderOptions,
} from './compare-slider';

export { openMenu, closeMenu } from './menu';

export { playPageTransition } from './page-transition';
export type { PageTransitionOptions } from './page-transition';

export { openLightbox, closeLightbox } from './lightbox';
export type { LightboxTargets } from './lightbox';

export { animateNumber } from './number-counter';
export type { NumberCounterOptions } from './number-counter';

export { createSubmitButton } from './forms';
export type {
  SubmitState,
  SubmitButtonStateMachine,
  CreateSubmitButtonOptions,
} from './forms';
