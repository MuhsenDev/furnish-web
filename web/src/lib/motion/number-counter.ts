/*
  Motion 9, number counters per Document 3 Section 12.

  Used in the home-page comparison table to show "8 seconds" etc.
  counting up. Counter animates from 0 to target over 1.2 seconds
  with furnishInOut easing (mechanical precision).

  Optional formatter for currency, decimals, separators. Optional
  prefix and suffix strings.

  Reduced motion: skip the animation, set the final value
  immediately.
*/

import { getGsap } from './gsap-loader';
import { getDurationSec } from './durations';

export interface NumberCounterOptions {
  /** Total duration in seconds. Defaults to 'extended' (1.2s). */
  duration?: number;
  /** Custom formatter. Default: Math.round and toString. */
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  prefersReducedMotion?: boolean;
  /** Fire on viewport entry instead of immediately. Defaults true. */
  triggerOnView?: boolean;
}

export async function animateNumber(
  el: HTMLElement,
  target: number,
  options: NumberCounterOptions = {},
): Promise<void> {
  const {
    duration = getDurationSec('extended'),
    format = (n: number) => Math.round(n).toString(),
    prefix = '',
    suffix = '',
    prefersReducedMotion = false,
    triggerOnView = true,
  } = options;

  const writeValue = (n: number): void => {
    el.textContent = `${prefix}${format(n)}${suffix}`;
  };

  if (prefersReducedMotion) {
    writeValue(target);
    return;
  }

  const gsap = await getGsap();

  const runAnimation = (): void => {
    const obj = { value: 0 };
    gsap.to(obj, {
      value: target,
      duration,
      ease: 'furnishInOut',
      onUpdate: () => writeValue(obj.value),
      onComplete: () => writeValue(target),
    });
  };

  if (!triggerOnView) {
    runAnimation();
    return;
  }

  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: runAnimation,
  });

  /* Initial paint: write 0 (or the prefix/suffix wrapped 0) so the
     element doesn't briefly show the static target value before
     ScrollTrigger fires. */
  writeValue(0);
}
