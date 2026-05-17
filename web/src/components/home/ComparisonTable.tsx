'use client';

/*
  Comparison table per Document 5 Section 6, with a Phase-2 visual
  overhaul (2026-05-16) to amplify Furnish-column dominance and mute
  the competitors so the punchline cells ("30 seconds", "Free") do
  more visual work.

  Changes vs the prior iteration:
    - Grid widened on the Furnish column (1.4fr/1.8fr/1fr/1fr/1fr)
      so Furnish reads ~30% of table width vs ~16% for each
      competitor.
    - Furnish column background switched from accent/10 (a near-
      invisible 10% bronze tint) to var(--color-cream), the
      lightest brand color, which now pops against the beige
      section background.
    - Furnish header switched from body-l accent to display-m accent
      semibold, so the column visibly outranks the competitor
      headers which dropped to body-s muted.
    - Emphasized cells ("30 seconds", "Free") jumped from body-l to
      display-m on the Furnish side; competitors dropped from
      body-l ink/80 to body-s muted. The contrast IS the persuasion.
    - Feature labels in the leftmost column went from body-m ink to
      body-m deep semibold so the eye sweep reads label -> Furnish
      cell instead of label -> read every cell.
    - Boolean cells: Furnish keeps its accent-color size-22 check;
      competitor checks dropped from text-ok (green) to text-muted
      (neutral) so their "yes" doesn't compete with Furnish's "yes".
      No marks switched from text-danger desaturated red to neutral
      text-muted, keeping the warm palette intact (red was clashing).

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
    furnish: '30 seconds',
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
        size={isFurnish ? 22 : 16}
        strokeWidth={2}
        className={cn(
          /* Furnish keeps accent bronze + larger. Competitor checks
             render in neutral muted so their "yes" doesn't compete
             visually with Furnish's "yes". */
          isFurnish ? 'text-[var(--color-accent)]' : 'text-muted/70',
          'mx-auto',
        )}
        aria-label="Yes"
      />
    ) : (
      <X
        size={14}
        strokeWidth={1.5}
        /* Neutral muted instead of desaturated danger red. Red was
           clashing with the warm cream/bronze palette. */
        className="mx-auto text-muted/60"
        aria-label="No"
      />
    );
  }

  /* Furnish + emphasize: display-m bronze, the punchline cells.
     Furnish + non-emphasize: body-m deep semibold, heavier but not
       table-busting.
     Competitor (any row): body-s muted, smaller and lighter so the
       eye registers Furnish first and drifts to competitors only
       on second pass. The CONTRAST is the persuasion. */
  if (isFurnish && emphasize) {
    /* Terracotta instead of bronze on emphasized cells ("30 seconds",
       "Free"). Bronze was already the column header + ✓ marks color,
       the eye had no escalation when it reached the punchline cell.
       Terracotta is bronze's red-shifted sibling (same green + blue
       channels, R bumped from 0x8B to 0xBA), so it harmonizes while
       reading visibly hotter than the rest of the column. Passes
       WCAG AAA on cream at display-m size. */
    return (
      <span
        className={cn(
          'block text-center',
          'font-display font-semibold',
          'text-display-m text-[var(--color-terracotta)]',
          'tracking-display-tight leading-display-tight',
        )}
      >
        {value}
      </span>
    );
  }
  if (isFurnish) {
    return (
      <span className="block text-center text-body-m font-semibold text-deep">
        {value}
      </span>
    );
  }
  return (
    <span className="block text-center text-body-s text-muted">
      {value}
    </span>
  );
}

const primaryCtaLargeClasses = cn(
  'btn-primary-hover',
  'inline-flex items-center justify-center gap-2',
  'rounded-sm bg-[var(--color-accent)] text-cream',
  /* py-5 instead of the previous py-4.5: Tailwind v3 has no 4.5
     step, so the old class silently no-op'd and the button
     rendered at the default button height. py-5 (1.25rem) is
     the closest valid token to the intended ~1.125rem extra
     vertical padding. */
  'px-9 py-5 text-body-l font-semibold',
  'shadow-2',
);

/* Grid templates pulled out so header + every body row share the
   same widths exactly. Furnish column is widest, then feature
   labels, then the three competitors share the rest equally. */
const DESKTOP_GRID = 'grid-cols-[1.4fr_1.8fr_1fr_1fr_1fr]';
const MOBILE_GRID = 'grid-cols-[1.2fr_1.6fr_1fr]';

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
  /* '#final-waitlist' points at the FinalCTA section's existing
     id. The previous '#waitlist' had no target anywhere on the
     page so the Link silently jumped nowhere. Only used in the
     APP_LAUNCHED=true branch (which renders <Link>); the false
     branch renders a <button> that opens the modal directly. */
  const ctaHref = APP_LAUNCHED ? APP_STORE_URL : '#final-waitlist';

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
          {/* Subhead now in semibold deep, was body-xl ink/80. The
              "$5,000+ to free" framing is doing real persuasion
              work, give it weight to match. */}
          <p className="mt-4 text-body-xl font-semibold text-deep">
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

          <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--color-sage-hairline)] bg-surface">
            <div className={cn('grid border-b border-[var(--color-sage-hairline)]', MOBILE_GRID)}>
              <div className="px-3 py-3 text-body-s font-semibold text-muted">
                Feature
              </div>
              {/* Furnish mobile header: cream bg, display-l accent.
                  Punches out clearly from the muted competitor
                  header in the column next to it. */}
              <div className="bg-cream px-3 py-4 text-center font-display text-display-m font-semibold text-[var(--color-accent)] tracking-display-tight">
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
                  'grid items-center',
                  MOBILE_GRID,
                  idx % 2 === 0 ? 'bg-cream/40' : 'bg-surface',
                  'border-b border-[rgba(148,163,123,0.12)] last:border-b-0',
                )}
              >
                <div className="px-3 py-3 text-body-s font-semibold text-deep">{row.feature}</div>
                <div className="bg-cream px-3 py-3">
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
          className="mt-section-y-tight hidden overflow-hidden rounded-[var(--radius)] border border-[var(--color-sage-hairline)] bg-surface sm:block"
          data-reveal
        >
          <div className={cn('grid border-b border-[var(--color-sage-hairline)]', DESKTOP_GRID)}>
            <div className="px-4 py-4 text-body-s font-semibold uppercase tracking-wider text-muted">
              Feature
            </div>
            {/* Furnish desktop header: cream column bg + display-m
                bronze + semibold. Dominates the eye on first read. */}
            <div className="bg-cream px-4 py-5 text-center font-display text-display-m font-semibold text-[var(--color-accent)] tracking-display-tight">
              {t('home', 'comparisonColFurnish')}
            </div>
            {/* Competitor headers promoted from body-s -> body-xl
                in the same display serif as Furnish, at text-muted
                + opacity 55. The size + family match the Furnish
                column closely enough to read as four peers, but
                opacity-55 + font-normal does the subordination
                work, the data row beneath still scans cleanly.
                Display-m (the size used on the Furnish header)
                would overflow the ~16%-wide competitor columns
                at the wide-container breakpoint, so body-xl is
                the practical "as-equal-as-possible-without-
                breaking" target.

                Reference: Vercel's competitor-matrix headers on
                vercel.com/pricing where competitor column names
                sit roughly equal-sized to Vercel's but at a muted
                lower opacity. The visual impact stays: Furnish
                reads as the answer; competitors read as the
                question. */}
            <div className="px-4 py-5 text-center font-display text-body-xl font-normal text-muted opacity-55 tracking-display-tight">
              {t('home', 'comparisonColDesigner')}
            </div>
            <div className="px-4 py-5 text-center font-display text-body-xl font-normal text-muted opacity-55 tracking-display-tight">
              {t('home', 'comparisonColHavenly')}
            </div>
            <div className="px-4 py-5 text-center font-display text-body-xl font-normal text-muted opacity-55 tracking-display-tight">
              {t('home', 'comparisonColPinterest')}
            </div>
          </div>
          {ROWS.map((row, idx) => (
            <div
              key={idx}
              className={cn(
                'grid items-center',
                DESKTOP_GRID,
                idx % 2 === 0 ? 'bg-cream/40' : 'bg-surface',
                'border-b border-[rgba(148,163,123,0.12)] last:border-b-0',
              )}
            >
              <div className="px-4 py-4 text-body-m font-semibold text-deep">{row.feature}</div>
              <div className="bg-cream px-4 py-4">
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

        {/* 3-line callout below the table. Copy locked. Chromatic
            shift: the two "Stop ..." lines render in muted ink
            (the old behavior, faded out) and the "Start ..." line
            renders in bronze accent (the new behavior Furnish
            represents). The color jump on the third line is the
            visual analog of the rhetorical pivot. Same display-m
            size + leading on all three so the rhythm holds. */}
        <div
          className="mt-section-y max-w-3xl"
          data-reveal
        >
          <p
            className={cn(
              'font-display',
              'tracking-display-tight leading-display',
              'text-display-m',
            )}
          >
            <span className="block text-ink/55">
              {t('home', 'comparisonCalloutLine1')}
            </span>
            <span className="block text-ink/55">
              {t('home', 'comparisonCalloutLine2')}
            </span>
            <span className="block font-semibold text-[var(--color-accent)]">
              {t('home', 'comparisonCalloutLine3')}
            </span>
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
