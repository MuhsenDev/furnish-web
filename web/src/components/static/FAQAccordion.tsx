'use client';

/*
  FAQ accordion thin wrapper.

  Thin shim over the shared <Accordion /> component in
  components/shared/Accordion.tsx. Existing call sites
  (app/faq/page.tsx, app/how-it-works/page.tsx) pass `questions:
  FAQQuestion[]`; this wrapper adapts that shape into the
  Accordion's `items: AccordionItem[]` and forwards everything else.

  The shared Accordion supersedes the prior single-open implementation:
    - Multiple items can be open simultaneously
    - Smooth Framer Motion height animation (height: auto)
    - Arrow / Home / End key navigation between triggers
    - Always SSR-safe (answers in the HTML, hidden via .sr-only when
      collapsed)
*/

import * as React from 'react';
import { Accordion } from '@/components/shared/Accordion';
import type { FAQQuestion } from '@/lib/faq';

export interface FAQAccordionProps {
  questions: FAQQuestion[];
  className?: string;
}

export function FAQAccordion({ questions, className }: FAQAccordionProps) {
  return (
    <Accordion
      className={className}
      items={questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
      }))}
    />
  );
}
