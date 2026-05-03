/*
  Motion 8, gallery lightbox per Document 3 Section 11.

  Tap-to-enlarge interaction on the /gallery page. Uses GSAP Flip
  to animate from card position to full lightbox position.

  Open sequence:
    T=0     User taps a gallery card
    T=0     Card image animates to lightbox position via Flip
    T=400   Image reaches lightbox size
    T=400   Lightbox bg fades in (200ms)
    T=600   Caption fades in
    T=800   Complete

  Close sequence:
    T=0     User taps X or presses Escape
    T=0     Caption fades out
    T=200   Image animates back to card position via Flip
    T=600   Lightbox bg fades out, removed from DOM

  Reduced motion: instant show/hide, no Flip animation.
*/

import { getGsap } from './gsap-loader';
import { getDurationSec } from './durations';

export interface LightboxTargets {
  cardImg: HTMLElement;
  lightboxContainer: HTMLElement;
  lightboxBg: HTMLElement;
  captionEl?: HTMLElement | null;
}

export async function openLightbox(
  targets: LightboxTargets,
  prefersReducedMotion: boolean,
): Promise<void> {
  const { cardImg, lightboxContainer, lightboxBg, captionEl } = targets;
  const gsap = await getGsap();
  const { Flip } = await import('gsap/Flip');

  if (prefersReducedMotion) {
    /* Instant move. Append the image to the lightbox; show bg and
       caption at full opacity. */
    lightboxContainer.appendChild(cardImg);
    gsap.set(lightboxBg, { opacity: 1 });
    if (captionEl) gsap.set(captionEl, { opacity: 1 });
    return;
  }

  /* Capture current layout, move element, animate from old to new. */
  const state = Flip.getState(cardImg);
  lightboxContainer.appendChild(cardImg);

  Flip.from(state, {
    duration: getDurationSec('base'),
    ease: 'furnishOut',
    scale: true,
    absolute: true,
  });

  gsap.fromTo(
    lightboxBg,
    { opacity: 0 },
    { opacity: 1, duration: getDurationSec('quick'), ease: 'furnishOut' },
  );

  if (captionEl) {
    gsap.fromTo(
      captionEl,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: getDurationSec('base'),
        ease: 'furnishOut',
        delay: getDurationSec('base'),
      },
    );
  }
}

export async function closeLightbox(
  targets: LightboxTargets,
  cardSlotEl: HTMLElement,
  prefersReducedMotion: boolean,
): Promise<void> {
  const { cardImg, lightboxBg, captionEl } = targets;
  const gsap = await getGsap();
  const { Flip } = await import('gsap/Flip');

  if (prefersReducedMotion) {
    cardSlotEl.appendChild(cardImg);
    gsap.set(lightboxBg, { opacity: 0 });
    if (captionEl) gsap.set(captionEl, { opacity: 0 });
    return;
  }

  /* Caption fades first. */
  if (captionEl) {
    await gsap.to(captionEl, {
      opacity: 0,
      duration: getDurationSec('quick'),
      ease: 'furnishOut',
    });
  }

  /* Capture lightbox-position state, move back to card slot,
     animate from old to new. */
  const state = Flip.getState(cardImg);
  cardSlotEl.appendChild(cardImg);

  Flip.from(state, {
    duration: getDurationSec('base'),
    ease: 'furnishOut',
    scale: true,
    absolute: true,
  });

  await gsap.to(lightboxBg, {
    opacity: 0,
    duration: getDurationSec('base'),
    ease: 'furnishOut',
  });
}
