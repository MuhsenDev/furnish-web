'use client';

/*
  Featured tile per spec §3.4. Big editorial card at the top of each
  section's right pane. Two-column on lg+ (image left, copy right),
  stacked on mobile.

  Furnish adaptations:
    - Cream/surface card on the cream backdrop with a subtle
      lightness lift (matches the FinalCTA card pattern).
    - Sage-hairline border (matches site-wide divider treatment).
    - Bronze accent CTA (matches the brand primary action).
    - Special-case the WAITLIST_MODAL_HREF sentinel: renders as a
      <button> that closes the overlay + opens WaitlistModal,
      instead of as a route link.
*/

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { track } from '@/lib/analytics';
import type { NavFeatured, SectionId } from '@/data/nav-mega';
import { WAITLIST_MODAL_HREF } from '@/data/nav-mega';

export interface MegaNavFeaturedTileProps {
  sectionId: SectionId;
  featured: NavFeatured;
  /** Called when the visitor activates the tile so the overlay
      can close before navigation / modal open. */
  onActivate: () => void;
}

export function MegaNavFeaturedTile({
  sectionId,
  featured,
  onActivate,
}: MegaNavFeaturedTileProps) {
  const { open: openWaitlist } = useWaitlist();
  const isModal = featured.href === WAITLIST_MODAL_HREF;

  const handleActivate = () => {
    track('mega_nav_featured_click', { section: sectionId });
    onActivate();
    if (isModal) {
      openWaitlist();
    }
  };

  const bodyContent = (
    <div
      className={cn(
        'grid items-center gap-6 lg:gap-10',
        'grid-cols-1 lg:grid-cols-[1fr_1fr]',
      )}
    >
      {/* Image side. aspect-[4/3] mobile, taller-aspect lg+. */}
      <div
        className={cn(
          'relative overflow-hidden rounded-sm',
          'aspect-[4/3] lg:aspect-[5/4]',
          'bg-cream',
        )}
      >
        <Image
          src={featured.image}
          alt={featured.imageAlt}
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

      {/* Copy side. */}
      <div className="flex flex-col">
        <p className="eyebrow">{featured.eyebrow}</p>
        <h3
          className={cn(
            'mt-3 font-display tracking-display-tight leading-display',
            'text-deep text-display-m',
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
  );

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

  if (isModal) {
    return (
      <button type="button" onClick={handleActivate} className={wrapperClasses}>
        {bodyContent}
      </button>
    );
  }

  return (
    <Link href={featured.href} onClick={handleActivate} className={wrapperClasses}>
      {bodyContent}
    </Link>
  );
}
