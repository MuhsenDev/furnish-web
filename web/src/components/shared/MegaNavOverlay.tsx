'use client';

/*
  MegaNav overlay. Mounts when MegaNav.isOpen flips true and unmounts
  via the orchestrator's AnimatePresence. Renders:

    - Cream backdrop with a warm bronze radial halo (echoes the
      hero gradient + the FinalCTA halo so the overlay reads as
      part of the page's chromatic system, not a separate panel).
    - Left rail (MegaNavSectionRail): 4 oversized section labels.
    - Right pane (MegaNavSectionContent): cross-fades on
      activeSection change without remounting the overlay.
    - Close button (MegaNavCloseButton): top-right, auto-focused
      on open per WAI-ARIA dialog pattern.

  Layout: 2-column grid on lg+. Single column on mobile with rail
  stacked above content.

  Z-index: 90, below the topbar's z-100. Topbar stays visible above
  the overlay so the Waitlist pill remains reachable + the section
  triggers can also switch sections from the topbar. Overlay's
  top inset matches topbar height so its content doesn't sit under
  the chrome.

  Focus trap (spec §4.5):
    - Tab from the last focusable element wraps to the first.
    - Shift+Tab from the first wraps to the last.
    - On open, focus moves to the close button.
    - On close (handled by orchestrator), focus restores to the
      trigger that opened the overlay.

  prefers-reduced-motion: the global @media rule in globals.css
  zeroes all transition/animation durations, so the Framer Motion
  variants degrade to instant fades automatically.
*/

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Container } from '@/components/Container';
import { MegaNavCloseButton } from './MegaNavCloseButton';
import { MegaNavSectionRail } from './MegaNavSectionRail';
import { MegaNavSectionContent } from './MegaNavSectionContent';
import type { SectionId } from '@/data/nav-mega';

export interface MegaNavOverlayProps {
  activeSection: SectionId;
  onClose: () => void;
  onSwitch: (section: SectionId) => void;
}

/* Backdrop animation: opacity 0 -> 1 in 200ms ease-out per spec
   §4.1 step 1. Backdrop-blur ramps in CSS (we use a static blur
   value since blur-on-mount animation is GPU-expensive on
   low-end devices). */
const backdrop = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: [0.7, 0, 0.84, 0] },
  },
};

export function MegaNavOverlay({
  activeSection,
  onClose,
  onSwitch,
}: MegaNavOverlayProps) {
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  /* Auto-focus the close button on mount. Spec §4.5 + WAI-ARIA
     dialog pattern: focus moves to the close button (or first
     interactive element) when the dialog opens. */
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(id);
  }, []);

  /* Focus trap. Tab cycles through focusable elements within the
     overlay; Tab from last -> first, Shift+Tab from first -> last.
     The trap reads the DOM each Tab press so it picks up
     dynamically rendered cards. */
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (!overlayRef.current) return;
      const focusable = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
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
  }, []);

  return (
    <motion.div
      ref={overlayRef}
      id="mega-nav-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Main navigation"
      variants={backdrop}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        /* Fixed, full-viewport BELOW the topbar (top-16 mobile,
           top-20 sm+). The topbar's z-100 sits above this. */
        'fixed inset-x-0 bottom-0 z-[90]',
        'top-16 sm:top-20',
        'overflow-y-auto',
        'bg-cream/97 backdrop-blur-md',
      )}
    >
      {/* Warm bronze radial halo behind the content. Echoes the
          hero gradient + FinalCTA halo so the page's chromatic
          recipe carries through the overlay surface. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(139, 111, 71, 0.08) 0%, rgba(139, 111, 71, 0.03) 40%, transparent 75%)',
        }}
      />

      <MegaNavCloseButton onClick={onClose} buttonRef={closeButtonRef} />

      <Container width="wide" className="relative">
        <div
          className={cn(
            'grid gap-10 lg:gap-16',
            'grid-cols-1 lg:grid-cols-[minmax(0,28%)_1fr]',
            'pt-section-y-tight pb-section-y',
          )}
        >
          <MegaNavSectionRail
            activeSection={activeSection}
            onSwitch={onSwitch}
          />
          <MegaNavSectionContent
            activeSection={activeSection}
            onClose={onClose}
          />
        </div>
      </Container>
    </motion.div>
  );
}
