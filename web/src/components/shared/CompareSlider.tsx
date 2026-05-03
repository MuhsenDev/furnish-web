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
  const beforeImgRef = React.useRef<HTMLImageElement>(null);
  const afterImgRef = React.useRef<HTMLImageElement>(null);
  const handleRef = React.useRef<HTMLDivElement>(null);

  useCompareSlider(
    {
      containerRef,
      beforeImgRef,
      afterImgRef,
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
        aspectClassName,
        className,
      )}
    >
      {/* Before image, full bleed beneath. */}
      <Image
        ref={beforeImgRef}
        src={before.src}
        alt={before.alt}
        fill
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover"
        priority
      />

      {/* After image, clipped by inset() based on slider position.
          Initial inline style is overwritten by createCompareSlider
          on mount. */}
      <Image
        ref={afterImgRef}
        src={after.src}
        alt={after.alt}
        fill
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - initialPosition}% 0 0)` }}
        priority
      />

      {/* Vertical drag handle. */}
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
        {/* Visible handle pill. */}
        <div
          className={cn(
            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'flex h-12 w-12 items-center justify-center',
            'rounded-full bg-cream shadow-2',
            'pointer-events-none',
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-deep"
          >
            <polyline points="9 18 3 12 9 6" />
            <polyline points="15 6 21 12 15 18" />
          </svg>
        </div>
      </div>

      {/* Before/after corner labels. */}
      <span className="eyebrow absolute left-3 top-3 rounded-sm bg-ink/70 px-2 py-1 text-cream">
        Before
      </span>
      <span className="eyebrow absolute right-3 top-3 rounded-sm bg-ink/70 px-2 py-1 text-cream">
        After
      </span>
    </div>
  );
}
