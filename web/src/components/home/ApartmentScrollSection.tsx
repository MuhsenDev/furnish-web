'use client';

/*
  ApartmentScrollSection — dedicated home-page section for the 3D
  apartment scroll-fill experience. Inserted between Hero and
  ValueProp.

  Behavior:
  - Section background: deep espresso so the warm-lit room glows
    against it.
  - Tagline above the canvas in display serif.
  - Canvas wrapper: 16:10 aspect, max-w-5xl, centered.
  - As the user scrolls the section through the viewport, an
    IntersectionObserver tracks visibility and a scroll handler
    computes a 0..1 progress through the section. The progress
    drives mesh reveals inside the Canvas (see ApartmentScene).
  - Loading: a small Loading-screen Lottie overlays the canvas
    until the .glb finishes downloading. Two phases of "loading"
    are covered by the same Lottie:
      1) The dynamic JS chunk for ApartmentScene downloads (~190 KB
         gz of three + r3f + drei plus a few KB for the scene code).
      2) The .glb model downloads (~11 MB raw, browser-compressed).
    The Lottie hides only when ApartmentMeshes signals onLoaded
    AFTER both are complete.

  Cropping safety:
  - No overflow:hidden on the section.
  - Canvas wrapper uses aspect ratio + max-width, never 100vh,
    so iOS Safari URL-bar viewport oddities can't crop it.
*/

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Container } from '@/components/Container';
import { LottieAsset } from '@/components/shared/LottieAsset';
import { cn } from '@/lib/utils';

const ApartmentScene = dynamic(
  () => import('./ApartmentScene').then((m) => m.ApartmentScene),
  /* Loading is null because the outer overlay (controlled by
     sceneLoaded state below) covers both chunk-loading and
     glb-loading phases with the same Lottie. */
  { ssr: false, loading: () => null },
);

export function ApartmentScrollSection() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef(0);
  const [inView, setInView] = React.useState(false);
  const [sceneLoaded, setSceneLoaded] = React.useState(false);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '200px', threshold: 0 },
    );
    observer.observe(el);

    const update = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const winH = window.innerHeight;
      /* Progress is 0 when the section's top edge first crosses the
         bottom of the viewport, 1 when the section's bottom edge
         leaves the top. Linear over the (winH + sectionH) total
         distance. */
      const total = winH + rect.height;
      const scrolled = winH - rect.top;
      scrollRef.current = Math.max(0, Math.min(1, scrolled / total));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Furnish 3D apartment"
      className={cn(
        'relative bg-deep',
        'min-h-screen',
        'flex flex-col items-center justify-center',
        'py-20 sm:py-24 lg:py-32',
      )}
    >
      <p
        className={cn(
          'text-center font-display italic',
          'text-display-m text-cream/70',
          'mb-10 sm:mb-14',
        )}
      >
        From empty to home.
      </p>

      <Container width="default" className="w-full">
        <div
          className={cn(
            'mx-auto w-full max-w-5xl',
            'aspect-[16/10]',
            'relative rounded-sm',
          )}
        >
          <ApartmentScene
            scrollRef={scrollRef}
            inView={inView}
            onLoaded={() => setSceneLoaded(true)}
          />

          {/* Loading overlay. Covers both chunk-load and .glb-load
              phases. Fades out via Tailwind opacity transition once
              the scene signals ready. */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'pointer-events-none',
              'transition-opacity duration-700 ease-vercel',
              sceneLoaded ? 'opacity-0' : 'opacity-100',
            )}
            aria-hidden={sceneLoaded}
          >
            <LottieAsset
              src="/Animations/Lottie/Loading-screen.web.lottie"
              className="h-24 w-24"
              tint="warm"
              ariaLabel="Loading 3D apartment"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
