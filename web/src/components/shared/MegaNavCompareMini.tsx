'use client';

/*
  Compact value table rendered in the Compare section's featured
  tile, in place of an image. Mirrors the homepage ComparisonTable
  but shows only the two punchline rows ("Time to first design"
  and "Cost per design") and only the Furnish vs Interior Designer
  columns. The framing on the surrounding featured tile copy is
  already "vs traditional designers", so showing Havenly +
  Pinterest here would dilute the comparison.

  Visual language deliberately matches the homepage table:
    - Furnish column: bg-cream, terracotta accent on the punchline
      value, font-display semibold. The CONTRAST is the persuasion.
    - Designer column: muted, smaller, semi-transparent. Reads as
      the question, not the answer.

  Self-contained: no props. The mini reuses Furnish brand strings
  from the home.json i18n bundle so a future copy change to the
  homepage table propagates here automatically.
*/

import * as React from 'react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

interface Row {
  /** Feature label shown in the leftmost column. */
  label: string;
  /** Furnish value, rendered as the dominant column. */
  furnish: string;
  /** Designer value, rendered muted. */
  designer: string;
}

const ROWS: Row[] = [
  {
    label: t('home', 'comparisonRow4'),
    furnish: '30 seconds',
    designer: '4 to 8 weeks',
  },
  {
    label: t('home', 'comparisonRow5'),
    furnish: 'Free',
    /* Matches the homepage ComparisonTable + nav-mega card copy
       exactly, so visitors see the same designer-cost framing in
       all three surfaces. */
    designer: '$2,000-$10,000',
  },
];

export function MegaNavCompareMini() {
  return (
    <div
      className={cn(
        /* Aspect ratio mirrors what featured.image would have
           occupied (wider at mobile, taller at lg+), so swapping
           image for table doesn't reflow the surrounding tile. */
        'aspect-[4/3] lg:aspect-[5/4]',
        'flex flex-col justify-center',
        'rounded-sm border border-[var(--color-sage-hairline)]',
        'bg-surface',
        'overflow-hidden',
      )}
      aria-label="Furnish versus traditional interior designer comparison"
    >
      {/* Grid template hoisted to a constant so the header row +
          both data rows share identical column widths. Tweaked
          from [1.2fr_1fr_1fr] to give the Feature column a touch
          more room ("Time to first design" still wraps to 2
          lines, but the wrap break point reads cleaner) and to
          give the Designer column the breath it needs so the
          "Interior Designer" header sits on one line. */}
      {/* Column header row. Furnish column gets bg-cream + display
          accent treatment exactly like the homepage table. */}
      <div
        className={cn(
          'grid grid-cols-[1.3fr_1fr_1.1fr]',
          'border-b border-[var(--color-sage-hairline)]',
        )}
      >
        <div className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Feature
        </div>
        <div
          className={cn(
            'bg-cream px-3 py-3 text-center',
            /* body-m (was body-l): the bg-cream column + accent
               color + display font already does the dominance
               work; the larger size on top forced data cells to
               also size up, which crashed "30 seconds" into a
               two-line wrap in the narrow column. */
            'font-display text-body-m font-semibold',
            'text-[var(--color-accent)] tracking-display-tight',
          )}
        >
          {t('home', 'comparisonColFurnish')}
        </div>
        <div
          className={cn(
            'px-3 py-3 text-center',
            /* body-s + leading-tight (was body-m): matches the
               designer-data font size so header reads as the
               column's quiet companion, and fits "Interior
               Designer" on one line at this column width. */
            'font-display text-body-s font-normal',
            'text-muted opacity-55 tracking-display-tight leading-tight',
          )}
        >
          {t('home', 'comparisonColDesigner')}
        </div>
      </div>

      {ROWS.map((row, idx) => (
        <div
          key={row.label}
          className={cn(
            'grid grid-cols-[1.3fr_1fr_1.1fr] items-center',
            idx % 2 === 0 ? 'bg-cream/40' : 'bg-surface',
            'flex-1',
          )}
        >
          <div className="px-3 py-3 text-body-s font-semibold text-deep leading-tight">
            {row.label}
          </div>
          {/* Furnish cell: terracotta, font-display, semibold.
              body-m (was body-xl -> body-l -> body-m) so values
              like "30 seconds" actually fit on a single line in
              the narrow column. The bg-cream column + terracotta
              + display semibold combo carries the visual weight;
              larger sizes broke the layout. */}
          <div className="bg-cream px-3 py-3 text-center">
            <span
              className={cn(
                'block',
                'font-display font-semibold',
                'text-body-m text-[var(--color-terracotta)]',
                'tracking-display-tight leading-tight',
              )}
            >
              {row.furnish}
            </span>
          </div>
          {/* Designer cell: small + muted, the question to
              Furnish's answer. */}
          <div className="px-3 py-3 text-center">
            <span className="block text-body-s text-muted leading-tight">
              {row.designer}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
