'use client';

/*
  Gallery filter system per Document 6 Section 3.7.

  Two filter rows: room type and style. Pills horizontal-scroll on
  mobile, wrap on desktop. Active filter has accent-color background
  with cream text. Inactive has page-bg with ink text + 1px subtle
  border.

  Combined filters yield a single image (handled in GalleryGrid via
  the filter state passed up).

  Reset button always visible when any filter is active.

  Mobile sticky-to-top so user can re-filter without scrolling back.
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

const pillBase = cn(
  'shrink-0 inline-flex items-center justify-center',
  'rounded-full px-4 py-2 text-body-s font-semibold',
  'transition-colors duration-200 ease-premium',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
);

const pillActive = cn(
  'bg-[var(--color-accent)] text-cream border border-[var(--color-accent)]',
);

const pillInactive = cn(
  'bg-surface text-ink',
  'border border-[rgba(43,30,24,0.16)]',
  'hover:border-[rgba(43,30,24,0.32)]',
);

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
        'border-b border-[rgba(43,30,24,0.06)]',
        'bg-cream/85 backdrop-blur-md',
        'py-4',
      )}
    >
      <Container width="default">
        {/* Room filter row */}
        <div
          aria-label={t('gallery', 'filterRoomLabel')}
          role="group"
          className={cn(
            'flex gap-2 overflow-x-auto pb-1',
            'sm:flex-wrap sm:overflow-visible',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          <button
            type="button"
            onClick={() => handleRoomClick(null)}
            className={cn(
              pillBase,
              selectedRoom == null ? pillActive : pillInactive,
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
                pillBase,
                selectedRoom === room ? pillActive : pillInactive,
              )}
            >
              {ROOM_LABELS[room]}
            </button>
          ))}
        </div>

        {/* Style filter row */}
        <div
          aria-label={t('gallery', 'filterStyleLabel')}
          role="group"
          className={cn(
            'mt-3 flex gap-2 overflow-x-auto pb-1',
            'sm:flex-wrap sm:overflow-visible',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          <button
            type="button"
            onClick={() => handleStyleClick(null)}
            className={cn(
              pillBase,
              selectedStyle == null ? pillActive : pillInactive,
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
                pillBase,
                selectedStyle === style ? pillActive : pillInactive,
              )}
            >
              {STYLE_LABELS[style]}
            </button>
          ))}
        </div>

        {hasActiveFilter && (
          <div className="mt-3">
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
      </Container>
    </div>
  );
}
