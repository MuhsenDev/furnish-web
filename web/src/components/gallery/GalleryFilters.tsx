'use client';

/*
  Gallery filter system per Document 6 §3.7.

  Redesigned 2026-05-05 per Hassan's feedback that the previous
  rounded-pill stack "looked odd". The previous design had two rows
  of bulky filled pills (rounded-full, px-5 py-2.5, accent fill on
  active) which felt like form chrome rather than editorial filters.

  New layout:
    - Each row leads with an eyebrow-style category label ("Room" /
      "Style") so the user can see at a glance what each row filters.
    - Chips are low-chrome: text-only at rest, subtle accent tint
      (accent-color text + 8% accent background) when active. Tighter
      padding (px-3 py-1.5) and rounded-sm corners instead of the
      former rounded-full.
    - Mobile: still horizontal-scroll. Desktop: wraps. Eyebrow stacks
      above the chip rail on small screens to save horizontal space.
    - Sticky-to-top behavior unchanged so the user can refilter from
      anywhere on the page.
*/

import * as React from 'react';
import { X } from 'lucide-react';
import { Container } from '@/components/Container';
import {
  ALL_ROOMS,
  ROOM_LABELS,
  STYLE_LABELS,
  type RoomType,
  type Style,
} from '@/data/gallery';
import { allCuratedStyles } from '@/lib/gallery-utils';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';

export interface GalleryFiltersProps {
  selectedRoom: RoomType | null;
  selectedStyle: Style | null;
  onRoomChange: (room: RoomType | null) => void;
  onStyleChange: (style: Style | null) => void;
  onClear: () => void;
}

const chipBase = cn(
  'shrink-0 inline-flex items-center justify-center',
  'rounded-sm px-3.5 py-2 text-body-s font-semibold',
  /* Every chip carries a 1px border so it reads as a real button
     at rest, not as flat text. The previous low-chrome version
     dropped the border entirely and Hassan said the labels read
     as plain text, adding a visible boundary back. */
  'border',
  'transition-colors duration-200 ease-premium',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
);

const chipActive = cn(
  /* Active = filled accent button. Strong contrast vs inactive
     so the current selection is unambiguous. */
  'border-[var(--color-accent)]',
  'bg-[var(--color-accent)]',
  'text-cream',
);

const chipInactive = cn(
  /* Inactive = outlined surface button. Cream/surface fill +
     ink-tone border so each chip reads as a discrete clickable
     box. Hover deepens the border + adds a faint accent tint so
     the affordance is unmistakable. */
  'border-[rgba(43,30,24,0.20)]',
  'bg-surface',
  'text-ink',
  'hover:border-[var(--color-accent)]',
  'hover:bg-[var(--color-accent)]/[0.06]',
  'hover:text-deep',
);

interface FilterRowProps {
  eyebrow: string;
  ariaLabel: string;
  children: React.ReactNode;
}

/* One filter row = eyebrow label + horizontal chip rail. Stacks on
   mobile, lays out side-by-side on sm+ screens. */
function FilterRow({ eyebrow, ariaLabel, children }: FilterRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5',
        'sm:flex-row sm:items-center sm:gap-4',
      )}
    >
      <span
        className={cn(
          'eyebrow shrink-0 text-muted',
          'sm:min-w-[56px]',
        )}
      >
        {eyebrow}
      </span>
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn(
          'flex min-w-0 flex-1 gap-1 overflow-x-auto pb-0.5',
          'sm:flex-wrap sm:overflow-visible sm:pb-0',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function GalleryFilters({
  selectedRoom,
  selectedStyle,
  onRoomChange,
  onStyleChange,
  onClear,
}: GalleryFiltersProps) {
  const styles = React.useMemo(() => allCuratedStyles(), []);
  const hasActiveFilter = selectedRoom != null || selectedStyle != null;

  const handleRoomClick = (room: RoomType | null) => {
    onRoomChange(room);
    if (room) {
      track('gallery_filter_room_apply', { room });
    }
  };

  const handleStyleClick = (style: Style | null) => {
    onStyleChange(style);
    if (style) {
      track('gallery_filter_style_apply', { style });
    }
  };

  const handleClear = () => {
    onClear();
    track('gallery_filter_clear');
  };

  return (
    <div
      className={cn(
        'sticky top-16 z-20 sm:top-20',
        'border-b border-[rgba(43,30,24,0.08)]',
        'bg-cream/85 backdrop-blur-md',
        'py-4 sm:py-5',
      )}
    >
      <Container width="default">
        <div className="flex flex-col gap-3 sm:gap-3.5">
          <FilterRow
            eyebrow={t('gallery', 'filterRoomEyebrow')}
            ariaLabel={t('gallery', 'filterRoomLabel')}
          >
            <button
              type="button"
              onClick={() => handleRoomClick(null)}
              className={cn(
                chipBase,
                selectedRoom == null ? chipActive : chipInactive,
              )}
            >
              {t('gallery', 'filterAllRooms')}
            </button>
            {ALL_ROOMS.map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => handleRoomClick(room)}
                className={cn(
                  chipBase,
                  selectedRoom === room ? chipActive : chipInactive,
                )}
              >
                {ROOM_LABELS[room]}
              </button>
            ))}
          </FilterRow>

          <FilterRow
            eyebrow={t('gallery', 'filterStyleEyebrow')}
            ariaLabel={t('gallery', 'filterStyleLabel')}
          >
            <button
              type="button"
              onClick={() => handleStyleClick(null)}
              className={cn(
                chipBase,
                selectedStyle == null ? chipActive : chipInactive,
              )}
            >
              {t('gallery', 'filterAllStyles')}
            </button>
            {styles.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => handleStyleClick(style)}
                className={cn(
                  chipBase,
                  selectedStyle === style ? chipActive : chipInactive,
                )}
              >
                {STYLE_LABELS[style]}
              </button>
            ))}
          </FilterRow>

          {hasActiveFilter && (
            <div>
              <button
                type="button"
                onClick={handleClear}
                className={cn(
                  'inline-flex items-center gap-1.5',
                  'text-body-s font-semibold text-[var(--color-accent)]',
                  'hover:underline underline-offset-4',
                )}
              >
                <X size={14} strokeWidth={1.75} />
                {t('gallery', 'filterClear')}
              </button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
