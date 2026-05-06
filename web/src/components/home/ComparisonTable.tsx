'use client';

/*
  Comparison table per Document 5 Section 6.

  5 columns x 8 rows. Furnish column gets accent-tinted background,
  bold borders, raised shadow. Other columns are neutral.

  Cost row emphasized: "Free" in Furnish column gets display-font
  treatment. Time row emphasized similarly with "8 seconds".

  Mobile: collapsed "tap to compare" pattern. User picks one
  competitor at a time. Cleaner than horizontal scroll on small
  screens.

  3-line callout below the table is locked. Final CTA below the
  callout fires home_final_cta_click... wait, that fires from the
  FinalCTA section. Here the comparison-table CTA fires
  home_hero_cta_click with location prop set to comparison-table.

  Section anchored as id="why-furnish".
  Fires home_comparison_table_view once on viewport entry.
*/

import * as React from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Container } from '@/components/Container';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { useScrollReveal } from '@/lib/motion';
import { useInView } from '@/lib/use-in-view';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { cn } from '@/lib/utils';

type CompetitorKey = 'furnish' | 'designer' | 'havenly' | 'pinterest';

interface Row {
  feature: string;
  furnish: string | boolean;
  designer: string | boolean;
  havenly: string | boolean;
  pinterest: string | boolean;
  emphasize?: boolean;
}

const ROWS: Row[] = [
  { feature: t('home', 'comparisonRow1'), furnish: true, designer: true, havenly: true, pinterest: false },
  { feature: t('home', 'comparisonRow2'), furnish: true, designer: true, havenly: true, pinterest: false },
  { feature: t('home', 'comparisonRow3'), furnish: true, designer: false, havenly: false, pinterest: false },
  {
    feature: t('home', 'comparisonRow4'),
    furnish: '8 seconds',
    designer: '4 to 8 weeks',
    havenly: '1 to 2 weeks',
    pinterest: 'Never',
    emphasize: true,
  },
  {
    feature: t('home', 'comparisonRow5'),
    furnish: 'Free',
    designer: '$2,000-$10,000',
    havenly: '$79-$1,599',
    pinterest: 'Free (no design)',
    emphasize: true,
  },
  { feature: t('home', 'comparisonRow6'), furnish: 'Unlimited', designer: 'Hourly fees', havenly: 'Limited', pinterest: 'N/A' },
  { feature: t('home', 'comparisonRow7'), furnish: 'Any', designer: "Designer's choice", havenly: 'Limited', pinterest: 'N/A' },
  { feature: t('home', 'comparisonRow8'), furnish: true, designer: 'Sometimes', havenly: 'Sometimes', pinterest: false },
];

function CellValue({
  value,
  isFurnish,
  emphasize,
}: {
  value: string | boolean;
  isFurnish: boolean;
  emphasize?: boolean;
}) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check
        size={isFurnish ? 22 : 18}
        strokeWidth={2}
        className={cn(
          isFurnish ? 'text-[var(--color-accent)]' : 'text-ok',
          'mx-auto',
        )}
        aria-label="Yes"
      />
    ) : (
      <X
        size={16}
        strokeWidth={1.5}
        className="mx-auto text-[var(--color-danger)]/70"
        aria-label="No"
      />
    );
  }

  /* String value: emphasize the Furnish column when the row is
     marked emphasize (cost, time). Previously this used
     `text-display-m` (a heading size) inside the table cell, which
     made "8 seconds" and "Free" balloon to ~3x the height of every
     other row and broke the table's visual rhythm. Now uses the
     same body-l size as the rest, but in display font, accent
     color, and slightly heavier — visually distinguished without
     the table-busting size jump. */
  const accent = isFurnish && emphasize;
  return (
    <span
      className={cn(
        'block text-center',
        accent
          ? 'font-display font-semibold text-body-l text-[var(--color-accent)] tracking-display-tight'
          : isFurnish
            ? 'font-semibold text-deep'
            : 'text-ink/80',
      )}
    >
      {value}
    </span>
  );
}

const primaryCtaLargeClasses = cn(
  'btn-primary-hover',
  'inline-flex items-center justify-center gap-2',
  'rounded-sm bg-[var(--color-accent)] text-cream',
  'px-9 py-4.5 text-body-l font-semibold',
  'shadow-2',
);

export function ComparisonTable() {
  const revealRef = useScrollReveal<HTMLElement>({ yOffset: 40, stagger: 0.08 });
  const viewRef = useInView<HTMLElement>(() => {
    track('home_comparison_table_view');
  });
  const [activeCompetitor, setActiveCompetitor] =
    React.useState<CompetitorKey>('designer');

  const setRefs = React.useCallback(
    (node: HTMLElement | null) => {
      (revealRef as React.MutableRefObject<HTMLElement | null>).current = node;
      (viewRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [revealRef, viewRef],
  );

  const { open: openWaitlist } = useWaitlist();
  const ctaText = APP_LAUNCHED
    ? t('common', 'ctaAppStore')
    : t('common', 'ctaWaitlist');
  const ctaHref = APP_LAUNCHED ? APP_STORE_URL : '#waitlist';

  const competitors: Array<{ key: CompetitorKey; label: string }> = [
    { key: 'designer', label: t('home', 'comparisonColDesigner') },
    { key: 'havenly', label: t('home', 'comparisonColHavenly') },
    { key: 'pinterest', label: t('home', 'comparisonColPinterest') },
  ];

  return (
    <section
      id="why-furnish"
      ref={setRefs}
      className="scroll-mt-24 bg-[var(--color-beige)] py-section-y"
      aria-labelledby="comparison-heading"
    >
      <Container width="default">
        <div className="text-center" data-reveal>
          <p className="eyebrow">{t('home', 'comparisonEyebrow')}</p>
          <h2
            id="comparison-heading"
            className={cn(
              'mt-3 font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-l',
            )}
          >
            {t('home', 'comparisonHeadline')}
          </h2>
          <p className="mt-4 text-body-xl text-ink/80">
            {t('home', 'comparisonSubheadline')}
          </p>
        </div>

        {/* Mobile: tap-to-compare. Tabs swap one competitor in/out. */}
        <div className="mt-section-y-tight sm:hidden" data-reveal>
          <div className="mb-4 flex flex-wrap gap-2">
            {competitors.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCompetitor(c.key)}
                className={cn(
                  'rounded-full border px-4 py-2 text-body-s font-semibold',
                  activeCompetitor === c.key
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-cream'
                    : 'border-[rgba(43,30,24,0.16)] bg-surface text-ink',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-[var(--radius)] border border-[rgba(43,30,24,0.08)] bg-surface">
            <div className="grid grid-cols-3 border-b border-[rgba(43,30,24,0.08)]">
              <div className="px-3 py-3 text-body-s font-semibold text-muted">
                Feature
              </div>
              <div className="bg-[var(--color-accent)]/10 px-3 py-3 text-center text-body-s font-semibold text-[var(--color-accent)]">
                {t('home', 'comparisonColFurnish')}
              </div>
              <div className="px-3 py-3 text-center text-body-s font-semibold text-muted">
                {competitors.find((c) => c.key === activeCompetitor)?.label}
              </div>
            </div>
            {ROWS.map((row, idx) => (
              <div
                key={idx}
                className={cn(
                  'grid grid-cols-3 items-center',
                  idx % 2 === 0 ? 'bg-cream/40' : 'bg-surface',
                  'border-b border-[rgba(43,30,24,0.06)] last:border-b-0',
                )}
              >
                <div className="px-3 py-3 text-body-s text-ink">{row.feature}</div>
                <div className="bg-[var(--color-accent)]/10 px-3 py-3">
                  <CellValue value={row.furnish} isFurnish emphasize={row.emphasize} />
                </div>
                <div className="px-3 py-3">
                  <CellValue
                    value={row[activeCompetitor]}
                    isFurnish={false}
                    emphasize={row.emphasize}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: full 5-column table. */}
        <div
          className="mt-section-y-tight hidden overflow-hidden rounded-[var(--radius)] border border-[rgba(43,30,24,0.08)] bg-surface sm:block"
          data-reveal
        >
          <div className="grid grid-cols-5 border-b border-[rgba(43,30,24,0.08)]">
            <div className="px-4 py-4 text-body-s font-semibold uppercase tracking-wider text-muted">
              Feature
            </div>
            <div className="bg-[var(--color-accent)]/10 px-4 py-4 text-center font-display text-body-l text-[var(--color-accent)]">
              {t('home', 'comparisonColFurnish')}
            </div>
            <div className="px-4 py-4 text-center text-body-m font-semibold text-muted">
              {t('home', 'comparisonColDesigner')}
            </div>
            <div className="px-4 py-4 text-center text-body-m font-semibold text-muted">
              {t('home', 'comparisonColHavenly')}
            </div>
            <div className="px-4 py-4 text-center text-body-m font-semibold text-muted">
              {t('home', 'comparisonColPinterest')}
            </div>
          </div>
          {ROWS.map((row, idx) => (
            <div
              key={idx}
              className={cn(
                'grid grid-cols-5 items-center',
                idx % 2 === 0 ? 'bg-cream/40' : 'bg-surface',
                'border-b border-[rgba(43,30,24,0.06)] last:border-b-0',
              )}
            >
              <div className="px-4 py-4 text-body-m text-ink">{row.feature}</div>
              <div className="bg-[var(--color-accent)]/10 px-4 py-4">
                <CellValue value={row.furnish} isFurnish emphasize={row.emphasize} />
              </div>
              <div className="px-4 py-4">
                <CellValue value={row.designer} isFurnish={false} emphasize={row.emphasize} />
              </div>
              <div className="px-4 py-4">
                <CellValue value={row.havenly} isFurnish={false} emphasize={row.emphasize} />
              </div>
              <div className="px-4 py-4">
                <CellValue value={row.pinterest} isFurnish={false} emphasize={row.emphasize} />
              </div>
            </div>
          ))}
        </div>

        {/* 3-line callout below the table. Locked copy. */}
        <div
          className="mt-section-y max-w-3xl"
          data-reveal
        >
          <p
            className={cn(
              'font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-m',
            )}
          >
            <span className="block">{t('home', 'comparisonCalloutLine1')}</span>
            <span className="block">{t('home', 'comparisonCalloutLine2')}</span>
            <span className="block">{t('home', 'comparisonCalloutLine3')}</span>
          </p>
        </div>

        <div className="mt-section-y-tight" data-reveal>
          {APP_LAUNCHED ? (
            <Link
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track('home_hero_cta_click', {
                  cta_text: 'app_store',
                  location: 'comparison_table',
                })
              }
              className={primaryCtaLargeClasses}
            >
              {ctaText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                track('home_hero_cta_click', {
                  cta_text: 'waitlist',
                  location: 'comparison_table',
                });
                openWaitlist();
              }}
              className={primaryCtaLargeClasses}
            >
              {ctaText}
            </button>
          )}
        </div>
      </Container>
    </section>
  );
}
