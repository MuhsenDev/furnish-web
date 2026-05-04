/*
  Motion 2, the hero reveal per Document 3 Section 5.

  Once the loader completes (or immediately on subsequent loads),
  the hero content reveals in deliberate sequence:

    T=0ms      Hero image fades 0 to 1 over 800ms
    T=200ms    Eyebrow fades up over 400ms
    T=400ms    Headline line 1 slides up + fades over 600ms
    T=600ms    Headline line 2
    T=800ms    Headline line 3
    T=1200ms   Subhead fades up
    T=1400ms   Primary CTA fades + scales from 0.95
    T=1600ms   Secondary CTA (optional)
    T=2000ms   Sequence complete

  Mobile reduces stagger 200ms to 150ms and y-offset 30px to 20px.
*/

import { getGsap } from './gsap-loader';
import { getDurationSec, isMobile } from './durations';

export interface HeroTargets {
  /* Optional. Text-forward hero variants omit the image; the
     reveal still runs on the remaining targets. */
  imageEl?: HTMLElement | null;
  eyebrowEl: HTMLElement;
  headlineLines: HTMLElement[];
  subheadEl: HTMLElement;
  primaryCtaEl: HTMLElement;
  secondaryCtaEl?: HTMLElement | null;
}

export async function playHeroReveal(
  targets: HeroTargets,
  prefersReducedMotion: boolean,
): Promise<void> {
  const {
    imageEl,
    eyebrowEl,
    headlineLines,
    subheadEl,
    primaryCtaEl,
    secondaryCtaEl,
  } = targets;

  const gsap = await getGsap();

  if (prefersReducedMotion) {
    /* Show every element at final state. Filter out null secondaryCtaEl
       so gsap.set doesn't choke on undefined. */
    const allElements = [
      imageEl,
      eyebrowEl,
      ...headlineLines,
      subheadEl,
      primaryCtaEl,
      secondaryCtaEl,
    ].filter((el): el is HTMLElement => el != null);
    gsap.set(allElements, { opacity: 1, y: 0, scale: 1 });
    return;
  }

  const imageDur = getDurationSec('long');
  const eyebrowDur = getDurationSec('base');
  const lineDur = getDurationSec('medium');
  const subheadDur = getDurationSec('medium');
  const ctaDur = getDurationSec('base');

  const headlineYOffset = isMobile() ? 20 : 30;
  const headlineStagger = isMobile() ? 0.15 : 0.2;

  const tl = gsap.timeline();

  if (imageEl) {
    tl.fromTo(
      imageEl,
      { opacity: 0 },
      { opacity: 1, duration: imageDur, ease: 'furnishOut' },
      0,
    );
  }

  tl.fromTo(
    eyebrowEl,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: eyebrowDur, ease: 'furnishOut' },
    0.2,
  );

  tl.fromTo(
    headlineLines,
    { opacity: 0, y: headlineYOffset },
    {
      opacity: 1,
      y: 0,
      duration: lineDur,
      ease: 'furnishOut',
      stagger: headlineStagger,
    },
    0.4,
  );

  tl.fromTo(
    subheadEl,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: subheadDur, ease: 'furnishOut' },
    1.2,
  );

  tl.fromTo(
    primaryCtaEl,
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: ctaDur, ease: 'furnishOut' },
    1.4,
  );

  if (secondaryCtaEl) {
    tl.fromTo(
      secondaryCtaEl,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: ctaDur, ease: 'furnishOut' },
      1.6,
    );
  }

  await tl;
}
