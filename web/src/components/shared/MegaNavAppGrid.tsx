'use client';

/*
  Card grid below the featured tile. 4-6 cards per section is the
  sweet spot. Modal-vs-link branching lives in
  MegaNavActionWrapper.

  Each card is a discrete bordered container: image flush at top
  (rounded with the card), text in a padded section below. Earlier
  iteration had image + bare floating text with no boundary; the
  Learn section's mix of long + short blog titles made the cards
  look like fragments and read as if descriptions were bleeding
  into the next row's images. line-clamp + flex-col + h-full keep
  all cards in a row at the same height regardless of title
  length variance.
*/

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { MegaNavActionWrapper } from './MegaNavActionWrapper';
import type { NavCard, SectionId } from '@/data/nav-mega';

export interface MegaNavAppGridProps {
  sectionId: SectionId;
  cards: NavCard[];
  onActivate: () => void;
}

const cardClasses = cn(
  'group flex h-full flex-col text-left',
  'rounded-[var(--radius)] overflow-hidden',
  'bg-surface',
  'border border-[var(--color-sage-hairline)]',
  'shadow-1 hover:shadow-2',
  'transition-[box-shadow,transform] duration-300 ease-premium',
  'hover:-translate-y-px',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
  'focus-visible:ring-offset-cream',
);

export function MegaNavAppGrid({
  sectionId,
  cards,
  onActivate,
}: MegaNavAppGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:gap-5 lg:gap-6',
        'grid-cols-2 lg:grid-cols-3',
        /* items-stretch is grid's default but call it out: cards
           in the same row stretch to match the tallest card's
           height, so the bordered cards line up cleanly. */
        'items-stretch',
      )}
    >
      {cards.map((card) => (
        <MegaNavActionWrapper
          key={card.id}
          href={card.href}
          onActivate={() => {
            track('mega_nav_card_click', {
              section: sectionId,
              card: card.id,
            });
            onActivate();
          }}
          className={cardClasses}
        >
          {/* Image fills the top of the card edge-to-edge. The
              card's overflow-hidden clips the image to the card
              radius. No inner ring (the card's border replaces
              that affordance). Omitted entirely when card.image
              is undefined, in which case the text section below
              takes the full tile height with center-aligned copy
              so the card reads as deliberately text-only rather
              than as a missing image. */}
          {card.image && (
            <div
              className={cn(
                'relative aspect-[4/3] w-full overflow-hidden',
                'bg-cream',
              )}
            >
              <Image
                src={card.image}
                alt={card.name}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className={cn(
                  /* Default cover (fills + crops). Cards with portrait
                     subjects opt into contain (letterbox onto the
                     cream tile bg) by setting imageFit in nav-mega. */
                  card.imageFit === 'contain' ? 'object-contain' : 'object-cover',
                  'transition-[filter] duration-500 ease-premium',
                  'group-hover:[filter:saturate(1.08)_brightness(1.03)]',
                )}
              />
            </div>
          )}
          {/* Text section. flex-1 pushes the bottom against the
              card edge so cards with shorter text don't collapse
              vertically when their sibling has longer text.
              Text-only cards (no image) center their copy
              vertically and get extra padding so the tile reads
              as deliberate. */}
          <div
            className={cn(
              'flex flex-1 flex-col',
              card.image ? 'p-4' : 'justify-center p-5 sm:p-6',
            )}
          >
            {card.tag && <p className="eyebrow text-[10px]">{card.tag}</p>}
            <p
              className={cn(
                'mt-1 font-display tracking-display-tight leading-tight',
                /* body-l (was body-xl) so long blog titles fit in
                   2 lines more reliably across the grid widths. */
                'text-body-l text-deep',
                'line-clamp-2',
              )}
            >
              {card.name}
            </p>
            <p
              className={cn(
                'mt-1 text-body-s text-ink/70 leading-relaxed',
                'line-clamp-2',
              )}
            >
              {card.description}
            </p>
          </div>
        </MegaNavActionWrapper>
      ))}
    </div>
  );
}
