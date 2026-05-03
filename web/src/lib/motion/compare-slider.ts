/*
  Motion 4, the compare slider per Document 3 Section 7.

  The "wow" moment of the site. Used 1-3 times per page maximum.
  Two images stacked at the same dimensions; the after-image is
  clipped via inset() based on slider position. A vertical drag
  handle in the middle.

  Interactions:
    - On viewport entry: auto-demo runs 50 to 80 to 50 over 1.6s
      (1.2s on mobile)
    - Drag (mouse or touch via pointer events): handle follows
      cursor 1:1, no easing
    - Click anywhere on container: handle tweens to click position
    - Keyboard: ArrowLeft/Right move 5%, PageDown/Up move 25%

  Reduced motion: no auto-demo, no smooth tween on click. Drag
  still works (drag is interaction, not animation).
*/

import { getGsap } from './gsap-loader';
import { getDurationSec } from './durations';

export interface CompareSliderInstance {
  /** Set the slider position (0 to 100). Pass animate=true for a tween. */
  setPosition: (percent: number, animate?: boolean) => void;
  /** Read the current position. */
  getPosition: () => number;
  /** Tear down all event listeners and ScrollTriggers. */
  destroy: () => void;
}

export interface CompareSliderOptions {
  initialPosition?: number;
  /** Run the 50-to-80-to-50 demo on viewport entry. */
  autoDemo?: boolean;
  prefersReducedMotion?: boolean;
}

export async function createCompareSlider(
  containerEl: HTMLElement,
  beforeImg: HTMLImageElement,
  afterImg: HTMLImageElement,
  handleEl: HTMLElement,
  options: CompareSliderOptions = {},
): Promise<CompareSliderInstance> {
  const gsap = await getGsap();
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');

  const {
    initialPosition = 50,
    autoDemo = true,
    prefersReducedMotion = false,
  } = options;

  let position = initialPosition;
  let isDragging = false;
  let scrollTriggerInstance: ScrollTrigger | null = null;

  const clamp = (p: number): number => Math.max(0, Math.min(100, p));

  const applyPosition = (percent: number, animate: boolean): void => {
    const clamped = clamp(percent);
    position = clamped;
    handleEl.setAttribute('aria-valuenow', String(Math.round(clamped)));

    if (animate && !prefersReducedMotion) {
      gsap.to(afterImg, {
        clipPath: `inset(0 ${100 - clamped}% 0 0)`,
        duration: getDurationSec('base'),
        ease: 'furnishOut',
      });
      gsap.to(handleEl, {
        left: `${clamped}%`,
        duration: getDurationSec('base'),
        ease: 'furnishOut',
      });
    } else {
      afterImg.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
      handleEl.style.left = `${clamped}%`;
    }
  };

  /* Initial paint, no animation. */
  applyPosition(initialPosition, false);

  /* Pointer-event drag. Pointer events unify mouse and touch so we
     don't need separate handlers. */
  const onPointerDown = (e: PointerEvent): void => {
    isDragging = true;
    handleEl.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!isDragging) return;
    const rect = containerEl.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    applyPosition(percent, false);
  };

  const onPointerUp = (e: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;
    if (handleEl.hasPointerCapture(e.pointerId)) {
      handleEl.releasePointerCapture(e.pointerId);
    }
  };

  handleEl.addEventListener('pointerdown', onPointerDown);
  handleEl.addEventListener('pointermove', onPointerMove);
  handleEl.addEventListener('pointerup', onPointerUp);
  handleEl.addEventListener('pointercancel', onPointerUp);

  /* Click on container jumps the slider to the click x. Suppressed
     while a drag is in flight to avoid the post-drag click event. */
  const onContainerClick = (e: MouseEvent): void => {
    if (isDragging) return;
    /* If the click landed on the handle itself, ignore. The drag
       handler already owns those events. */
    if (e.target === handleEl || handleEl.contains(e.target as Node)) return;
    const rect = containerEl.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    applyPosition(percent, true);
  };

  containerEl.addEventListener('click', onContainerClick);

  /* Keyboard: arrows for fine, page-up/down for coarse. Only fires
     when the handle has focus. */
  const onKeyDown = (e: KeyboardEvent): void => {
    if (document.activeElement !== handleEl) return;
    let delta = 0;
    if (e.key === 'ArrowLeft') delta = -5;
    if (e.key === 'ArrowRight') delta = 5;
    if (e.key === 'PageDown') delta = -25;
    if (e.key === 'PageUp') delta = 25;
    if (e.key === 'Home') {
      e.preventDefault();
      applyPosition(0, true);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      applyPosition(100, true);
      return;
    }
    if (delta !== 0) {
      e.preventDefault();
      applyPosition(position + delta, true);
    }
  };

  handleEl.addEventListener('keydown', onKeyDown);

  /* Auto-demo on viewport entry. 50 to 80 to 50 over 1.6s desktop /
     1.2s mobile. Reveals the interaction without requiring user
     curiosity. */
  if (autoDemo && !prefersReducedMotion) {
    const phase1 = getDurationSec('long');
    const phase2 = getDurationSec('long');

    scrollTriggerInstance = ScrollTrigger.create({
      trigger: containerEl,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        const animObj = { pos: 50 };
        gsap
          .timeline()
          .to(animObj, {
            pos: 80,
            duration: phase1,
            ease: 'furnishOut',
            onUpdate: () => applyPosition(animObj.pos, false),
          })
          .to(animObj, {
            pos: 50,
            duration: phase2,
            ease: 'furnishInOut',
            onUpdate: () => applyPosition(animObj.pos, false),
            delay: 0.4,
          });
      },
    });
  }

  const destroy = (): void => {
    handleEl.removeEventListener('pointerdown', onPointerDown);
    handleEl.removeEventListener('pointermove', onPointerMove);
    handleEl.removeEventListener('pointerup', onPointerUp);
    handleEl.removeEventListener('pointercancel', onPointerUp);
    handleEl.removeEventListener('keydown', onKeyDown);
    containerEl.removeEventListener('click', onContainerClick);
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
  };

  return {
    setPosition: applyPosition,
    getPosition: () => position,
    destroy,
  };
}
