'use client';

/*
  Card grid below the featured tile, per spec §3.4 + §4.4.

  Layout:
    - Mobile: 2 columns
    - Tablet (sm+): 2 columns
    - Desktop (lg+): 3 columns
    4-6 cards per section is the sweet spot (spec §2.4).

  Card structure (Furnish adaptation):
    - 4:3 image with overlay-darken on hover
    - Uppercase eyebrow tag
    - Display-font name (font-display, body-xl)
    - Body-s muted description
    - No CTA button on the card itself; the whole card is the
      click target. Spec §4.4 hover state.

  Hover treatment matches the GalleryPreview tile pattern from the
  Surface 2 polish pass: saturation lift + brightness +3% +
  shadow grow. No transform-scale on the image; the wrapper lifts
  1px instead.
*/

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { track } from '@/lib/analytics';
import type { NavCard, SectionId } from '@/data/nav-mega';
import { WAITLIST_MODAL_HREF } from '@/data/nav-mega';

export interface MegaNavAppGridProps {
  sectionId: SectionId;
  cards: NavCard[];
  onActivate: () => void;
}

export function MegaNavAppGrid({
  sectionId,
  cards,
  onActivate,
}: MegaNavAppGridProps) {
  const { open: openWaitlist } = useWaitlist();

  return (
    <div
      className={cn(
        'grid gap-4 sm:gap-5 lg:gap-6',
        'grid-cols-2 lg:grid-cols-3',
      )}
    >
      {cards.map((card) => {
        const isModal = card.href === WAITLIST_MODAL_HREF;
        const onClick = () => {
          track('mega_nav_card_click', {
            section: sectionId,
            card: card.id,
          });
          onActivate();
          if (isModal) openWaitlist();
        };

        const inner = (
          <>
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
          </>
        );

        const wrapperClasses = cn(
          'group block text-left',
          'transition-transform duration-300 ease-premium',
          'hover:-translate-y-px',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
          'focus-visible:ring-offset-cream rounded-sm',
        );

        if (isModal) {
          return (
            <button
              key={card.id}
              type="button"
              onClick={onClick}
              className={wrapperClasses}
            >
              {inner}
            </button>
          );
        }

        return (
          <Link
            key={card.id}
            href={card.href}
            onClick={onClick}
            className={wrapperClasses}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
