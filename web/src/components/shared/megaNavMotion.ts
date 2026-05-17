/*
  Shared motion constants for the MegaNav components.

  4-tuple typed so they satisfy framer-motion 12's Easing type
  inside Variants objects. Defined once here rather than three
  times across MegaNavOverlay / MegaNavSectionRail /
  MegaNavSectionContent (the prior arrangement, removed
  2026-05-17 in a simplify pass).
*/

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_IN: [number, number, number, number] = [0.7, 0, 0.84, 0];
