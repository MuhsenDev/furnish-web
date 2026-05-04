'use client';

/*
  PortraitSection — dedicated home-page section for the 3D portrait,
  added between Hero and GalleryPreview.

  The portrait is the focal point. The section has a deep espresso
  background (`--color-deep`) so the portrait's cream-to-bronze
  gradient and aura plane glow against it. No competing copy by
  default; the silhouette stands alone.

  Cropping safety:
  - Section has no overflow:hidden. Mesh extents at any motion
    extreme stay inside the canvas.
  - Canvas wrapper is centered with explicit width and aspect ratio
    so the canvas always sizes to a portrait orientation regardless
    of container width.
  - Tested at: full-width desktop, 600px-narrow desktop, iOS Safari
    (canvas does NOT use 100vh; uses min-height + flex centering so
    iOS Safari's URL-bar viewport oddities don't crop the canvas).

  The HeroPortrait is dynamically imported with ssr:false because
  three.js touches `window` and a `<canvas>` on construction.
*/

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Container } from '@/components/Container';
import { cn } from '@/lib/utils';

const HeroPortrait = dynamic(
  () => import('./HeroPortrait').then((m) => m.HeroPortrait),
  {
    ssr: false,
    loading: () => (
      /* Cream-on-deep placeholder while the three.js chunk streams
         in. Sized to the canvas wrapper's aspect so layout doesn't
         jump on mount. */
      <div className="h-full w-full" aria-hidden="true" />
    ),
  },
);

export function PortraitSection() {
  return (
    <section
      aria-label="Furnish portrait"
      className={cn(
        /* Deep espresso background. No overflow:hidden anywhere on
           the way down to the canvas. */
        'relative bg-deep',
        /* Vertical breathing room. Always tall enough to feel like
           a dedicated section, never so tall that the portrait
           floats with too much space on short viewports. */
        'py-20 sm:py-24 lg:py-32',
        'min-h-[80vh] lg:min-h-[90vh]',
        'flex items-center justify-center',
      )}
    >
      <Container width="default" className="w-full">
        <div
          className={cn(
            /* Canvas wrapper: centered, capped at a comfortable
               max-width on desktop so the silhouette doesn't get
               oversized on ultrawide displays. Aspect ratio
               4:5 (portrait orientation) so the silhouette always
               has room above and below. */
            'mx-auto',
            'w-full max-w-[720px]',
            'aspect-[4/5]',
            'relative',
          )}
        >
          <HeroPortrait />
        </div>
      </Container>
    </section>
  );
}
