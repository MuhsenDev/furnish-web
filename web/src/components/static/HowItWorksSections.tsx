'use client';

/*
  How It Works page sections per Document 8 §2.

  Hero, 3 expanded steps (~250-350 words each), Technology section,
  simplified comparison block (text version, NOT the full table from
  home page per §2.7), Mini-FAQ (7 questions tagged with
  showOnPages: ['/how-it-works']), Final CTA.

  Section ordering matches Doc 8 §2 build sequence.
*/

import * as React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Container } from '@/components/Container';
import { SectionDivider } from '@/components/SectionDivider';
import { useScrollReveal } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ---- HowItWorksHero ---- */

export function HowItWorksHero() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 24, stagger: 0.18 });
  return (
    <section
      ref={ref}
      className="pt-section-y-tight pb-section-y-tight"
      aria-labelledby="how-hero-heading"
    >
      <Container width="default" className="text-center">
        <p data-reveal className="eyebrow">
          {t('how-it-works', 'heroEyebrow')}
        </p>
        <h1
          id="how-hero-heading"
          data-reveal
          className={cn(
            'mt-4 mx-auto max-w-3xl font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-l',
          )}
        >
          {t('how-it-works', 'heroHeadline')}
        </h1>
        <p
          data-reveal
          className="mt-6 mx-auto max-w-2xl text-body-l text-ink/80"
        >
          {t('how-it-works', 'heroSubheadline')}
        </p>
      </Container>
    </section>
  );
}

/* ---- Expanded steps ---- */

const STEPS: Array<{
  number: string;
  headlineKey: string;
  bodyKeys: string[];
}> = [
  {
    number: '1',
    headlineKey: 'step1Headline',
    bodyKeys: ['step1Body1', 'step1Body2', 'step1Body3'],
  },
  {
    number: '2',
    headlineKey: 'step2Headline',
    bodyKeys: ['step2Body1', 'step2Body2', 'step2Body3'],
  },
  {
    number: '3',
    headlineKey: 'step3Headline',
    bodyKeys: ['step3Body1', 'step3Body2', 'step3Body3'],
  },
];

export function HowItWorksSteps() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 30, stagger: 0.1 });
  return (
    <section
      ref={ref}
      className="py-section-y border-t border-[rgba(43,30,24,0.08)]"
      aria-labelledby="how-steps-heading"
    >
      <Container width="narrow">
        <h2 id="how-steps-heading" className="sr-only">
          The flow
        </h2>
        <div className="space-y-section-y">
          {STEPS.map((step) => (
            <article key={step.number} data-reveal>
              <span
                className={cn(
                  'block font-display tracking-display-tight',
                  'text-[var(--color-accent)]',
                  'text-display-l',
                )}
              >
                {step.number}
              </span>
              <h3
                className={cn(
                  'mt-3 font-display text-deep',
                  'tracking-display-tight leading-display',
                  'text-display-m',
                )}
              >
                {t('how-it-works', step.headlineKey)}
              </h3>
              <div className="mt-5 space-y-4">
                {step.bodyKeys.map((bk) => (
                  <p
                    key={bk}
                    className="text-body-l text-ink/90 leading-relaxed"
                  >
                    {t('how-it-works', bk)}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---- Technology section ---- */

export function HowItWorksTechnology() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 30, stagger: 0.1 });
  return (
    <section
      ref={ref}
      className="py-section-y bg-[var(--color-beige)]"
      aria-labelledby="how-tech-heading"
    >
      <Container width="narrow">
        <p data-reveal className="eyebrow">
          {t('how-it-works', 'technologyEyebrow')}
        </p>
        <h2
          id="how-tech-heading"
          data-reveal
          className={cn(
            'mt-3 font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-m',
          )}
        >
          {t('how-it-works', 'technologyHeadline')}
        </h2>
        <div className="mt-6 space-y-5">
          {['technologyBody1', 'technologyBody2', 'technologyBody3'].map((k) => (
            <p key={k} data-reveal className="text-body-l text-ink/90 leading-relaxed">
              {t('how-it-works', k)}
            </p>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---- Comparison block (simplified text version per §2.7) ---- */

const COMPARISON_FACTS = [
  { label: 'comparisonRow1Label', furnish: true, others: false },
  { label: 'comparisonRow2Label', furnish: true, others: false },
  { label: 'comparisonRow3Label', furnish: true, others: false },
];

export function HowItWorksComparison() {
  const ref = useScrollReveal<HTMLElement>({ yOffset: 30, stagger: 0.08 });
  return (
    <section
      ref={ref}
      className="py-section-y"
      aria-labelledby="how-comparison-heading"
    >
      <Container width="narrow" className="text-center">
        <p data-reveal className="eyebrow">
          {t('how-it-works', 'comparisonEyebrow')}
        </p>
        <h2
          id="how-comparison-heading"
          data-reveal
          className={cn(
            'mt-3 font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-m',
          )}
        >
          {t('how-it-works', 'comparisonHeadline')}
        </h2>
        <ul
          data-reveal
          className="mt-section-y-tight mx-auto max-w-md space-y-3 text-left"
        >
          {COMPARISON_FACTS.map((fact) => (
            <li
              key={fact.label}
              className={cn(
                'flex items-start gap-3 rounded-[var(--radius-sm)]',
                'border border-[var(--color-accent)]/15',
                'bg-[var(--color-accent)]/5 px-4 py-3',
              )}
            >
              <Check
                size={20}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                aria-hidden="true"
              />
              <span className="text-body-m text-ink">
                {t('how-it-works', fact.label)}
              </span>
            </li>
          ))}
        </ul>
        <p data-reveal className="mt-6 text-body-s text-muted">
          {t('how-it-works', 'comparisonFootnote')}
        </p>
        <Link
          href="/#why-furnish"
          className="mt-3 inline-flex items-center text-body-m font-semibold text-[var(--color-accent)] hover:underline underline-offset-4"
        >
          {t('how-it-works', 'comparisonHomeLink')}
          <span aria-hidden="true">&nbsp;→</span>
        </Link>
      </Container>
    </section>
  );
}
