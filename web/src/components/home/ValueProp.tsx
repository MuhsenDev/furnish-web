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
            'mt-section-y-tight grid gap-6 sm:gap-6',
            'sm:grid-cols-3',
          )}
        >
          {COLUMNS.map((col) => (
            /* Each column wrapped in a warm beige card. Adds depth
               and breaks up the previously empty/text-only stretch
               of the home page. Subtle shadow on hover for
               interactivity hint without being clickable. */
            <div
              key={col.number}
              data-reveal
              className={cn(
                'rounded-[var(--radius)]',
                'bg-[var(--color-beige)]/55',
                'border border-[rgba(43,30,24,0.06)]',
                'p-7 sm:p-8 lg:p-10',
                'transition-shadow duration-300 ease-premium',
                'hover:shadow-1',
              )}
            >
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
                  'mt-5 font-sans font-semibold text-deep',
                  'text-body-xl',
                )}
              >
                {t('home', col.headlineKey)}
              </h3>
              <p className="mt-3 text-body-l text-ink">
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
