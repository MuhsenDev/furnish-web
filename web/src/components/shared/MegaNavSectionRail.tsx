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
import { ChevronRight } from 'lucide-react';
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
              'group inline-flex w-fit items-center gap-4 text-left',
              'font-display tracking-display-tight leading-display-tight',
              /* display-l caps at 5rem (80px) so "Get Started"
                 doesn't crowd the rail-column edge. */
              'text-display-l',
              'transition-[color,transform,opacity] duration-300 ease-premium',
              isActive
                ? 'text-deep opacity-100 translate-x-2'
                : 'text-deep opacity-60 hover:opacity-100 hover:translate-x-1',
              'focus-visible:outline-none focus-visible:opacity-100',
            )}
          >
            <span>{section.label}</span>
            {/* ChevronRight makes the "this is clickable" affordance
                explicit on labels that would otherwise read as
                display headings. Always visible (low opacity at
                rest, full opacity + bronze color on the active
                section, slides on hover). Replaces the floating
                bronze dot that was the active indicator before,
                the chevron does double duty: button affordance
                AND active marker. */}
            <ChevronRight
              size={32}
              strokeWidth={1.5}
              aria-hidden="true"
              className={cn(
                'shrink-0',
                'transition-[transform,opacity,color] duration-300 ease-premium',
                isActive
                  ? 'opacity-100 text-[var(--color-accent)] translate-x-1'
                  : 'opacity-40 text-deep group-hover:opacity-90 group-hover:translate-x-1',
              )}
            />
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
