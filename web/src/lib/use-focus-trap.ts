'use client';

/*
  useFocusTrap — Tab/Shift+Tab cycle trap for dialog containers.

  When isActive is true, Tab from the last focusable element
  inside containerRef wraps to the first; Shift+Tab from the first
  wraps to the last. Required by WAI-ARIA's dialog pattern so
  keyboard users can't escape a modal that's stealing visual
  focus.

  The focusable list is re-queried on each Tab keystroke so that
  dynamically rendered children (cards loaded after mount, async
  content, etc.) get picked up. The early-return for non-Tab keys
  keeps the hot path cheap.

  Caller is responsible for moving focus INTO the container when
  the dialog opens (and restoring focus to the trigger on close).
  This hook only constrains Tab navigation while active.

  Usage:
    const dialogRef = React.useRef<HTMLDivElement>(null);
    useFocusTrap(dialogRef, isOpen);
    return <div ref={dialogRef} role="dialog">...</div>;
*/

import * as React from 'react';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>(
  containerRef: React.RefObject<T | null>,
  isActive: boolean,
): void {
  React.useEffect(() => {
    if (!isActive) return;
    if (typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, containerRef]);
}
