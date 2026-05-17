'use client';

/*
  Right pane of the MegaNav overlay. Renders the active section's
  featured tile, card grid, and category pills.

  Critical pattern per spec §5.5 + §6.1: this component RE-RENDERS
  via AnimatePresence mode="wait" keyed on activeSection so the
  CONTENT cross-fades on section switch WITHOUT the overlay
  remounting. The orchestrator's outer AnimatePresence handles the
  overlay's mount/unmount. The inner one here handles the section
  cross-fade. Two distinct animations, two distinct AnimatePresence
  scopes. Don't merge them.

  Placeholder content for commit 3/5. Real surfaces (Featured tile,
  AppGrid, CategoryPills) wire in commit 4/5.
*/

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { navSectionById, type SectionId } from '@/data/nav-mega';

export interface MegaNavSectionContentProps {
  activeSection: SectionId;
}

/* Cross-fade timing: 150ms out, 200ms in, per spec §4.2. The
   incoming content also lifts 8px from below per spec §4.1
   step 4. */
const paneContent = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: [0.7, 0, 0.84, 0] },
  },
};

export function MegaNavSectionContent({
  activeSection,
}: MegaNavSectionContentProps) {
  const section = navSectionById[activeSection];

  return (
    <div className={cn('relative w-full')}>
      <AnimatePresence mode="wait">
        <motion.div
          key={section.id}
          variants={paneContent}
          initial="initial"
          animate="animate"
          exit="exit"
          className="space-y-8"
        >
          {/* Placeholder for the featured tile. Real component
              wires in commit 4/5. */}
          <div
            className={cn(
              'rounded-[var(--radius)] bg-surface',
              'border border-[var(--color-sage-hairline)]',
              'shadow-1',
              'p-6 sm:p-8',
            )}
          >
            <p className="eyebrow">{section.featured?.eyebrow ?? 'Section'}</p>
            <h2
              className={cn(
                'mt-3 font-display tracking-display-tight leading-display',
                'text-deep text-display-m',
              )}
            >
              {section.featured?.title ?? section.label}
            </h2>
            {section.featured?.description && (
              <p className="mt-3 text-body-l text-ink/85 leading-relaxed">
                {section.featured.description}
              </p>
            )}
            <p className="mt-6 text-body-s text-muted italic">
              [Featured tile + app grid + category pills land in
              commit 4/5. This is the structural cross-fade scaffold.]
            </p>
          </div>

          {/* Placeholder for the app grid. */}
          <div
            className={cn(
              'grid grid-cols-2 sm:grid-cols-3 gap-4',
            )}
          >
            {section.cards.map((card) => (
              <div
                key={card.id}
                className={cn(
                  'rounded-sm bg-surface',
                  'border border-[var(--color-sage-hairline)]',
                  'aspect-[4/3] p-4',
                  'flex flex-col justify-end',
                )}
              >
                <p className="text-body-s font-semibold text-deep">
                  {card.name}
                </p>
                <p className="mt-1 text-body-s text-muted">
                  {card.tag ?? ''}
                </p>
              </div>
            ))}
          </div>

          {/* Placeholder for category pills. */}
          {section.categories && section.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {section.categories.map((cat) => (
                <span
                  key={cat.label}
                  className={cn(
                    'inline-flex items-center rounded-full',
                    'border border-[var(--color-sage-hairline)]',
                    'px-3 py-1 text-body-s text-muted',
                  )}
                >
                  {cat.label}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
