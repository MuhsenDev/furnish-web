/*
  Motion 4, the compare slider per Document 3 Section 7.

  The "wow" moment of the site. Used 1-3 times per page maximum.
  Two images stacked at the same dimensions; the after-image is
  clipped via inset() based on slider position. A vertical drag
  handle in the middle.

  Interactions:
    - On viewport entry: auto-demo runs 50 to 80 to 50 over 1.6s
      (1.2s on mobile)
    - Press-and-drag (mouse or touch via pointer events): position
      tracks the cursor while the pointer is down AND has moved past
      a small threshold. Click without drag does nothing.
    - Keyboard: ArrowLeft/Right move 5%, PageDown/Up move 25%

  Click-to-jump was removed deliberately: it caused accidental snaps
  when users tapped the slider while scrolling. Drag is the only
  pointer affordance now.

  Reduced motion: no auto-demo. Drag still works (drag is interaction,
  not animation).
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

  const applyPosition = (percent: number, animate: boolean = false): void => {
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

  /* Press-and-drag. Pointer events unify mouse and touch so a single
     handler set covers both. Drag is armed on pointerdown anywhere
     in the container, but position only updates after the pointer
     moves past a 4px threshold. That keeps stationary clicks
     (including accidental taps while scrolling) from snapping the
     slider. */
  const DRAG_THRESHOLD_PX = 4;
  let pointerDownAt: { x: number; y: number; id: number } | null = null;

  const onPointerDown = (e: PointerEvent): void => {
    pointerDownAt = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!pointerDownAt) return;
    if (!isDragging) {
      const dx = Math.abs(e.clientX - pointerDownAt.x);
      const dy = Math.abs(e.clientY - pointerDownAt.y);
      if (dx + dy < DRAG_THRESHOLD_PX) return;
      isDragging = true;
      try {
        containerEl.setPointerCapture(e.pointerId);
      } catch {
        /* setPointerCapture can throw on some browsers if the pointer
           id is not currently active. Safe to ignore. */
      }
    }
    const rect = containerEl.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    applyPosition(percent, false);
  };

  const onPointerUp = (e: PointerEvent): void => {
    pointerDownAt = null;
    if (!isDragging) return;
    isDragging = false;
    if (containerEl.hasPointerCapture(e.pointerId)) {
      containerEl.releasePointerCapture(e.pointerId);
    }
  };

  containerEl.addEventListener('pointerdown', onPointerDown);
  containerEl.addEventListener('pointermove', onPointerMove);
  containerEl.addEventListener('pointerup', onPointerUp);
  containerEl.addEventListener('pointercancel', onPointerUp);

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
    containerEl.removeEventListener('pointerdown', onPointerDown);
    containerEl.removeEventListener('pointermove', onPointerMove);
    containerEl.removeEventListener('pointerup', onPointerUp);
    containerEl.removeEventListener('pointercancel', onPointerUp);
    handleEl.removeEventListener('keydown', onKeyDown);
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
