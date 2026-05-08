'use client';

/*
  LottieAsset, wrapper around @lottiefiles/dotlottie-react.

  Loads a .lottie file (the compressed Lottie variant) from public/.
  Lazy-loads the player chunk so SSR HTML stays clean.

  Optional `tint` prop applies a CSS filter to warm-tone the
  animation toward the brand palette (cream / bronze / espresso).
  Use 'warm' for off-brand bright source colors, 'subtle' for a
  gentle nudge, undefined to leave colors untouched.

  The wrapper is a div, not a Suspense boundary; the inner player
  handles its own load state. While the player chunk is fetching,
  the div renders empty (zero layout shift if a fixed
  width/height/className is supplied).

  Usage:
    <LottieAsset
      src="/Animations/Lottie/Arrow%201.lottie"
      className="h-10 w-10"
      tint="warm"
      ariaLabel="Scroll for more"
    />

  Note URL encoding: filenames in /public/Animations/Lottie/ have
  spaces in them (e.g. "Arrow 1.lottie"). Pass them URL-encoded
  ("Arrow%201.lottie") so fetch() works in all browsers without
  relying on auto-encoding.
*/

import * as React from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

/* The dotlottie player constructs WebAssembly + a <canvas>; both
   touch `window`. ssr:false prevents Next from trying to render it
   on the server. */
const DotLottieReact = dynamic(
  () =>
    import('@lottiefiles/dotlottie-react').then((m) => ({
      default: m.DotLottieReact,
    })),
  { ssr: false, loading: () => null },
);

const TINT_FILTERS = {
  warm: 'sepia(0.3) saturate(1.2) hue-rotate(-10deg) brightness(0.95)',
  subtle: 'sepia(0.15) saturate(0.95) brightness(0.97)',
} as const;

export interface LottieAssetProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  /**
   * Apply a CSS filter to warm-tone the animation toward the brand
   * palette. Use 'warm' for cream/bronze/espresso tinting, 'subtle'
   * for a gentle adjustment, undefined to leave colors untouched.
   */
  tint?: keyof typeof TINT_FILTERS;
  /**
   * Aria label for the wrapper. Pass empty string for purely
   * decorative animations (the wrapper will be marked aria-hidden).
   */
  ariaLabel?: string;
}

export function LottieAsset({
  src,
  className,
  loop = true,
  autoplay = true,
  speed = 1,
  tint,
  ariaLabel,
}: LottieAssetProps) {
  const filter = tint ? TINT_FILTERS[tint] : undefined;
  const isDecorative = ariaLabel === '' || ariaLabel === undefined;

  return (
    <div
      className={cn('relative inline-flex shrink-0', className)}
      style={filter ? { filter } : undefined}
      role={isDecorative ? undefined : 'img'}
      aria-label={isDecorative ? undefined : ariaLabel}
      aria-hidden={isDecorative ? 'true' : undefined}
    >
      <DotLottieReact
        src={src}
        loop={loop}
        autoplay={autoplay}
        speed={speed}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
