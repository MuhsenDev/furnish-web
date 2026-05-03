'use client';

import * as React from 'react';
import Image, { type StaticImageData } from 'next/image';
import { cn } from '@/lib/utils';

/*
  Treatment C from Document 2 Section 3.3: comparison split.
  STUB ONLY for Phase 1F. The full GSAP Flip implementation lives
  in Document 3 Section 7 with the auto-animate-on-viewport-entry
  choreography (50% to 80% to 50%).

  This stub renders a static side-by-side pair so layouts can use
  the component during Phase 1 development. It does NOT yet:
    1. Drag-to-reveal slider interaction
    2. Auto-animate on viewport entry
    3. Keyboard arrow-key fallback
    4. GSAP Flip transition between states

  When Document 3 lands, the stub gets the full slider implementation.
  The public prop signature stays compatible so callers do not break.

  Usage gating: only used in How It Works section and Sample Gallery
  page. 1-3 per page maximum.
*/

export interface CompareImageProps {
  before: {
    src: string | StaticImageData;
    alt: string;
  };
  after: {
    src: string | StaticImageData;
    alt: string;
  };
  /**
   * Defaults to 'aspect-[4/3]'. Pair must share the same ratio.
   */
  aspectClassName?: string;
  className?: string;
}

export function CompareImage({
  before,
  after,
  aspectClassName = 'aspect-[4/3]',
  className,
}: CompareImageProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2',
        className,
      )}
      data-component="compare-image-stub"
    >
      <figure
        className={cn(
          'relative w-full overflow-hidden rounded-[var(--radius)]',
          aspectClassName,
        )}
      >
        <Image
          src={before.src}
          alt={before.alt}
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          placeholder="blur"
          className="object-cover"
        />
        <figcaption className="absolute left-3 top-3 rounded-sm bg-ink/70 px-2 py-1 text-body-s font-semibold text-cream">
          Before
        </figcaption>
      </figure>
      <figure
        className={cn(
          'relative w-full overflow-hidden rounded-[var(--radius)]',
          aspectClassName,
        )}
      >
        <Image
          src={after.src}
          alt={after.alt}
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          placeholder="blur"
          className="object-cover"
        />
        <figcaption className="absolute left-3 top-3 rounded-sm bg-ink/70 px-2 py-1 text-body-s font-semibold text-cream">
          After
        </figcaption>
      </figure>
    </div>
  );
}
