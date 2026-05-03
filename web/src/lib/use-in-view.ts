'use client';

/*
  useInView()

  Lightweight IntersectionObserver hook for firing one-shot events
  when an element enters the viewport. Used by home-page sections
  to fire `home_*_section_view` analytics events at the moment the
  section becomes visible.

  Distinct from useScrollReveal: this hook fires a CALLBACK only,
  no animation, no DOM manipulation. The two can compose on the
  same element if a section needs both reveal animation and a
  view-fired event.
*/

import { useEffect, useRef, type RefObject } from 'react';

export interface UseInViewOptions {
  /** Margin around the root. Negative values pull the trigger inward. */
  rootMargin?: string;
  /** Visibility threshold (0 to 1). Defaults to 0.3. */
  threshold?: number;
  /** Fire only once per mount. Defaults to true. */
  once?: boolean;
}

export function useInView<T extends HTMLElement = HTMLElement>(
  onEnter: () => void,
  options: UseInViewOptions = {},
): RefObject<T> {
  const ref = useRef<T>(null);
  const fired = useRef(false);
  const { rootMargin = '0px', threshold = 0.3, once = true } = options;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (once && fired.current) return;
            fired.current = true;
            onEnter();
            if (once) observer.disconnect();
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [rootMargin, threshold, once]);

  return ref;
}
