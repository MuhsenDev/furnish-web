'use client';

/*
  Gallery lightbox per Document 6 Section 5.

  Open: source tile rect is captured by GalleryTile and passed up.
  This component renders an overlay with the image at fullscreen
  position; on mount it animates from the source rect to the
  fullscreen position via gsap.fromTo (no DOM moves, React-safe).

  Close: reverse animation, then unmount.

  Style cycling within the lightbox swaps images with a 300ms
  crossfade. URL fragment updates so direct linking works
  (/gallery#living-scandinavian-01).

  4 close paths: X button, Escape key, click backdrop, mobile back.
  Focus trap while open.

  Reduced motion: instant show/hide, no Flip animation, no crossfade.
*/

import * as React from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  type GalleryImage,
  ROOM_LABELS,
  STYLE_LABELS,
} from '@/data/gallery';
import { getGsap, useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface GalleryLightboxProps {
  open: boolean;
  image: GalleryImage | null;
  /** All curated images for this room so the lightbox can cycle. */
  roomImages: GalleryImage[];
  /** Bounding rect of the source tile image at open time. */
  sourceRect: DOMRect | null;
  onClose: () => void;
  onNavigate: (nextImage: GalleryImage) => void;
}

export function GalleryLightbox({
  open,
  image,
  roomImages,
  sourceRect,
  onClose,
  onNavigate,
}: GalleryLightboxProps) {
  const imageRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const prefersReduced = useReducedMotion();

  /* Animate-in. Captures the source rect and tweens from that
     position to the fullscreen position. */
  React.useEffect(() => {
    if (!open || !image || !imageRef.current || !backdropRef.current) return;

    let cancelled = false;

    if (prefersReduced) {
      /* Instant. Set final state directly. */
      backdropRef.current.style.opacity = '1';
      imageRef.current.style.opacity = '1';
      imageRef.current.style.transform = 'none';
      closeBtnRef.current?.focus();
      return;
    }

    getGsap().then((gsap) => {
      if (cancelled || !imageRef.current || !backdropRef.current) return;

      /* Fade in backdrop. */
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'furnishOut' },
      );

      /* Animate image from source rect to current position. We
         compute the inverse transform: where the image is NOW
         (fullscreen), translated/scaled so it APPEARS at the
         source rect, then animate to identity. */
      if (sourceRect) {
        const targetRect = imageRef.current.getBoundingClientRect();
        const dx = sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
        const dy = sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);
        const scale = sourceRect.width / targetRect.width;

        gsap.fromTo(
          imageRef.current,
          {
            opacity: 1,
            x: dx,
            y: dy,
            scale,
            transformOrigin: 'center center',
          },
          {
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: 'furnishOut',
            onComplete: () => closeBtnRef.current?.focus(),
          },
        );
      } else {
        /* No source rect (rare). Plain fade-in. */
        gsap.fromTo(
          imageRef.current,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'furnishOut',
            onComplete: () => closeBtnRef.current?.focus(),
          },
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, image, sourceRect, prefersReduced]);

  /* Body scroll lock while open. */
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  /* Escape key closes. */
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [open, image, roomImages]);

  /* URL fragment update for direct linking. */
  React.useEffect(() => {
    if (!open || !image) return;
    const hash = `#${image.id}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
    }
    return () => {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
  }, [open, image]);

  if (!open || !image) return null;

  const currentIdx = roomImages.findIndex((img) => img.id === image.id);
  const total = roomImages.length;

  const prev = () => {
    if (total <= 1) return;
    const nextIdx = (currentIdx - 1 + total) % total;
    onNavigate(roomImages[nextIdx]);
  };

  const next = () => {
    if (total <= 1) return;
    const nextIdx = (currentIdx + 1) % total;
    onNavigate(roomImages[nextIdx]);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      onClick={handleBackdropClick}
      /* Backdrop = dark overlay + heavy frosted blur. Background
         color is set via inline style with literal RGBA rather
         than Tailwind's `bg-ink/80` opacity modifier — the modifier
         composes via color-mix() against a CSS-variable color, and
         on some GPUs / browsers the resulting backdrop rendered
         lighter than expected (Hassan saw the caption area as a
         near-cream wash even with bg-ink/80 deployed). Inline
         RGBA guarantees the literal alpha-blended color regardless
         of Tailwind's composition path. */
      className={cn(
        'fixed inset-0 z-[9100]',
        'flex items-center justify-center',
        'backdrop-blur-2xl',
        'p-4 sm:p-8',
      )}
      style={{
        opacity: 0,
        backgroundColor: 'rgba(43, 30, 24, 0.85)',
      }}
    >
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        aria-label={t('gallery', 'lightboxCloseAria')}
        className={cn(
          'absolute top-4 right-4 sm:top-6 sm:right-6',
          'inline-flex h-10 w-10 items-center justify-center',
          'rounded-full bg-cream/95 text-deep',
          'shadow-2',
          'hover:bg-cream',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
        )}
      >
        <X size={20} strokeWidth={1.75} />
      </button>

      <div className="flex w-full max-w-5xl flex-col items-center gap-6">
        <div
          ref={imageRef}
          className={cn(
            'relative w-full overflow-hidden rounded-[var(--radius)]',
            'aspect-[4/3] max-h-[80vh]',
            'shadow-3',
          )}
        >
          {image.filename ? (
            <Image
              key={image.id}
              src={image.filename}
              alt={image.altText}
              fill
              sizes="(min-width: 1024px) 80vw, 100vw"
              className="object-cover furnish-fade-in"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-beige text-muted">
              {t('gallery', 'tilePlaceholderCaption')}
            </div>
          )}
        </div>

        {/* Caption pill — self-contained dark container so the
            text is readable regardless of what the lightbox
            backdrop renders as on any given GPU/browser. The
            previous free-floating cream text against the (variably
            lit) backdrop was unreadable for Hassan despite a
            dark-overlay bump (the image's outer shadow + the
            backdrop-blur composition lightened the area below the
            image enough that cream text disappeared into it).
            Pill carries its own dark surface; cream text on it
            stays sharp regardless. */}
        <div
          className={cn(
            'rounded-sm',
            'px-6 py-4 sm:px-8 sm:py-5',
            'text-center max-w-2xl',
          )}
          style={{
            backgroundColor: 'rgba(43, 30, 24, 0.85)',
          }}
        >
          <p
            id="lightbox-title"
            className="text-body-xl font-semibold text-cream"
          >
            {ROOM_LABELS[image.roomType]} · {STYLE_LABELS[image.style]}
          </p>
          <p className="mt-2 text-body-m font-medium text-cream">
            {image.description}
          </p>
          <p className="mt-2 text-body-s text-cream/75">
            {t('gallery', 'lightboxDesignedIn')}
          </p>
        </div>

        {total > 1 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label={t('gallery', 'lightboxPrevAria')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full',
                'bg-cream/15 text-cream',
                'px-4 py-2 text-body-s font-semibold',
                'hover:bg-cream/25',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream',
              )}
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
              Previous
            </button>
            <span className="text-body-s text-cream/80">
              {currentIdx + 1} of {total}
            </span>
            <button
              type="button"
              onClick={next}
              aria-label={t('gallery', 'lightboxNextAria')}
              className={cn(
                'inline-flex items-center gap-2 rounded-full',
                'bg-cream/15 text-cream',
                'px-4 py-2 text-body-s font-semibold',
                'hover:bg-cream/25',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream',
              )}
            >
              Next
              <ChevronRight size={16} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
