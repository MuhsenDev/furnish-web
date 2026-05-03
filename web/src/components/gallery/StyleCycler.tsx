'use client';

/*
  Reusable style cycler per Document 6 Section 3.2.

  Four controls: previous arrow, counter, next arrow, shuffle.
  Counter format "3 of 4" reflects ACTUAL curated styles, not the
  10-style theoretical max. Empty styles are skipped by callers
  (the parent passes only populated styles).

  aria-live on the counter so screen readers announce style
  changes per Document 6 Section 9.

  Used inside GalleryTile (compact size) and GalleryLightbox
  (larger size) via the size prop.
*/

import * as React from 'react';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface StyleCyclerProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onShuffle?: () => void;
  /** Compact for tiles, lg for the lightbox. */
  size?: 'sm' | 'lg';
  /** Hide controls entirely when total <= 1 (no styles to cycle through). */
  hideWhenSingle?: boolean;
  className?: string;
}

export function StyleCycler({
  current,
  total,
  onPrev,
  onNext,
  onShuffle,
  size = 'sm',
  hideWhenSingle = true,
  className,
}: StyleCyclerProps) {
  if (hideWhenSingle && total <= 1) return null;

  const iconSize = size === 'sm' ? 16 : 20;
  const buttonClasses = cn(
    'inline-flex items-center justify-center rounded-full',
    'border border-[rgba(43,30,24,0.16)] bg-surface',
    'transition-colors duration-200 ease-premium',
    'hover:border-[rgba(43,30,24,0.32)] hover:bg-cream',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
    size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
  );

  const counterText = `${current + 1} of ${total}`;

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        size === 'sm' ? 'text-body-s' : 'text-body-m',
        className,
      )}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={total <= 1}
        aria-label={t('gallery', 'cyclerPrevAria')}
        className={buttonClasses}
      >
        <ChevronLeft size={iconSize} strokeWidth={1.75} />
      </button>

      <span
        aria-live="polite"
        className={cn(
          'min-w-[3.5rem] text-center font-semibold text-ink',
          size === 'sm' ? 'text-body-s' : 'text-body-m',
        )}
      >
        {counterText}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={total <= 1}
        aria-label={t('gallery', 'cyclerNextAria')}
        className={buttonClasses}
      >
        <ChevronRight size={iconSize} strokeWidth={1.75} />
      </button>

      {onShuffle && total > 2 && (
        <button
          type="button"
          onClick={onShuffle}
          aria-label={t('gallery', 'cyclerShuffleAria')}
          className={cn(buttonClasses, 'ml-1')}
        >
          <Shuffle size={iconSize} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
