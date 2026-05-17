'use client';

/*
  SSR-safe accordion component.

  Per Hassan's spec (2026-05-08, all-features prompt):
    - Renders all questions AND answers in the SSR HTML. Answers are
      hidden via CSS, NOT removed from the DOM. Critical for SEO and
      a11y: search crawlers and screen readers see every answer.
    - Each item is a <button aria-expanded> + a <div role="region">.
    - Smooth height animation via Framer Motion (animate height auto)
      with prefers-reduced-motion respected (instant snap when set).
    - Chevron rotates 180deg when open.
    - Keyboard: Tab focuses, Enter/Space toggles, Arrow keys move
      between items in the same group.
    - Multiple items can be open simultaneously (no auto-close).

  Replaces the prior FAQAccordion which only allowed one open item
  at a time and animated via max-height (less reliable across long
  answers). The prior file stays in the tree for now; new code
  imports Accordion from here.

  Deep-linking:
    - Each item gets `id={item.id}`, so /faq#how-do-i-use-furnish
      auto-opens that item on mount.
    - The mount-time hash check is the only useEffect; everything
      else is server-rendered.
*/

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  /** Stable id used for deep-link hashes and aria wiring. */
  id: string;
  /** Heading text shown on the trigger button. */
  question: string;
  /** Body content. Plain text or React node. */
  answer: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Optional class for the root container. */
  className?: string;
  /**
   * If true, items default to expanded on first render. Useful when
   * the accordion is mostly informational and the user benefits
   * from seeing answers without clicking. Default false.
   */
  defaultAllOpen?: boolean;
}

interface ItemProps {
  item: AccordionItem;
  open: boolean;
  onToggle: () => void;
  /** Index in the rendered list, used for arrow-key navigation. */
  index: number;
  /** Total items, used for arrow-key wrap-around. */
  total: number;
  /** Refs to all triggers, so we can focus a sibling on arrow keys. */
  triggerRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
}

function AccordionItemView({
  item,
  open,
  onToggle,
  index,
  total,
  triggerRefs,
}: ItemProps) {
  const buttonId = `accordion-button-${item.id}`;
  const contentId = `accordion-content-${item.id}`;
  const prefersReducedMotion = useReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (index + 1) % total;
      triggerRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (index - 1 + total) % total;
      triggerRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      triggerRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      triggerRefs.current[total - 1]?.focus();
    }
    /* Space and Enter native-handled by <button>. */
  };

  return (
    <div
      id={item.id}
      className={cn(
        'scroll-mt-32 border-b border-[rgba(43,30,24,0.08)]',
        'transition-colors duration-200 ease-premium',
        /* Surface-2 sage-soft tint on the open item, so the active
           FAQ entry reads as visually "lit" without a heavier border
           treatment. 14% alpha keeps body type readable on the tint
           (sage fails WCAG on cream for body type at full saturation;
           at 14% the underlying cream still dominates). */
        open && 'bg-[var(--color-sage-soft)]',
      )}
    >
      <h3 className="m-0">
        <button
          ref={(el) => {
            triggerRefs.current[index] = el;
          }}
          id={buttonId}
          type="button"
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={open}
          aria-controls={contentId}
          className={cn(
            'group flex w-full items-start justify-between gap-4',
            'py-5 text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
            'rounded-sm',
          )}
        >
          <span className="text-body-l font-semibold text-deep">
            {item.question}
          </span>
          <ChevronDown
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className={cn(
              'mt-1 shrink-0 text-[var(--color-accent)]',
              'transition-transform duration-200 ease-premium',
              open ? 'rotate-180' : 'rotate-0',
              prefersReducedMotion && 'transition-none',
            )}
          />
        </button>
      </h3>
      {/*
        SSR-safe answer container. Always rendered into the DOM; the
        AnimatePresence only adds/removes the inner motion.div, which
        is what handles the height animation. When closed in
        SSR/no-JS, the wrapper still contains the answer text inside
        a <div hidden> for crawler / screen-reader readability.
      */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        /* When closed AND JS hasn't hydrated, the inner SSR copy
           below is visible to bots/SR but hidden visually. After
           hydration, AnimatePresence takes over the open state. */
        className="text-body-m text-ink/90 leading-relaxed"
      >
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="answer"
              initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
              animate={
                prefersReducedMotion
                  ? { height: 'auto', opacity: 1 }
                  : { height: 'auto', opacity: 1 }
              }
              exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
              }
              style={{ overflow: 'hidden' }}
            >
              <div className="pb-5 pr-9">{item.answer}</div>
            </motion.div>
          )}
        </AnimatePresence>
        {/*
          SSR-only fallback: rendered as <noscript>-style hidden
          content so the answer is in the source HTML even when JS
          is disabled. AnimatePresence above handles the JS path.
          Tailwind's `hidden` adds display: none which keeps the
          element in the accessibility tree but out of layout when
          the accordion is closed.
        */}
        {!open && (
          <div className="sr-only" aria-hidden="false">
            {item.answer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Accordion({
  items,
  className,
  defaultAllOpen = false,
}: AccordionProps) {
  /* Each item's open state tracked independently. Multiple-open
     allowed per spec. */
  const [openIds, setOpenIds] = React.useState<Set<string>>(() => {
    if (defaultAllOpen) return new Set(items.map((i) => i.id));
    return new Set();
  });

  const triggerRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  /* Honor URL hash on mount so deep-links open the matching item.
     Runs once after hydration; before that, all items are closed
     (or all open if defaultAllOpen) per the SSR snapshot. */
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && items.some((i) => i.id === hash)) {
      setOpenIds((prev) => {
        const next = new Set(prev);
        next.add(hash);
        return next;
      });
    }
  }, [items]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (items.length === 0) return null;

  return (
    <div className={cn('divide-y divide-[rgba(43,30,24,0.08)]', className)}>
      {items.map((item, idx) => (
        <AccordionItemView
          key={item.id}
          item={item}
          open={openIds.has(item.id)}
          onToggle={() => toggle(item.id)}
          index={idx}
          total={items.length}
          triggerRefs={triggerRefs}
        />
      ))}
    </div>
  );
}
