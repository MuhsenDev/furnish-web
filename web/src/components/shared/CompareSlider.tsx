'use client';

/*
  Compare slider React component per Document 3 Section 7.4.

  Wraps createCompareSlider() from @/lib/motion. Renders the markup
  (container, two stacked images, handle, before/after labels) and
  hands DOM refs to the imperative slider API.

  This is the FIRST production-ready React wrapper around a motion
  function. Other component wrappers follow the same pattern:
  render markup, pass refs to imperative API, useEffect cleanup.

  Usage:
    <CompareSlider
      before={{ src: '/before.jpg', alt: 'Empty living room' }}
      after={{ src: '/after.jpg', alt: 'Designed living room with mid-century furniture' }}
    />
*/

import * as React from 'react';
import Image from 'next/image';
import { useCompareSlider } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface CompareSliderImage {
  src: string;
  alt: string;
}

export interface CompareSliderProps {
  before: CompareSliderImage;
  after: CompareSliderImage;
  /** Initial slider position (0 to 100). Defaults to 50. */
  initialPosition?: number;
  /** Run the auto-demo on viewport entry. Defaults to true. */
  autoDemo?: boolean;
  /** Tailwind aspect ratio class. Defaults to 'aspect-video'. */
  aspectClassName?: string;
  className?: string;
}

export function CompareSlider({
  before,
  after,
  initialPosition = 50,
  autoDemo = true,
  aspectClassName = 'aspect-video',
  className,
}: CompareSliderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  /* Refs renamed to describe their RENDER ROLE rather than the
     content they hold, because the rendering swaps which image
     sits on top vs beneath relative to the motion library's API.

     The motion library applies the clipPath to whatever ref is
     passed as `afterImgRef`. Originally that meant the AFTER image
     was clipped on top, with BEFORE underneath full-bleed, which
     made the LEFT half of the slider show AFTER and the RIGHT
     half show BEFORE at position=50. That was reversed from what
     the corner labels promise ("Before" on left, "After" on
     right).

     Fix: put BEFORE on top getting clipped, AFTER beneath full-
     bleed. So we map:
       motion-lib `beforeImgRef` (un-clipped, full-bleed) -> our
         AFTER content image (`bgImageRef` here)
       motion-lib `afterImgRef` (clipped, on top) -> our BEFORE
         content image (`clipImageRef` here)

     End result at position=50:
       LEFT 50% of frame: BEFORE content visible (top BEFORE not
         clipped on the left; left half of clipped image shows)
       RIGHT 50% of frame: AFTER content visible (top BEFORE clipped
         from right; full-bleed AFTER shows through)
     Matches the corner labels. */
  const bgImageRef = React.useRef<HTMLImageElement>(null);
  const clipImageRef = React.useRef<HTMLImageElement>(null);
  const handleRef = React.useRef<HTMLDivElement>(null);

  useCompareSlider(
    {
      containerRef,
      beforeImgRef: bgImageRef,
      afterImgRef: clipImageRef,
      handleRef,
    },
    {
      initialPosition,
      autoDemo,
    },
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-[var(--radius)] cursor-ew-resize',
        /* `touch-pan-y` lets the browser handle vertical page scrolls
           but releases horizontal touch gestures to the slider's
           pointer listeners. Without it, mobile browsers can
           interpret a horizontal drag on the slider as a page-pan
           and steal the gesture, making the handle feel unresponsive
           or "missing" most touches. */
        'touch-pan-y',
        aspectClassName,
        className,
      )}
    >
      {/* AFTER image, full bleed beneath. The right side of the
          slider always shows this. */}
      <Image
        ref={bgImageRef}
        src={after.src}
        alt={after.alt}
        fill
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover"
        priority
      />

      {/* BEFORE image, on top, clipped by inset() based on slider
          position. The left side of the slider reveals this.
          Initial inline style is overwritten by the motion library
          on mount. */}
      <Image
        ref={clipImageRef}
        src={before.src}
        alt={before.alt}
        fill
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - initialPosition}% 0 0)` }}
        priority
      />

      {/* Vertical drag handle.

          Two layers:
          (1) The 1-px-wide cream divider line spanning top to
              bottom, pure visual, doesn't widen the hit area.
          (2) An inner pill at the center, visible round chip with
              the chevron icon. Sized large enough on mobile to
              meet WCAG / Apple HIG tap-target minimums (44 pt =
              ~64 px after device pixel ratio for finger pads).

          The container element below has the actual pointerdown
          listeners (motion library wires them up). Events on the
          pill bubble up to the container, so the pill IS
          interactive even though the listener isn't directly on
          it. Removed the previous `pointer-events-none` on the
          pill, it caused taps to fall through to the underlying
          image with no visual feedback, which mobile users
          perceived as "the button doesn't register." Now the pill
          captures the tap directly and the container still gets
          the bubbled event for drag-tracking. */}
      <div
        ref={handleRef}
        role="slider"
        tabIndex={0}
        aria-label="Compare before and after"
        aria-valuenow={initialPosition}
        aria-valuemin={0}
        aria-valuemax={100}
        className="absolute top-0 bottom-0 w-px bg-cream/90 cursor-ew-resize focus:outline-none focus-visible:bg-cream"
        style={{ left: `${initialPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Visible handle pill. Bigger on mobile, smaller on
            desktop, finger taps need a wider target than mouse
            clicks. */}
        <div
          className={cn(
            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'flex items-center justify-center',
            'h-16 w-16 sm:h-14 sm:w-14',
            'rounded-full bg-cream shadow-2',
            'cursor-ew-resize',
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-deep pointer-events-none"
          >
            <polyline points="9 18 3 12 9 6" />
            <polyline points="15 6 21 12 15 18" />
          </svg>
        </div>
      </div>

      {/* Before/after corner labels. Tiny cream chips in the top
          corners with shadow-1 elevation. Typography aligned to
          the site's .eyebrow scale (font-semibold + 0.1em
          tracking) so every uppercase label on the site shares
          the same weight + spacing values. Was font-bold (700) +
          0.12em tracking, slightly heavier and wider than the
          rest of the site's uppercase labels. */}
      <span
        className={cn(
          'absolute left-3 top-3',
          'rounded-sm bg-cream',
          'px-2.5 py-1',
          'shadow-1',
          'text-body-s font-semibold uppercase',
          'tracking-[0.1em] text-deep',
        )}
      >
        Before
      </span>
      <span
        className={cn(
          'absolute right-3 top-3',
          'rounded-sm bg-cream',
          'px-2.5 py-1',
          'shadow-1',
          'text-body-s font-semibold uppercase',
          'tracking-[0.1em] text-deep',
        )}
      >
        After
      </span>
    </div>
  );
}
