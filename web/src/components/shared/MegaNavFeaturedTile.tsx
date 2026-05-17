'use client';

/*
  Featured tile. Big editorial card at the top of each section's
  right pane. Two-column on lg+ (image left, copy right), stacked
  on mobile.

  Modal-vs-link branching lives in MegaNavActionWrapper so the
  WAITLIST_MODAL_HREF sentinel + useWaitlist hookup don't live
  here.
*/

import * as React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { MegaNavActionWrapper } from './MegaNavActionWrapper';
import type { NavFeatured, SectionId } from '@/data/nav-mega';

export interface MegaNavFeaturedTileProps {
  sectionId: SectionId;
  featured: NavFeatured;
  /** Called when the visitor activates the tile so the overlay
      can close before navigation / modal open. */
  onActivate: () => void;
}

const wrapperClasses = cn(
  'group block w-full text-left',
  'rounded-[var(--radius)] bg-surface',
  'border border-[var(--color-sage-hairline)]',
  'shadow-1 hover:shadow-2',
  'transition-[box-shadow,transform] duration-300 ease-premium',
  'hover:-translate-y-px',
  'p-6 sm:p-8 lg:p-10',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
  'focus-visible:ring-offset-cream',
);

export function MegaNavFeaturedTile({
  sectionId,
  featured,
  onActivate,
}: MegaNavFeaturedTileProps) {
  const handleActivate = () => {
    track('mega_nav_featured_click', { section: sectionId });
    onActivate();
  };

  return (
    <MegaNavActionWrapper
      href={featured.href}
      onActivate={handleActivate}
      className={wrapperClasses}
    >
      <div
        className={cn(
          'grid items-center gap-6 lg:gap-10',
          /* Two-column when an image is present, single-column
             (copy spans full width) when omitted. The text-only
             variant lets editorial tiles like the founder story
             stand on copy alone. */
          'grid-cols-1',
          featured.image && 'lg:grid-cols-[1fr_1fr]',
        )}
      >
        {/* Image side. aspect-[4/3] mobile, taller-aspect lg+.
            Omitted entirely when featured.image is not provided. */}
        {featured.image && (
          <div
            className={cn(
              'relative overflow-hidden rounded-sm',
              'aspect-[4/3] lg:aspect-[5/4]',
              'bg-cream',
            )}
          >
            <Image
              src={featured.image}
              alt={featured.imageAlt ?? ''}
              fill
              sizes="(min-width: 1024px) 35vw, 100vw"
              className={cn(
                'object-cover',
                'transition-[filter,transform] duration-500 ease-premium',
                'group-hover:[filter:saturate(1.08)_brightness(1.03)]',
                'group-hover:scale-[1.02]',
              )}
            />
          </div>
        )}

        {/* Copy side. */}
        <div className="flex flex-col">
          <p className="eyebrow">{featured.eyebrow}</p>
          <h3
            className={cn(
              'mt-3 font-display tracking-display-tight leading-display',
              'text-deep',
              /* Graduated sizing: at mobile the copy column is
                 ~272px wide and display-m (32-56px) wraps long
                 titles to 4-5 lines. Step up the size as the
                 column widens. */
              'text-2xl sm:text-3xl lg:text-display-m',
            )}
          >
            {featured.title}
          </h3>
          <p className="mt-4 text-body-l text-ink/85 leading-relaxed">
            {featured.description}
          </p>
          <span
            className={cn(
              'mt-6 inline-flex items-center gap-2',
              'text-body-m font-semibold text-[var(--color-accent)]',
              'transition-[gap] duration-200 ease-premium',
              'group-hover:gap-3',
            )}
          >
            {featured.ctaLabel}
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </span>
        </div>
      </div>
    </MegaNavActionWrapper>
  );
}
