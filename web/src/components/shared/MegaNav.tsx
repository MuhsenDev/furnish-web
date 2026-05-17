'use client';

/*
  MegaNav orchestrator. Top-level component holding the entire
  mega-menu state machine + side effects. Pattern follows the
  2026-05-17 ApeChain-pattern build spec.

  State:
    - isOpen: boolean (is the overlay rendered)
    - activeSection: SectionId | null (which section's content
      shows in the right pane)

  Side effects (all guarded on isOpen):
    1. Body scroll lock using iOS-safe position:fixed + saved
       scrollY. The naive `overflow:hidden` approach is broken on
       iOS Safari per the spec §6.2.
    2. Esc-to-close global keydown handler.
    3. Focus restoration to the trigger element on close.

  This file owns the orchestration. It does NOT own any styling
  beyond a single AnimatePresence root. Closed-bar UI lives in
  MegaNavTopBar; overlay UI lives in MegaNavOverlay (next commit).

  Why a separate component instead of merging into MegaNavTopBar:
  the topbar should re-render on scroll-state changes without
  re-running scroll-lock effects, and the overlay needs to mount/
  unmount via AnimatePresence which the topbar shouldn't see.
*/

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { MegaNavTopBar } from './MegaNavTopBar';
import { MegaNavOverlay } from './MegaNavOverlay';
import { useScrollLock } from '@/lib/use-scroll-lock';
import type { SectionId } from '@/data/nav-mega';

export function MegaNav() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<SectionId | null>(
    null,
  );

  /* triggerRef holds the DOM element that opened the overlay so
     focus can be restored on close (WAI-ARIA dialog pattern). */
  const triggerRef = React.useRef<HTMLElement | null>(null);

  /* Public API the topbar + overlay use to drive state. */
  const handleOpen = React.useCallback(
    (section: SectionId, trigger?: HTMLElement | null) => {
      if (trigger) triggerRef.current = trigger;
      setActiveSection(section);
      setIsOpen(true);
    },
    [],
  );

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    /* Intentionally do NOT reset activeSection. Leaving the last
       opened section in state means:
        (a) the overlay's exit animation reads the section
            content from intact state (no flicker to placeholder
            mid-exit), and
        (b) a rapid reopen within 300ms doesn't race a deferred
            setActiveSection(null) that would yank the overlay
            shut just after the user opened it again. Original
            iteration used a setTimeout reset; removed.

       AnimatePresence guards on isOpen alone, so the overlay
       still mounts/unmounts correctly. */
    if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, []);

  const handleSwitchSection = React.useCallback((section: SectionId) => {
    setActiveSection(section);
  }, []);

  /* iOS-safe body scroll lock. Extracted to lib/use-scroll-lock
     so WaitlistModal (previously broken on iOS with naive
     overflow:hidden) shares the same implementation. */
  useScrollLock(isOpen);

  /* Esc-to-close. Spec §4.1 calls this non-negotiable. */
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  /* Safety net: auto-close on route change. Card/featured/pill
     clicks call onActivate (= handleClose) before navigation, but
     keyboard activation paths or future call sites could bypass
     that. useEffect([pathname]) only fires when pathname actually
     changes (React's bail-on-identical-deps), so the previous
     prevPathnameRef gate was redundant. */
  const pathname = usePathname();
  React.useEffect(() => {
    if (isOpen) handleClose();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [pathname]);

  return (
    <>
      <MegaNavTopBar
        isOpen={isOpen}
        activeSection={activeSection}
        onOpen={handleOpen}
        onClose={handleClose}
      />
      <AnimatePresence>
        {isOpen && activeSection && (
          <MegaNavOverlay
            activeSection={activeSection}
            onClose={handleClose}
            onSwitch={handleSwitchSection}
          />
        )}
      </AnimatePresence>
    </>
  );
}
