/*
  Motion 10, form interactions per Document 3 Section 13.

  Mostly CSS (input focus styles, scaleX underlines, etc.) lives
  in tokens.css and hover.css. This file provides a tiny submit-
  button state machine for the email-waitlist form: idle, loading,
  success, error.

  Transitions are instant for the label text. Optional 200ms fade
  for the spinner icon to avoid harsh pop-in.
*/

import { getGsap } from './gsap-loader';
import { getDurationSec } from './durations';

export type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export interface SubmitButtonStateMachine {
  setState: (next: SubmitState) => Promise<void>;
  getState: () => SubmitState;
}

const LABELS: Record<SubmitState, string> = {
  idle: 'Submit',
  loading: 'Sending...',
  success: 'Sent',
  error: 'Try again',
};

export interface CreateSubmitButtonOptions {
  buttonEl: HTMLButtonElement;
  /** Optional spinner inside the button (display=none in idle). */
  spinnerEl?: HTMLElement | null;
  /** Optional checkmark inside the button (display=none in idle). */
  checkmarkEl?: HTMLElement | null;
  prefersReducedMotion?: boolean;
  labels?: Partial<Record<SubmitState, string>>;
}

export async function createSubmitButton(
  options: CreateSubmitButtonOptions,
): Promise<SubmitButtonStateMachine> {
  const {
    buttonEl,
    spinnerEl,
    checkmarkEl,
    prefersReducedMotion = false,
    labels: labelOverrides,
  } = options;

  const labels = { ...LABELS, ...labelOverrides };
  let state: SubmitState = 'idle';
  const gsap = await getGsap();

  const labelEl = buttonEl.querySelector('[data-submit-label]') as HTMLElement | null;
  const writeLabel = (s: SubmitState): void => {
    if (labelEl) labelEl.textContent = labels[s];
    else buttonEl.textContent = labels[s];
  };

  const fadeIn = async (el: HTMLElement | null | undefined): Promise<void> => {
    if (!el) return;
    el.style.display = 'inline-flex';
    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    await gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: getDurationSec('quick'), ease: 'furnishQuick' },
    );
  };

  const fadeOut = async (el: HTMLElement | null | undefined): Promise<void> => {
    if (!el) return;
    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 0 });
      el.style.display = 'none';
      return;
    }
    await gsap.to(el, {
      opacity: 0,
      duration: getDurationSec('quick'),
      ease: 'furnishQuick',
    });
    el.style.display = 'none';
  };

  const setState = async (next: SubmitState): Promise<void> => {
    if (next === state) return;
    state = next;
    writeLabel(next);

    /* Disable the button during loading so multiple submits do not
       fire. */
    buttonEl.disabled = next === 'loading';

    /* Spinner is visible only in loading. Checkmark is visible only
       in success and reverts on next state change. */
    if (next === 'loading') {
      await fadeOut(checkmarkEl);
      await fadeIn(spinnerEl);
    } else if (next === 'success') {
      await fadeOut(spinnerEl);
      await fadeIn(checkmarkEl);
    } else {
      await fadeOut(spinnerEl);
      await fadeOut(checkmarkEl);
    }
  };

  /* Initial paint. */
  writeLabel('idle');
  if (spinnerEl) spinnerEl.style.display = 'none';
  if (checkmarkEl) checkmarkEl.style.display = 'none';

  return {
    setState,
    getState: () => state,
  };
}
