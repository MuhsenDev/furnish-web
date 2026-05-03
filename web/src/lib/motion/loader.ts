/*
  Motion 1, the loading sequence per Document 3 Section 4.

  First 1.5 to 2.5 seconds of every fresh page load. The brand's
  first impression. Sequence:

    T=0ms      loader element fades in (covers viewport)
    T=200ms    "Furnish" wordmark fades from 0 to 1 over 600ms
    T=400ms    Horizontal accent line grows from 0 to full width
    T=1200ms   Line completes
    T=1400ms   Brief 200ms hold
    T=1600ms   Wordmark animates to navbar slot position
    T=1600ms   Loader bg fades to transparent over 400ms
    T=2000ms   Loader element removed from DOM

  First-load only. Subsequent navigations use page transitions
  (Motion 7, Phase 2 enhancement).

  Mobile multiplier (0.75x) applies via durations.ts.
*/

import { getGsap } from './gsap-loader';
import { getDurationSec, isMobile } from './durations';

export interface LoaderTargets {
  loaderEl: HTMLElement;
  wordmarkEl: HTMLElement;
  lineEl: HTMLElement;
  navbarSlotEl: HTMLElement;
}

export async function playLoaderSequence(
  targets: LoaderTargets,
  prefersReducedMotion: boolean,
): Promise<void> {
  const { loaderEl, wordmarkEl, lineEl, navbarSlotEl } = targets;
  const gsap = await getGsap();

  if (prefersReducedMotion) {
    /* Skip the entire sequence. Hide loader, leave navbar wordmark
       in its slot. Page hero takes over immediately. */
    gsap.set(loaderEl, { display: 'none' });
    return;
  }

  const wordmarkFade = getDurationSec('medium');
  const lineGrow = getDurationSec('long');
  const wordmarkMove = getDurationSec('medium');
  const bgFade = getDurationSec('base');

  const tl = gsap.timeline({
    onComplete: () => {
      /* Free the z-index 9999 slot once the sequence is done. */
      loaderEl.style.display = 'none';
    },
  });

  /* Wordmark fade in, slight scale up. */
  tl.fromTo(
    wordmarkEl,
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1.0, duration: wordmarkFade, ease: 'furnishOut' },
    0.2,
  );

  /* Accent line grows from center outward. transform-origin: center
     done on the element via inline style or class so scaleX(0) to
     scaleX(1) reads as a center-anchored grow. */
  gsap.set(lineEl, { transformOrigin: 'center' });
  tl.fromTo(
    lineEl,
    { scaleX: 0 },
    { scaleX: 1, duration: lineGrow, ease: 'furnishOut' },
    0.4,
  );

  /* 200ms hold at full state. */
  tl.to({}, { duration: 0.2 });

  /* Compute the navbar destination at run time so a responsive
     resize between page-paint and animation-start doesn't leave
     the wordmark stranded. Read once before the timeline plays. */
  const navbarRect = navbarSlotEl.getBoundingClientRect();
  const wordmarkRect = wordmarkEl.getBoundingClientRect();
  const deltaX = navbarRect.left - wordmarkRect.left;
  const deltaY = navbarRect.top - wordmarkRect.top;
  const targetScale = navbarRect.height / wordmarkRect.height;

  tl.to(
    wordmarkEl,
    {
      x: deltaX,
      y: deltaY,
      scale: targetScale,
      duration: wordmarkMove,
      ease: 'furnishInOut',
    },
    '+=0',
  );

  /* Loader background fades while wordmark moves. */
  tl.to(
    loaderEl,
    { opacity: 0, duration: bgFade, ease: 'furnishOut' },
    `-=${bgFade}`,
  );

  /* Line fades simultaneously with bg. */
  tl.to(lineEl, { opacity: 0, duration: bgFade * 0.75, ease: 'furnishOut' }, '<');

  /* Mobile keeps the same shape but compresses total time via
     duration tokens. The above already uses isMobile-aware values. */
  void isMobile;

  await tl;
}

/*
  Detect first-load via sessionStorage. Returns true exactly once
  per browser session.
*/
export function isFirstLoadOfSession(): boolean {
  if (typeof window === 'undefined') return false;
  const KEY = 'furnish.loader.played';
  const seen = window.sessionStorage.getItem(KEY);
  if (seen) return false;
  window.sessionStorage.setItem(KEY, '1');
  return true;
}
