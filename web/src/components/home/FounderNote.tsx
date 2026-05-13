'use client';

/*
  Founder note per Document 5 Section 7. Locked copy: 3 paragraphs,
  Hassan signoff, no last name in signoff. No photo unless Hassan
  supplies one (none yet, so text-only).

  Section: max-width 720px, centered, page-bg (no card). Eyebrow
  plus headline plus 3 paragraphs plus right-aligned signoff.

  Fires home_founder_note_view once on viewport entry.
*/

import * as React from 'react';
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
        {/* Founder note card, peach-tinted (2026-05 brand expansion).
            Previously bg-beige/55. Switched to --color-peach-tint
            (#FCEDE7) so this whole section becomes one of the major
            peach surfaces on the home page, giving peach the same
            kind of full-section presence that bronze gets through
            CTAs and link underlines. The text stays ink/deep
            against the peach-tint bg for WCAG AAA contrast. */}
        <div
          className={cn(
            'rounded-[var(--radius)]',
            'bg-[var(--color-peach-tint)]',
            'border border-[rgba(43,30,24,0.06)]',
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

          <div className="mt-section-y-tight space-y-5">
            <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
              {t('home', 'founderParagraph1')}
            </p>
            <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
              {t('home', 'founderParagraph2')}
            </p>
            <p data-reveal className="text-body-l text-ink/90 leading-relaxed">
              {t('home', 'founderParagraph3')}
            </p>
          </div>

          <p
            data-reveal
            className={cn(
              'mt-8 text-right text-body-l italic',
              'text-ink/80',
            )}
          >
            {t('home', 'founderSignoff')}
          </p>
        </div>
      </Container>
    </section>
  );
}
