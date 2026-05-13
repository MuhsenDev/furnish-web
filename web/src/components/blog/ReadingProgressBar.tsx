'use client';

/*
  Reading progress bar.

  3 px-tall fixed strip at the top of the viewport. Fills left-to-
  right in the brand accent color as the user scrolls through a
  blog post body. GPU-cheap: animates `transform: scaleX(...)` on a
  100%-wide track instead of changing width.

  Calculation: progress = max(0, min(1, (scrollTop - bodyTop) /
  (bodyHeight - viewportHeight))). Calculated against the post-body
  element passed as a target ref selector, so progress reflects only
  the article body, not the surrounding header/footer/related-posts
  chrome.

  Reduced motion: opacity transitions skip; the bar still updates
  position because that's information, not animation.

  SSR: rendered in the SSR HTML as a fixed strip at scaleX 0. After
  hydration, the scroll listener begins updating it. No layout shift.
*/

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ReadingProgressBarProps {
  /**
   * CSS selector for the element whose scroll progress drives the
   * bar. Pass `article` for the blog post body. If the selector
   * doesn't match, the bar falls back to whole-document scroll.
   */
  targetSelector?: string;
  /** Optional className appended to the root strip. */
  className?: string;
}

export function ReadingProgressBar({
  targetSelector = 'article',
  className,
}: ReadingProgressBarProps) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const target = document.querySelector(targetSelector) as HTMLElement | null;

    /* Compute progress as a 0-1 fraction of how much of the target
       has scrolled past the viewport top. Uses requestAnimationFrame
       to coalesce scroll events (one update per frame max). */
    let raf = 0;
    const update = () => {
      raf = 0;
      let p = 0;
      if (target) {
        const rect = target.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const start = rect.top + window.scrollY;
        const end = start + rect.height - viewportHeight;
        const scrolled = window.scrollY - start;
        const denom = Math.max(end - start, 1);
        p = Math.max(0, Math.min(1, scrolled / denom));
      } else {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        p = docHeight > 0 ? Math.max(0, Math.min(1, window.scrollY / docHeight)) : 0;
      }
      setProgress(p);
    };

    const onScrollOrResize = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [targetSelector]);

  return (
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      /* z-[60] sits above the sticky nav (z-50) so the bar is always
         visible even at the top of the page. h-[3px] keeps it
         visually thin. pointer-events-none so it never intercepts
         clicks. The fill color is peach (2026-05 brand expansion;
         peach is a third primary), which reads as "reading rhythm"
         rather than the harder bronze "progress meter" feel. */
      className={cn(
        'fixed inset-x-0 top-0 z-[60] h-[3px] pointer-events-none',
        'origin-left will-change-transform',
        className,
      )}
      style={{ transform: `scaleX(${progress})` }}
    >
      <div
        aria-hidden="true"
        className="h-full w-full bg-[var(--color-accent-peach)]"
      />
    </div>
  );
}
