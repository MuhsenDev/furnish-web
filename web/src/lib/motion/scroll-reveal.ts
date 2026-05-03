/*
  Motion 3, scroll-triggered section reveals per Document 3 Section 6.

  The most-used animation on the site. Every major section reveals
  as it enters the viewport.

    Default: opacity 0, y +40px, 600ms duration, 100ms stagger,
             trigger at "top 75%", once: true.

    Hero-tier (1-2x per page): y +60px, 800ms, 150ms stagger.

  Mobile (under 768px): yOffset 24px, 450ms duration, 75ms stagger,
  trigger at "top 85%" so reveals fire earlier.

  ScrollTrigger fires once by default. Animation does NOT reverse
  on scroll-out.
*/

import { getGsap } from './gsap-loader';
import { getDurationSec, isMobile } from './durations';

export interface ScrollRevealOptions {
  /**
   * CSS selector for child elements to animate. Defaults to
   * '[data-reveal]'.
   */
  childSelector?: string;
  /**
   * Initial y-offset in pixels. Mobile auto-reduces to 60% of this.
   * Defaults to 40 desktop / 24 mobile.
   */
  yOffset?: number;
  /**
   * Duration in seconds. Defaults to 0.6 desktop / 0.45 mobile.
   * Pass an explicit value to override the token-based default.
   */
  duration?: number;
  /**
   * Stagger between children in seconds. Defaults to 0.1 desktop /
   * 0.075 mobile.
   */
  stagger?: number;
  /**
   * GSAP ease name. Defaults to 'furnishOut'. See eases.ts.
   */
  ease?: string;
  /**
   * ScrollTrigger start position. Defaults to 'top 75%' desktop /
   * 'top 85%' mobile.
   */
  triggerStart?: string;
  /**
   * Whether to run the auto-show fallback for sections already in
   * viewport on initial paint. Defaults true. Set false to keep
   * the offset state until first scroll.
   */
  showImmediatelyIfInView?: boolean;
}

export async function setupScrollReveal(
  containerEl: HTMLElement,
  options: ScrollRevealOptions = {},
  prefersReducedMotion = false,
): Promise<() => void> {
  const gsap = await getGsap();
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');

  const mobile = isMobile();

  const {
    childSelector = '[data-reveal]',
    yOffset = mobile ? 24 : 40,
    duration = getDurationSec(mobile ? 'base' : 'medium'),
    stagger = mobile ? 0.075 : 0.1,
    ease = 'furnishOut',
    triggerStart = mobile ? 'top 85%' : 'top 75%',
    showImmediatelyIfInView = true,
  } = options;

  const children = Array.from(
    containerEl.querySelectorAll<HTMLElement>(childSelector),
  );

  if (children.length === 0) {
    /* Nothing to animate. Return a no-op cleanup. */
    return () => {};
  }

  if (prefersReducedMotion) {
    /* Show all children at final state immediately. No ScrollTrigger
       registered, no animation, no cleanup needed. */
    gsap.set(children, { opacity: 1, y: 0 });
    return () => {};
  }

  /* Set initial offset state. Inline style writes happen before the
     ScrollTrigger registers so the first paint after JS hydration
     shows the offset state, not a flash of the final state. */
  gsap.set(children, { opacity: 0, y: yOffset });

  /* Edge case: section already in viewport on initial paint. Without
     this, the reveal never fires because ScrollTrigger only fires on
     scroll-into-view events. Show immediately at final state. */
  if (showImmediatelyIfInView) {
    const rect = containerEl.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const triggerLine = viewportH * (mobile ? 0.85 : 0.75);
    if (rect.top <= triggerLine) {
      gsap.to(children, {
        opacity: 1,
        y: 0,
        duration,
        ease,
        stagger,
      });
      return () => {};
    }
  }

  const trigger = ScrollTrigger.create({
    trigger: containerEl,
    start: triggerStart,
    once: true,
    onEnter: () => {
      gsap.to(children, {
        opacity: 1,
        y: 0,
        duration,
        ease,
        stagger,
      });
    },
  });

  return () => {
    trigger.kill();
  };
}
