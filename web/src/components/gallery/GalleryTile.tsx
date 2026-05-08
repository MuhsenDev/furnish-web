'use client';

/*
  Individual gallery tile per Document 6 Section 4.

  Composition:
    Image (4:3 aspect)
    Room name (display font)
    Style label (sans, smaller, 80% opacity)
    "Designed in 8 seconds" micro-copy in accent color
    StyleCycler at the bottom

  Click on the IMAGE area opens the lightbox. Cycle controls do
  NOT propagate to lightbox open. Hover lift + slight scale per
  Document 3 §9.

  Image transition between styles: current fades out 200ms, new
  fades in 300ms. Implemented via key remount with CSS animation.
*/

import * as React from 'react';
import { useRef } from 'react';
import Image from 'next/image';
import { ImagePlus, Eye } from 'lucide-react';
import { Card, CardCaption } from '@/components/Card';
import { StyleCycler } from './StyleCycler';
import {
  type GalleryImage,
  ROOM_LABELS,
  STYLE_LABELS,
} from '@/data/gallery';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

/* CardCaption uses text-muted (#8A7760) for the meta line, which on
   a cream/beige background washes out, Hassan flagged the
   "Living Room / Contemporary" line as barely readable. We render
   the caption inline here instead so we can use text-ink/80 for the
   meta line, giving real contrast while still feeling subdued
   relative to the title. CardCaption stays unchanged for other
   surfaces that genuinely want a faint meta line. */

export interface GalleryTileProps {
  /** All curated images for this room. The cycler walks this array. */
  images: GalleryImage[];
  /** Index into images. The image at this index renders. */
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onOpen: (image: GalleryImage, sourceRect: DOMRect) => void;
  /** Disables the cycler when the parent has both filters active. */
  showCycler?: boolean;
  className?: string;
}

export function GalleryTile({
  images,
  currentIndex,
  onPrev,
  onNext,
  onShuffle,
  onOpen,
  showCycler = true,
  className,
}: GalleryTileProps) {
  const imageWrapperRef = useRef<HTMLButtonElement>(null);
  const total = images.length;
  const current = images[currentIndex];

  /* Defensive guard. If total is 0 (room with no curated entries
     yet), render a placeholder card so the grid still has 9 tiles. */
  if (total === 0 || !current) {
    return (
      <Card variant="image" interactive={false} className={cn('flex flex-col', className)}>
        <div
          className={cn(
            'relative flex aspect-[4/3] w-full items-center justify-center',
            'overflow-hidden rounded-sm bg-beige',
          )}
        >
          <ImagePlus size={32} strokeWidth={1.5} className="text-muted" />
        </div>
        <CardCaption
          title={ROOM_LABELS.living}
          meta={t('gallery', 'tilePlaceholderCaption')}
        />
      </Card>
    );
  }

  const handleImageClick = () => {
    if (!imageWrapperRef.current) return;
    onOpen(current, imageWrapperRef.current.getBoundingClientRect());
  };

  return (
    <Card
      variant="image"
      interactive
      className={cn('flex flex-col gallery-card', className)}
    >
      <button
        ref={imageWrapperRef}
        type="button"
        onClick={handleImageClick}
        className={cn(
          'relative aspect-[4/3] w-full overflow-hidden rounded-sm',
          'group/image cursor-zoom-in',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
        )}
        aria-label={`${ROOM_LABELS[current.roomType]}, ${STYLE_LABELS[current.style]}, ${t('gallery', 'tileViewLargerHint')}`}
      >
        {current.filename ? (
          <Image
            key={current.id}
            src={current.filename}
            alt={current.altText}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              'object-cover',
              'transition-[opacity,transform] duration-300 ease-premium',
              'group-hover/image:scale-[1.02]',
              /* Fade keyframe on each style swap. The key on Image
                 triggers remount, so this animation re-plays on
                 every cycle/shuffle. Class defined in globals.css. */
              'furnish-fade-in',
            )}
            data-tile-image
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-beige">
            <ImagePlus size={32} strokeWidth={1.5} className="text-muted" />
          </div>
        )}

        {/* Hover hint, desktop only via gallery-card-label class */}
        <span
          className={cn(
            'gallery-card-label',
            'flex items-center gap-2',
          )}
        >
          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
          {t('gallery', 'tileViewLargerHint')}
        </span>
      </button>

      <div className="px-1 pt-3 pb-1">
        <p className="text-body-l font-semibold leading-tight text-deep">
          {ROOM_LABELS[current.roomType]}
        </p>
        <p className="mt-1 text-body-s leading-caption text-ink/80">
          {STYLE_LABELS[current.style]}
        </p>
      </div>

      <p className="mt-1 px-1 text-body-s font-semibold text-[var(--color-accent)]">
        {t('gallery', 'tileDesignedIn')}
      </p>

      {showCycler && total > 1 && (
        <div className="mt-3 px-1">
          <StyleCycler
            current={currentIndex}
            total={total}
            onPrev={onPrev}
            onNext={onNext}
            onShuffle={onShuffle}
            size="sm"
          />
        </div>
      )}
    </Card>
  );
}
