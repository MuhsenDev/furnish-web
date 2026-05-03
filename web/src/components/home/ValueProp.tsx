'use client';

/*
  Three-statement value prop per Document 5 Section 2.

  Three columns, generous whitespace, scroll-revealed. Each column:
  large numeral + headline + 1-line description.

  No icons or illustrations at v1 (per §2.5 default). Just numbers.
*/

import * as React from 'react';
import { Container } from '@/components/Container';
import { SectionDivider } from '@/components/SectionDivider';
import { useScrollReveal } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface ValueColumn {
  number: string;
  headlineKey: string;
  bodyKey: string;
}

const COLUMNS: ValueColumn[] = [
  { number: '1', headlineKey: 'valuePropCol1Headline', bodyKey: 'valuePropCol1Body' },
  { number: '2', headlineKey: 'valuePropCol2Headline', bodyKey: 'valuePropCol2Body' },
  { number: '3', headlineKey: 'valuePropCol3Headline', bodyKey: 'valuePropCol3Body' },
];

export function ValueProp() {
  const sectionRef = useScrollReveal<HTMLElement>({
    yOffset: 40,
    stagger: 0.1,
  });

  return (
    <section
      ref={sectionRef}
      className="py-section-y"
      aria-labelledby="value-prop-heading"
    >
      <Container width="default">
        <p data-reveal className="eyebrow mb-3">
          {t('home', 'valuePropEyebrow')}
        </p>
        <h2
          id="value-prop-heading"
          className="sr-only"
        >
          How Furnish works
        </h2>

        <div
          className={cn(
            'mt-section-y-tight grid gap-12 sm:gap-8',
            'sm:grid-cols-3',
          )}
        >
          {COLUMNS.map((col) => (
            <div key={col.number} data-reveal>
              <span
                className={cn(
                  'block font-display tracking-display-tight',
                  'text-[var(--color-accent)]',
                  'text-display-m',
                )}
              >
                {col.number}
              </span>
              <h3
                className={cn(
                  'mt-6 font-sans font-semibold text-deep',
                  'text-body-xl',
                )}
              >
                {t('home', col.headlineKey)}
              </h3>
              <p className="mt-4 text-body-l text-ink">
                {t('home', col.bodyKey)}
              </p>
            </div>
          ))}
        </div>

        <SectionDivider align="center" className="mt-section-y" />
      </Container>
    </section>
  );
}
