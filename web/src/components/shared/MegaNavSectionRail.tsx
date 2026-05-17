'use client';

/*
  Left rail of the MegaNav overlay. Renders the 4 section labels
  as oversized display-font triggers stacked vertically.

  Per spec §3.4 + §4.1:
    - Display-font (Fraunces) section labels at display-l size.
    - Active section: bronze color + slight translate-x for the
      "you are here" cue (matches the closed-bar pattern).
    - Inactive sections: text-deep at opacity-60.
    - On open: stagger-fade-in from 8px below, 40ms between each
      label.

  Adaptations from ApeChain spec:
    - Bebas Neue display -> Fraunces serif. Same role (heavy
      display), different brand.
    - Warm gold accent -> bronze (--color-accent), with terracotta
      reserved for the position-shift cue on the active item.
*/

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { navSections, type SectionId } from '@/data/nav-mega';
import { EASE_IN, EASE_OUT } from './megaNavMotion';

export interface MegaNavSectionRailProps {
  activeSection: SectionId;
  onSwitch: (section: SectionId) => void;
}

/* Stagger config: 40ms between each, 250ms ease-out, total
   ~400ms entry. Eases imported from megaNavMotion. */
const railContainer = {
  hidden: { opacity: 1 },
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1 as const,
    },
  },
};

const railItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.18, ease: EASE_IN },
  },
};

export function MegaNavSectionRail({
  activeSection,
  onSwitch,
}: MegaNavSectionRailProps) {
  return (
    <motion.nav
      aria-label="Section selector"
      variants={railContainer}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'flex flex-col gap-3 lg:gap-5',
        'pt-2 lg:pt-0',
      )}
    >
      {navSections.map((section) => {
        const isActive = section.id === activeSection;
        return (
          <motion.button
            key={section.id}
            type="button"
            variants={railItem}
            onClick={() => onSwitch(section.id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group inline-flex w-fit items-baseline gap-3 text-left',
              'font-display tracking-display-tight leading-display-tight',
              /* Display-l (not display-xl at lg+) so the longest
                 section label ("Get Started", 11 chars) doesn't
                 risk crowding the rail-column edge at upper
                 viewport widths. display-l caps at 5rem / 80px
                 which keeps "Get Started" comfortably inside the
                 28% rail column at 1440px container. */
              'text-display-l',
              'transition-[color,transform,opacity] duration-300 ease-premium',
              isActive
                ? 'text-deep opacity-100 translate-x-2'
                : 'text-deep opacity-60 hover:opacity-90 hover:translate-x-1',
              'focus-visible:outline-none focus-visible:opacity-100',
            )}
          >
            <span>{section.label}</span>
            {isActive && (
              /* Active-section indicator: a small bronze dot that
                 mirrors the closed-bar terracotta dot from Surface
                 1. Bronze here (not terracotta) because the rail's
                 active state is the primary navigation state, and
                 bronze is the brand's primary accent. */
              <motion.span
                aria-hidden="true"
                layoutId="rail-active-dot"
                className={cn(
                  'inline-block h-2 w-2 rounded-full',
                  'bg-[var(--color-accent)]',
                  'translate-y-[-0.5em]',
                )}
                transition={{ duration: 0.3, ease: EASE_OUT }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
