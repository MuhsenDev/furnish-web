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
    - Chips are bordered button style: outlined surface fill at rest
      (so each label reads as a clickable box, not flat text), filled
      accent on active. Hassan iterated this in 2026-05.
    - Single-row horizontal scroll on every viewport. The rail no
      longer wraps to a second line on desktop (the 10-style chip set
      was orphaning the "Traditional" chip onto a second row); same
      scroll behavior on mobile + desktop.
    - When the rail overflows, a fade gradient + clickable chevron-
      right button appears on the right edge so users see there is
      more content to scroll. The chevron auto-hides at the end of
      the rail.
    - Sticky-to-top behavior unchanged so the user can refilter from
      anywhere on the page.
*/

import * as React from 'react';
import { X, ChevronRight } from 'lucide-react';
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
  /* Padding tightened from px-3.5 py-2 to px-3 py-1.5 so all 10
     style chips (longest is "Mid-century Modern") fit on a single
     line on a typical 1280px+ desktop viewport. The prior padding
     pushed total chip-row width past the default Container's
     ~1136px usable inner width, orphaning "Traditional" onto a
     second visible line (Hassan: "no 3 rows"). On narrower
     viewports the row still scrolls horizontally with the
     overflow chevron indicator. */
  'rounded-sm px-3 py-1.5 text-body-s font-semibold',
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

/* One filter row = eyebrow label + horizontal chip rail.

   Layout: stacks on mobile, lays out side-by-side on sm+ screens.

   Scrolling: the chip rail ALWAYS scrolls horizontally (no wrap on
   any viewport). Previously the rail wrapped to a second line on
   sm+ when the 10-style chip set didn't fit (Hassan flagged the
   "Traditional" chip on its own second row). Single-row scroll is
   uniform across mobile + desktop and keeps the filter bar one
   line tall.

   Affordance: when the rail overflows AND the user isn't already
   scrolled to the end, a fade gradient + clickable chevron appears
   on the right edge so it's obvious there are more chips off-screen
   (Hassan: "it doesn't look like there is multiple options to
   scroll from"). Click the chevron to scroll the rail by ~70 % of
   its visible width. The fade + chevron auto-hide once the user
   reaches the end. */
function FilterRow({ eyebrow, ariaLabel, children }: FilterRowProps) {
  const railRef = React.useRef<HTMLDivElement>(null);
  const [showRightAffordance, setShowRightAffordance] = React.useState(false);

  React.useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const update = () => {
      const canScroll = rail.scrollWidth > rail.clientWidth + 1;
      const atEnd =
        rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1;
      setShowRightAffordance(canScroll && !atEnd);
    };

    update();
    rail.addEventListener('scroll', update, { passive: true });

    /* ResizeObserver re-evaluates on viewport changes so the
       affordance correctly appears/disappears as the rail's width
       changes (window resize, orientation change). */
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(rail);

    return () => {
      rail.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, []);

  const handleScrollNext = () => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: rail.clientWidth * 0.7, behavior: 'smooth' });
  };

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
      <div className="relative min-w-0 flex-1">
        <div
          ref={railRef}
          role="group"
          aria-label={ariaLabel}
          className={cn(
            /* Always single-row + horizontal scroll. No flex-wrap
               on any breakpoint. */
            'flex gap-1 overflow-x-auto pb-0.5',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {children}
        </div>

        {showRightAffordance && (
          <>
            {/* Fade gradient on the right edge so chips visibly
                disappear into the bar rather than getting hard-
                cut at the container edge. Width 14 = ~56 px,
                enough to read as a fade without obscuring more
                than the trailing chip's last few characters. */}
            <div
              className={cn(
                'pointer-events-none absolute right-0 top-0 bottom-0 w-14',
                'bg-gradient-to-l from-cream via-cream/85 to-transparent',
              )}
              aria-hidden="true"
            />
            {/* Clickable next-arrow. Sits over the fade. Pill-shaped
                with the same surface treatment as inactive chips so
                it reads as part of the filter system. */}
            <button
              type="button"
              onClick={handleScrollNext}
              aria-label={t('gallery', 'filterScrollMoreAria')}
              className={cn(
                'absolute right-1 top-1/2 -translate-y-1/2',
                'inline-flex h-8 w-8 items-center justify-center',
                'rounded-full border border-[rgba(43,30,24,0.20)]',
                'bg-surface text-deep',
                'shadow-1',
                'hover:border-[var(--color-accent)]',
                'hover:bg-[var(--color-accent)] hover:text-cream',
                'transition-colors duration-200 ease-premium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
              )}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </>
        )}
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
      {/* Filter bar uses Container width="wide" (1440px) instead of
          "default" (1200px) so all 10 style chips fit on a single
          line on a typical desktop. With "default" the longest chip
          row needed ~1191 px while the inner content area was only
          ~1136 px, forcing "Traditional" to wrap to a 3rd visible
          row. The hero section above and the gallery grid below stay
          on their original Container widths. */}
      <Container width="wide">
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
