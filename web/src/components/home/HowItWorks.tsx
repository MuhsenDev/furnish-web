'use client';

/*
  How It Works 3-step diagram per Document 5 Section 5.

  Three numbered steps in a horizontal flow on desktop, stacked on
  mobile. Optional connecting line between steps on desktop fades
  in last. CTA below links to /how-it-works.

  Section anchored as id="how-it-works" so the hero secondary CTA
  scrolls here.

  Fires home_how_it_works_section_view once when the section
  enters the viewport.
*/

import * as React from 'react';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { SectionDivider } from '@/components/SectionDivider';
import { useScrollReveal } from '@/lib/motion';
import { useInView } from '@/lib/use-in-view';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface Step {
  number: '1' | '2' | '3';
  headlineKey: string;
  bodyKey: string;
}

const STEPS: Step[] = [
  { number: '1', headlineKey: 'howItWorksStep1Headline', bodyKey: 'howItWorksStep1Body' },
  { number: '2', headlineKey: 'howItWorksStep2Headline', bodyKey: 'howItWorksStep2Body' },
  { number: '3', headlineKey: 'howItWorksStep3Headline', bodyKey: 'howItWorksStep3Body' },
];

const tertiaryCtaClasses = cn(
  'inline-flex items-center gap-2',
  'text-body-l font-semibold text-[var(--color-accent)]',
  'underline-offset-4 hover:underline',
);

export function HowItWorks() {
  const revealRef = useScrollReveal<HTMLElement>({
    yOffset: 30,
    stagger: 0.15,
  });

  const viewRef = useInView<HTMLElement>(() => {
    track('home_how_it_works_section_view');
  });

  /* Compose two refs into one. Both hooks return refs that need
     to attach to the same element. Use a callback ref to assign
     both. */
  const setRefs = React.useCallback(
    (node: HTMLElement | null) => {
      (revealRef as React.MutableRefObject<HTMLElement | null>).current = node;
      (viewRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [revealRef, viewRef],
  );

  return (
    <section
      id="how-it-works"
      ref={setRefs}
      className="scroll-mt-24 py-section-y"
      aria-labelledby="how-it-works-heading"
    >
      <Container width="default">
        <div className="text-center" data-reveal>
          <p className="eyebrow">{t('home', 'howItWorksEyebrow')}</p>
          <h2
            id="how-it-works-heading"
            className={cn(
              'mt-3 font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-l',
            )}
          >
            {t('home', 'howItWorksHeadline')}
          </h2>
        </div>

        <div
          className={cn(
            'mt-section-y-tight relative grid gap-12',
            'lg:grid-cols-3 lg:gap-8',
          )}
        >
          {/* Connecting line on desktop (between the three numbered
              cells). Subtle, accent-color, 1px. Mobile hides it. */}
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute hidden lg:block',
              'left-[16%] right-[16%] top-12 h-px',
              'bg-[var(--color-accent)]/30',
            )}
          />

          {STEPS.map((step) => (
            <div
              key={step.number}
              data-reveal
              className="relative bg-cream"
            >
              <span
                className={cn(
                  'block font-display tracking-display-tight',
                  'text-[var(--color-accent)]',
                  'text-display-m',
                )}
              >
                {step.number}
              </span>
              <h3
                className={cn(
                  'mt-4 font-sans font-semibold text-deep',
                  'text-body-xl',
                )}
              >
                {t('home', step.headlineKey)}
              </h3>
              <p className="mt-3 text-body-l text-ink">
                {t('home', step.bodyKey)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-section-y-tight text-center" data-reveal>
          <Link href="/how-it-works" className={tertiaryCtaClasses}>
            {t('home', 'howItWorksCta')}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <SectionDivider align="center" className="mt-section-y" />
      </Container>
    </section>
  );
}
