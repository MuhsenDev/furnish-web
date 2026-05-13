'use client';

/*
  Floating table of contents for blog posts.

  Reads H2 anchors out of the rendered post body (rehype-slug
  already wires `id` attributes onto every H2). The component takes
  a `variant` prop because the page composes the TOC from two
  positions in the DOM:

    variant="mobile"  : horizontal scroll-snap chip bar that sticks
                        below the post header. Renders only on
                        small/medium viewports.
    variant="desktop" : vertical list pinned to the LEFT side of
                        the article body inside a CSS grid sidebar.
                        Sticky, bronze-accent active state, indicator
                        bar on the active item.

  Both variants share the same active-section detection (Intersection
  Observer scoped to the article body) and the same anchor handlers.
  prefers-reduced-motion is respected: smooth-scroll falls back to
  instant jump.

  Auto-hide rule: nothing renders when the post has fewer than
  `minHeadings` H2s (default 4). Shorter posts don't need a TOC.
*/

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface TocHeading {
  id: string;
  text: string;
}

export interface PostTOCProps {
  /**
   * Headings to render. Pass the H2 list extracted from the MDX
   * source. The component auto-hides when length < minHeadings.
   */
  headings: TocHeading[];
  /** Minimum H2 count required to render. Default 4. */
  minHeadings?: number;
  /**
   * CSS selector for the article body the TOC scrolls within. Used
   * to scope the IntersectionObserver. Default 'article'.
   */
  scopeSelector?: string;
  /**
   * 'mobile' renders the horizontal chip rail; 'desktop' renders
   * the vertical sticky sidebar. The page mounts both, in their
   * respective DOM positions.
   */
  variant: 'mobile' | 'desktop';
  className?: string;
}

const FIXED_HEADER_OFFSET_PX = 96;

export function PostTOC({
  headings,
  minHeadings = 4,
  scopeSelector = 'article',
  variant,
  className,
}: PostTOCProps) {
  const [activeId, setActiveId] = React.useState<string | null>(
    headings[0]?.id ?? null,
  );
  const prefersReducedMotion = useReducedMotion();
  const mobileRailRef = React.useRef<HTMLDivElement>(null);

  /* IntersectionObserver: a heading is "active" when it enters the
     top portion of the viewport. rootMargin biases the active band
     so the highlighted item is the section the user is currently
     reading, not the next one entering view. */
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (headings.length < minHeadings) return;

    const scope = document.querySelector(scopeSelector);
    if (!scope) return;

    const targets = headings
      .map((h) => scope.querySelector<HTMLElement>(`#${CSS.escape(h.id)}`))
      .filter((el): el is HTMLElement => el != null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) =>
          a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b,
        );
        setActiveId(topMost.id);
      },
      {
        rootMargin: '-96px 0px -70% 0px',
        threshold: 0,
      },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings, minHeadings, scopeSelector]);

  /* Mobile-only: keep the active chip horizontally centered as the
     user scrolls. No-op on the desktop variant. */
  React.useEffect(() => {
    if (variant !== 'mobile') return;
    if (!activeId) return;
    const rail = mobileRailRef.current;
    if (!rail) return;
    const chip = rail.querySelector<HTMLAnchorElement>(
      `[data-toc-chip="${activeId}"]`,
    );
    if (!chip) return;
    const railRect = rail.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const chipCenter = chipRect.left + chipRect.width / 2;
    const railCenter = railRect.left + railRect.width / 2;
    const delta = chipCenter - railCenter;
    if (Math.abs(delta) > 8) {
      rail.scrollBy({
        left: delta,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [activeId, prefersReducedMotion, variant]);

  const handleClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    const top =
      target.getBoundingClientRect().top + window.scrollY - FIXED_HEADER_OFFSET_PX;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', `#${id}`);
    }
    setActiveId(id);
  };

  if (headings.length < minHeadings) return null;

  if (variant === 'desktop') {
    return (
      <nav
        aria-label={t('blog', 'tocAriaLabel')}
        className={cn(
          'sticky top-24 self-start',
          'max-h-[calc(100vh-8rem)] overflow-y-auto',
          'pr-4',
          className,
        )}
      >
        <p className="eyebrow text-muted">{t('blog', 'tocHeading')}</p>
        <ul className="mt-4 space-y-1">
          {headings.map((h) => {
            const active = h.id === activeId;
            return (
              <li key={h.id} className="relative">
                {active && (
                  <motion.span
                    layoutId="toc-active-indicator"
                    aria-hidden="true"
                    className={cn(
                      'absolute left-0 top-0 bottom-0 w-0.5',
                      'bg-[var(--color-accent-peach)] rounded-full',
                    )}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                    }
                  />
                )}
                <a
                  href={`#${h.id}`}
                  onClick={handleClick(h.id)}
                  aria-current={active ? 'location' : undefined}
                  className={cn(
                    'block py-1.5 pl-4 pr-2',
                    'text-body-s leading-relaxed',
                    'transition-colors duration-150 ease-premium',
                    active
                      ? 'text-[var(--color-accent)] font-semibold'
                      : 'text-ink/70 hover:text-deep',
                  )}
                >
                  {h.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  /* Mobile: horizontal scroll-snap chip rail. */
  return (
    <nav
      aria-label={t('blog', 'tocAriaLabel')}
      className={cn(
        'sticky top-16 z-20',
        'border-y border-[rgba(43,30,24,0.08)]',
        'bg-cream/85 backdrop-blur-md',
        'py-2',
        className,
      )}
    >
      <div
        ref={mobileRailRef}
        className={cn(
          'flex gap-2 overflow-x-auto px-4 snap-x snap-mandatory',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {headings.map((h) => {
          const active = h.id === activeId;
          return (
            <a
              key={h.id}
              data-toc-chip={h.id}
              href={`#${h.id}`}
              onClick={handleClick(h.id)}
              aria-current={active ? 'location' : undefined}
              className={cn(
                'shrink-0 inline-flex items-center justify-center snap-center',
                'rounded-sm border px-3 py-1.5',
                'text-body-s font-semibold',
                'transition-colors duration-150 ease-premium',
                active
                  ? 'border-[var(--color-accent-peach)] bg-[var(--color-accent-peach)] text-deep'
                  : 'border-[rgba(43,30,24,0.20)] bg-surface text-ink',
              )}
            >
              {h.text}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
