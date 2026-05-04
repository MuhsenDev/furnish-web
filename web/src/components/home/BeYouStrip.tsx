'use client';

/*
  BeYouStrip — full-bleed dark strip with the "Be you" Lottie
  centered. Sits on the home page between GalleryPreview ("Real
  rooms. Designed by Furnish.") and HomeCompareSlider ("See the
  magic.") per Hassan's positioning call.

  The Lottie's native background is near-black (#010101). The
  strip wrapper matches that color so the lottie blends seamlessly
  with empty space on either side of its square aspect.

  The Lottie's gradient stops were recolored from magenta/pink to
  brand cream → bronze in this iteration, so the animation is now
  on-palette without needing CSS filters.
*/

import * as React from 'react';
import { Container } from '@/components/Container';
import { LottieAsset } from '@/components/shared/LottieAsset';
import { cn } from '@/lib/utils';

export function BeYouStrip() {
  return (
    <section aria-label="Be you" className="relative">
      <Container width="bleed">
        <div
          className={cn(
            'bg-[#010101]',
            'h-64 sm:h-80 lg:h-96',
            'overflow-hidden',
            'flex items-center justify-center',
          )}
        >
          <LottieAsset
            src="/Animations/Lottie/Animation.web.lottie"
            className="h-full aspect-square"
            ariaLabel=""
          />
        </div>
      </Container>
    </section>
  );
}
