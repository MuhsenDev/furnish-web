'use client';

/*
  ApartmentScrollSection — dedicated home-page section for the 3D
  apartment scroll-fill experience. Inserted between Hero and
  ValueProp.

  Layout:
  - Section background: solid black per Hassan's call ("let the
    background be black with white text"). Tailwind `bg-black` is
    a deliberate exception to the brand "no pure black" rule;
    Hassan explicitly overrode it for this section.
  - Tagline text in white above the canvas.
  - Canvas wrapper: 16:10 aspect, max-w-5xl, centered.

  Scroll progress is computed from the section's bounding rect vs.
  viewport, in a passive scroll listener. The progress (0..1) drives
  the two-phase animation in ApartmentScene:
    - 0..0.5: orbit camera around the empty apartment
    - 0.5..1: dolly into the middle of the room while furniture
      drops in

  Loading state: previously a Loading-screen Lottie overlaid the
  canvas during the .glb fetch. Hassan removed the Lottie because
  its colors couldn't be repaletted to brand. The canvas now sits
  on bg-black during load; user sees a solid black canvas area
  briefly, then the model fades in once useGLTF resolves. Hassan
  will replace the loader Lottie himself when he picks an asset.

  Cropping safety:
  - No overflow:hidden on the section.
  - Canvas wrapper uses aspect ratio + max-width, never 100vh.
*/

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Container } from '@/components/Container';
import { cn } from '@/lib/utils';

const ApartmentScene = dynamic(
  () => import('./ApartmentScene').then((m) => m.ApartmentScene),
  { ssr: false, loading: () => null },
);

export function ApartmentScrollSection() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef(0);
  const [inView, setInView] = React.useState(false);

  /* sceneLoaded was previously used to fade out the loading
     Lottie. Lottie removed; flag kept for potential future use
     (e.g. opacity fade-in on the canvas itself once ready). */
  const [, setSceneLoaded] = React.useState(false);

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
        'relative bg-black',
        'min-h-screen',
        'flex flex-col items-center justify-center',
        'py-20 sm:py-24 lg:py-32',
      )}
    >
      <p
        className={cn(
          'text-center font-display italic',
          'text-display-m text-white',
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
            'relative',
          )}
        >
          <ApartmentScene
            scrollRef={scrollRef}
            inView={inView}
            onLoaded={() => setSceneLoaded(true)}
          />
        </div>
      </Container>
    </section>
  );
}
