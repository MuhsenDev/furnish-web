'use client';

/*
  Right pane of the MegaNav overlay. Renders the active section's
  featured tile + card grid + category pills.

  Critical pattern per spec §5.5 + §6.1: this component RE-RENDERS
  via AnimatePresence mode="wait" keyed on activeSection so the
  CONTENT cross-fades on section switch WITHOUT the overlay
  remounting. The orchestrator's outer AnimatePresence handles
  the overlay's mount/unmount. The inner one here handles the
  section cross-fade. Two distinct animation scopes. Do not merge.

  onClose is threaded down to each child surface so card clicks
  close the overlay before route navigation OR before opening
  the WaitlistModal (for the Get-Started section's featured
  tile that uses the WAITLIST_MODAL_HREF sentinel).
*/

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navSectionById, type SectionId } from '@/data/nav-mega';
import { MegaNavFeaturedTile } from './MegaNavFeaturedTile';
import { MegaNavAppGrid } from './MegaNavAppGrid';
import { MegaNavCategoryPills } from './MegaNavCategoryPills';
import { MegaNavCompareMini } from './MegaNavCompareMini';
import { EASE_IN, EASE_OUT } from './megaNavMotion';

export interface MegaNavSectionContentProps {
  activeSection: SectionId;
  onClose: () => void;
}

/* Cross-fade timing: 150ms out, 200ms in. Incoming content lifts
   8px from below. Eases imported from megaNavMotion. */
const paneContent = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: EASE_IN },
  },
};

export function MegaNavSectionContent({
  activeSection,
  onClose,
}: MegaNavSectionContentProps) {
  const section = navSectionById[activeSection];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section.id}
        variants={paneContent}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8 lg:space-y-10"
      >
        {section.featured && (
          <MegaNavFeaturedTile
            sectionId={section.id}
            featured={section.featured}
            onActivate={onClose}
            /* Compare section swaps the image slot for a mini
               version of the homepage value table so the visitor
               sees the actual punchline (30 seconds vs weeks,
               Free vs $2K+) right in the nav instead of a generic
               room photo. */
            media={
              section.id === 'compare' ? <MegaNavCompareMini /> : undefined
            }
          />
        )}

        {section.cards.length > 0 && (
          <MegaNavAppGrid
            sectionId={section.id}
            cards={section.cards}
            onActivate={onClose}
          />
        )}

        {section.categories && section.categories.length > 0 && (
          <MegaNavCategoryPills
            sectionId={section.id}
            categories={section.categories}
            onActivate={onClose}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
