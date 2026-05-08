'use client';

/*
  Section navigator for long-form documents (privacy, terms).

  Lists every H2 in the document. The page mounts two variants in
  separate DOM positions:
    variant="mobile"  : "Jump to section" <select>, sticky at top
    variant="desktop" : right-aligned sticky sidebar

  Active section detection uses IntersectionObserver scoped to the
  document body. Same pattern as PostTOC, just tuned for the legal
  surface (right-side sidebar instead of left, native <select>
  instead of chip rail on mobile).

  Keyboard:
    - Sidebar links are real anchors; Tab to focus, Enter to follow.
    - Mobile <select> is the native control; OS default keyboard
      navigation works.

  prefers-reduced-motion respected: smooth-scroll falls back to
  instant jump.
*/

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface SectionNavItem {
  id: string;
  text: string;
}

export interface SectionNavigatorProps {
  /** H2 sections to list. */
  sections: SectionNavItem[];
  /**
   * CSS selector for the article body containing the sections. Used
   * to scope IntersectionObserver. Default 'article'.
   */
  scopeSelector?: string;
  /**
   * 'mobile' renders the sticky <select>; 'desktop' renders the
   * sticky right-side sidebar. The page mounts both, in their
   * respective positions in the DOM.
   */
  variant: 'mobile' | 'desktop';
  className?: string;
}

const FIXED_HEADER_OFFSET_PX = 96;

export function SectionNavigator({
  sections,
  scopeSelector = 'article',
  variant,
  className,
}: SectionNavigatorProps) {
  const [activeId, setActiveId] = React.useState<string | null>(
    sections[0]?.id ?? null,
  );
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sections.length === 0) return;

    const scope = document.querySelector(scopeSelector);
    if (!scope) return;

    const targets = sections
      .map((s) => scope.querySelector<HTMLElement>(`#${CSS.escape(s.id)}`))
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
  }, [sections, scopeSelector]);

  const scrollToSection = (id: string) => {
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

  const handleLinkClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToSection(id);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) scrollToSection(id);
  };

  if (sections.length === 0) return null;

  if (variant === 'desktop') {
    return (
      <nav
        aria-label={t('legal', 'sectionNavAriaLabel')}
        className={cn(
          'sticky top-24 self-start',
          'max-h-[calc(100vh-8rem)] overflow-y-auto',
          'pl-4',
          className,
        )}
      >
        <p className="eyebrow text-muted">{t('legal', 'sectionNavHeading')}</p>
        <ul className="mt-4 space-y-1">
          {sections.map((s) => {
            const active = s.id === activeId;
            return (
              <li key={s.id} className="relative">
                {active && (
                  <motion.span
                    layoutId="legal-section-active-indicator"
                    aria-hidden="true"
                    className={cn(
                      'absolute left-0 top-0 bottom-0 w-0.5',
                      'bg-[var(--color-accent)] rounded-full',
                    )}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                    }
                  />
                )}
                <a
                  href={`#${s.id}`}
                  onClick={handleLinkClick(s.id)}
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
                  {s.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  /* Mobile: sticky "Jump to section" select. */
  return (
    <div
      className={cn(
        'sticky top-16 z-20',
        'border-y border-[rgba(43,30,24,0.08)]',
        'bg-cream/85 backdrop-blur-md',
        'py-3',
        className,
      )}
    >
      <div className="px-5 sm:px-6">
        <label
          htmlFor="legal-section-select"
          className="block eyebrow text-muted"
        >
          {t('legal', 'sectionNavHeading')}
        </label>
        <select
          id="legal-section-select"
          aria-label={t('legal', 'sectionNavAriaLabel')}
          value={activeId ?? ''}
          onChange={handleSelectChange}
          className={cn(
            'mt-2 block w-full',
            'rounded-sm border border-[rgba(43,30,24,0.20)] bg-surface',
            'px-3 py-2 text-body-m text-deep',
            'focus:border-[var(--color-accent)] focus:outline-none',
            'focus:ring-2 focus:ring-[var(--color-accent)]',
          )}
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.text}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
