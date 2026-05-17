'use client';

/*
  Founder note. Originally 3 paragraphs of full bio prose; following
  Quick Fix #3 from the 2026-05-13 design review (approved by Hassan
  2026-05-13) the home version is now a single 47-word excerpt with
  a "Read the full story" link to the about page's founder section,
  where the full bio renders in the 3-card layout. Cuts ~100 words
  from the home page and eliminates the content-duplication wall
  the audit flagged.

  Section: max-width 720px, centered, page-bg (no card). Eyebrow
  plus headline plus a single excerpt paragraph plus a link to
  /about#founder-heading. Hassan signoff stays on the about page,
  not duplicated here.

  Fires home_founder_note_view once on viewport entry.
*/

import * as React from 'react';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { useScrollReveal } from '@/lib/motion';
import { useInView } from '@/lib/use-in-view';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export function FounderNote() {
  const revealRef = useScrollReveal<HTMLElement>({ yOffset: 30, stagger: 0.1 });
  const viewRef = useInView<HTMLElement>(() => {
    track('home_founder_note_view');
  });

  const setRefs = React.useCallback(
    (node: HTMLElement | null) => {
      (revealRef as React.MutableRefObject<HTMLElement | null>).current = node;
      (viewRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [revealRef, viewRef],
  );

  return (
    <section
      ref={setRefs}
      className="py-section-y"
      aria-labelledby="founder-note-heading"
    >
      <Container width="narrow">
        {/* Whole founder note wrapped in a warm beige card so the
            previously plain text-on-cream section gains visual
            weight. Generous internal padding gives the prose room
            to breathe; max-width inherited from Container narrow. */}
        <div
          className={cn(
            'rounded-[var(--radius)]',
            'bg-[var(--color-beige)]/55',
            /* Sage-hairline border, matches ComparisonTable outer
               frame + FinalCTA card. FounderNote was the lone home-
               page card still using ink/0.06 dead-grey border. Now
               every primary card on the home page shares the
               warm-tinted hairline treatment. */
            'border border-[var(--color-sage-hairline)]',
            'shadow-1',
            'p-8 sm:p-10 lg:p-14',
          )}
        >
          <div className="text-center" data-reveal>
            <p className="eyebrow">{t('home', 'founderEyebrow')}</p>
            <h2
              id="founder-note-heading"
              className={cn(
                'mt-3 font-display text-deep',
                'tracking-display-tight leading-display',
                'text-display-m',
              )}
            >
              {t('home', 'founderHeadline')}
            </h2>
          </div>

          <p
            data-reveal
            className="mt-section-y-tight text-body-l text-ink/90 leading-relaxed"
          >
            {t('home', 'founderExcerpt')}
          </p>

          <div className="mt-8 flex items-center justify-between gap-6">
            <Link
              data-reveal
              href="/about#founder-heading"
              className={cn(
                'inline-flex items-center gap-2',
                'text-body-m font-semibold text-[var(--color-accent)]',
                'underline-offset-4 hover:underline',
              )}
            >
              {t('home', 'founderReadMore')}
              <span aria-hidden="true">&rarr;</span>
            </Link>

            <p
              data-reveal
              className="text-body-l italic text-ink/80"
            >
              {t('home', 'founderSignoff')}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
