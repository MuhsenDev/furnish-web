'use client';

/*
  Card grid below the featured tile. 4-6 cards per section is the
  sweet spot. Modal-vs-link branching lives in
  MegaNavActionWrapper.

  Hover treatment matches the GalleryPreview tile pattern from
  the Surface 2 polish pass: saturation lift + brightness +3% +
  tinted sage ring on hover. No transform-scale on the image;
  the wrapper lifts 1px instead.
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
  'group block text-left',
  'transition-transform duration-300 ease-premium',
  'hover:-translate-y-px',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
  'focus-visible:ring-offset-cream rounded-sm',
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
          <div
            className={cn(
              'relative aspect-[4/3] w-full overflow-hidden',
              'rounded-sm bg-cream',
              'ring-1 ring-inset ring-transparent',
              'transition-[box-shadow,filter] duration-300 ease-premium',
              'group-hover:ring-[var(--color-sage-hairline)]',
            )}
          >
            <Image
              src={card.image}
              alt={card.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className={cn(
                'object-cover',
                'transition-[filter] duration-500 ease-premium',
                'group-hover:[filter:saturate(1.08)_brightness(1.03)]',
              )}
            />
          </div>
          <div className="mt-3">
            {card.tag && <p className="eyebrow text-[10px]">{card.tag}</p>}
            <p
              className={cn(
                'mt-1 font-display tracking-display-tight leading-tight',
                'text-body-xl text-deep',
              )}
            >
              {card.name}
            </p>
            <p className="mt-1 text-body-s text-ink/70 leading-relaxed">
              {card.description}
            </p>
          </div>
        </MegaNavActionWrapper>
      ))}
    </div>
  );
}
