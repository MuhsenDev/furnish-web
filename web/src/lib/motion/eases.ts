/*
  Custom GSAP eases per Document 3 Section 2.

  Five named eases. No exceptions. No one-off cubic-beziers per
  component. Every animation on the site uses one of these.

    furnishOut         (default, 80% of animations) sharp accel,
                       gentle decel
    furnishInOut       symmetric, used when an element should feel
                       "decided" at both ends
    furnishBack        slight overshoot, RARE, delight only
    furnishAnticipate  pulls back before moving forward, "wow" reveals
    furnishQuick       micro-interactions, hover, focus

  CustomEase is a GSAP plugin (free for non-commercial; covered by
  Business Green when Furnish goes commercial). Registration is
  idempotent so repeat calls are safe.
*/

import type { gsap as GsapType } from 'gsap';
import type { CustomEase as CustomEaseType } from 'gsap/CustomEase';

type GsapInstance = typeof GsapType;
type CustomEaseConstructor = typeof CustomEaseType;

/*
  Single source of truth for the curves. Mirrors the cubic-bezier
  values in tokens.css under --ease-furnish-* so CSS-driven and
  JS-driven animations match exactly. Keep these synced if either
  side changes.
*/
export const FURNISH_EASES = {
  /* Default (80% of animations). The Vercel curve. Replaced the
     original brand curve (0.22, 1, 0.36, 1) in 2026-05 so the site
     reads more "expensive" / deliberate. Mirrors
     --ease-furnish-out / --ease-premium in tokens.css. */
  furnishOut: '0.16, 1, 0.3, 1',
  furnishInOut: '0.65, 0, 0.35, 1',
  furnishBack: '0.34, 1.56, 0.64, 1',
  furnishAnticipate: '0.7, -0.4, 0.4, 1.4',
  furnishQuick: '0.4, 0, 0.2, 1',
} as const;

export type FurnishEaseName = keyof typeof FURNISH_EASES;

let registered = false;

/*
  Registers all five eases with GSAP. Called by gsap-loader.ts
  after CustomEase is imported. Safe to call multiple times.
*/
export function registerFurnishEases(
  gsap: GsapInstance,
  CustomEase: CustomEaseConstructor,
): void {
  if (registered) return;

  for (const [name, curve] of Object.entries(FURNISH_EASES)) {
    CustomEase.create(name, curve);
  }

  registered = true;
}

/*
  Test helper. Resets the registration flag so unit tests can
  re-run registerFurnishEases against a fresh GSAP instance.
*/
export function __resetEaseRegistrationForTests(): void {
  registered = false;
}
