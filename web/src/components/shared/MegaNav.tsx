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
    /* Defer setActiveSection(null) so the section content has time
       to animate out via AnimatePresence before unmount. The overlay
       reads activeSection in its exit animation. */
    setTimeout(() => setActiveSection(null), 300);
    /* Restore focus to the element that opened the overlay. */
    if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, []);

  const handleSwitchSection = React.useCallback((section: SectionId) => {
    setActiveSection(section);
  }, []);

  /* Body scroll lock, iOS-safe.
     Naive `body { overflow: hidden }` is broken on iOS Safari
     (the page still scrolls when the user touches the body behind
     the modal). The position:fixed + negative top + saved scrollY
     pattern is the only reliable lock that survives iOS Safari's
     touch handling. */
  React.useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      /* Restore scroll position after the lock is released. */
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

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
     if a visitor uses keyboard navigation or a third-party tool
     bypasses the onClick, the overlay would otherwise persist
     onto the next page. Watching pathname catches that case. */
  const pathname = usePathname();
  const prevPathnameRef = React.useRef(pathname);
  React.useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      if (isOpen) handleClose();
    }
  }, [pathname, isOpen, handleClose]);

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
