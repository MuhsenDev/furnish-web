/*
  Duration tokens per Document 3 Section 3.

  Seven named durations. No custom values per component. Mobile
  multiplies by 0.75 automatically inside the getter functions.
  Reduced motion sets every duration to 0.

  Values are in milliseconds. GSAP wants seconds, so the gsap()
  helper below divides by 1000 at the call site. CSS variables
  in tokens.css carry the same values for CSS-driven animations.
*/

const MOBILE_MAX = 768;

export type DurationToken =
  | 'instant'
  | 'quick'
  | 'base'
  | 'medium'
  | 'long'
  | 'extended'
  | 'loader';

const DESKTOP_DURATIONS: Record<DurationToken, number> = {
  instant: 100,
  quick: 200,
  base: 400,
  medium: 600,
  long: 800,
  extended: 1200,
  loader: 2000,
};

/*
  Mobile multiplier. Document 3 Section 3.2: durations multiply
  by 0.75 on touch devices for snappier feedback.
*/
const MOBILE_MULTIPLIER = 0.75;

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_MAX;
}

/*
  Returns the duration in MILLISECONDS for the given token. Auto-
  applies the mobile multiplier. Pass prefersReducedMotion=true
  to force 0.
*/
export function getDurationMs(
  token: DurationToken,
  prefersReducedMotion = false,
): number {
  if (prefersReducedMotion) return 0;
  const base = DESKTOP_DURATIONS[token];
  return isMobileViewport() ? Math.round(base * MOBILE_MULTIPLIER) : base;
}

/*
  GSAP-friendly variant. Returns the duration in SECONDS. Use this
  in GSAP timeline calls (gsap.to(el, { duration: gsapDuration('base') }))
  so the unit conversion stays in one place.
*/
export function getDurationSec(
  token: DurationToken,
  prefersReducedMotion = false,
): number {
  return getDurationMs(token, prefersReducedMotion) / 1000;
}

/*
  Convenience snapshot for components that want all seven values
  at once (e.g. a complex orchestrated timeline that needs more
  than one duration without re-querying isMobileViewport seven
  times).
*/
export function getAllDurations(
  prefersReducedMotion = false,
): Record<DurationToken, number> {
  return {
    instant: getDurationMs('instant', prefersReducedMotion),
    quick: getDurationMs('quick', prefersReducedMotion),
    base: getDurationMs('base', prefersReducedMotion),
    medium: getDurationMs('medium', prefersReducedMotion),
    long: getDurationMs('long', prefersReducedMotion),
    extended: getDurationMs('extended', prefersReducedMotion),
    loader: getDurationMs('loader', prefersReducedMotion),
  };
}

/*
  Mobile-aware viewport check exported for use in motion functions
  that need to know "are we on mobile" for transform offsets and
  staggers (not just durations).
*/
export const isMobile = isMobileViewport;
