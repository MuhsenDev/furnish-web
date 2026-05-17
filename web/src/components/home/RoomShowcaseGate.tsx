'use client';

/*
  RoomShowcaseGate

  Client-side wrapper that gates RoomShowcaseSection's RENDER and
  CHUNK DOWNLOAD on the viewport being mobile-sized (<lg). On
  desktop the component returns null and the dynamic import inside
  it never fires, so the section's JS chunk + the three SVG fetches
  + the canvas rasterization + framer-motion bundle all stay off
  the wire.

  Why a wrapper and not Tailwind's lg:hidden, or an `if (isLg)
  return null` inside RoomShowcaseSection itself:

    - lg:hidden hides the rendered DOM but the chunk is still
      downloaded and the SVG fetch + trim still runs. Wasted bytes
      on desktop.

    - Putting the if-return inside RoomShowcaseSection requires
      Next.js to load the chunk first to evaluate the early return.
      Same wasted-bytes problem.

    - Gating the dynamic() call itself at module level (top of
      page.tsx) is impossible without converting page.tsx to a
      client component, which would lose its server-side metadata
      export ergonomics.

  This wrapper owns the dynamic import. On desktop the JSX never
  references <RoomShowcaseSection />, so Next.js never requests
  the chunk.

  Hydration: this component renders null until matchMedia resolves
  on the client (~10ms after mount). The previous setup had a 60vh
  cream placeholder via dynamic()'s loading: prop, which flashed
  visibly for desktop users before collapsing as the JS confirmed
  isLg=true. The null-on-unknown state here avoids that flash.
*/

import * as React from 'react';
import dynamic from 'next/dynamic';

const RoomShowcaseSection = dynamic(
  () =>
    import('./RoomShowcaseSection').then((m) => m.RoomShowcaseSection),
  {
    ssr: false,
    /* loading: null — see comment above on the placeholder flash.
       isMobile resolves quickly enough on the client that no
       placeholder is preferable to a placeholder that immediately
       collapses on desktop. Mobile users still see the section
       appear once the chunk + first SVG load finish; that delay
       was always there because of ssr:false. */
    loading: () => null,
  },
);

export function RoomShowcaseGate() {
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    /* Mirrors RoomShowcaseSection's internal isLg query but
       inverted. <lg means mobile/tablet; >=lg means desktop where
       the section never renders. */
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* Until matchMedia resolves, render nothing. Desktop visitors
     never advance past this guard, so the dynamic chunk never
     loads. Mobile visitors advance once isMobile flips true. */
  if (isMobile !== true) return null;
  return <RoomShowcaseSection />;
}
