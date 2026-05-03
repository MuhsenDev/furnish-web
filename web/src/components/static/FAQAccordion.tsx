'use client';

/*
  FAQ accordion per Document 8 §3.

  Click expands; click again collapses. Smooth 200ms ease via CSS
  transition on max-height plus opacity. Reduced motion skips the
  transition (the global CSS reset zeros transition-duration when
  prefers-reduced-motion is set).

  Used both on /faq (rendering all categories) and inline on
  /how-it-works (rendering the 7 questions tagged with
  showOnPages: ['/how-it-works']).

  Each item gets a stable id so the URL hash can deep-link to
  a specific question (e.g. /faq#how-do-i-use-furnish opens
  the matching item on mount).
*/

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import type { FAQQuestion } from '@/lib/faq';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface FAQAccordionProps {
  questions: FAQQuestion[];
  /** Optional class for the root container. */
  className?: string;
}

interface ItemProps {
  q: FAQQuestion;
  open: boolean;
  onToggle: () => void;
}

function FAQItem({ q, open, onToggle }: ItemProps) {
  const contentId = `faq-content-${q.id}`;
  const buttonId = `faq-button-${q.id}`;

  return (
    <div
      id={q.id}
      className={cn(
        'scroll-mt-32 border-b border-[rgba(43,30,24,0.08)]',
      )}
    >
      <h3>
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={contentId}
          className={cn(
            'group flex w-full items-start justify-between gap-4',
            'py-5 text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          )}
        >
          <span className="text-body-l font-semibold text-deep">
            {q.question}
          </span>
          <ChevronDown
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className={cn(
              'mt-1 shrink-0 text-[var(--color-accent)]',
              'transition-transform duration-200 ease-premium',
              open ? 'rotate-180' : 'rotate-0',
            )}
          />
        </button>
      </h3>
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className={cn(
          'pb-5 pr-9',
          'text-body-m text-ink/90 leading-relaxed',
        )}
      >
        {q.answer}
      </div>
    </div>
  );
}

export function FAQAccordion({ questions, className }: FAQAccordionProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  /* Honor URL hash on mount so deep-links open the matching item. */
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && questions.some((q) => q.id === hash)) {
      setOpenId(hash);
    }
    /* Suppress unused t warning for this hook scope; t is used by
       the parent components, not here. */
    void t;
  }, [questions]);

  if (questions.length === 0) return null;

  return (
    <div className={cn('divide-y divide-[rgba(43,30,24,0.08)]', className)}>
      {questions.map((q) => (
        <FAQItem
          key={q.id}
          q={q}
          open={openId === q.id}
          onToggle={() => setOpenId(openId === q.id ? null : q.id)}
        />
      ))}
    </div>
  );
}
