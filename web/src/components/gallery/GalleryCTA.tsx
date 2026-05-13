'use client';

/*
  Below-grid CTA per Document 6 Section 6.

  Centered single block. Eyebrow plus headline plus subheadline plus
  two CTAs (primary plus secondary). Pre-launch plus post-launch
  branching via APP_LAUNCHED.
*/

import * as React from 'react';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { useScrollReveal } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const primaryCtaClasses = cn(
  'btn-primary-hover',
  'inline-flex items-center justify-center gap-2',
  'rounded-sm bg-[var(--color-accent-peach)] text-deep',
  'px-7 py-3.5 text-body-m font-semibold',
  'shadow-1',
);

const secondaryCtaClasses = cn(
  'btn-secondary-hover',
  'inline-flex items-center justify-center gap-2',
  'rounded-sm border border-[rgba(43,30,24,0.16)] bg-transparent',
  'px-7 py-3.5 text-body-m font-semibold text-ink',
);

export function GalleryCTA() {
  const sectionRef = useScrollReveal<HTMLElement>({
    yOffset: 30,
    stagger: 0.1,
  });
  const { open: openWaitlist } = useWaitlist();

  const ctaText = APP_LAUNCHED
    ? t('common', 'ctaAppStore')
    : t('common', 'ctaWaitlist');
  const ctaHref = APP_LAUNCHED ? APP_STORE_URL : '/#waitlist';

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--color-beige)] py-section-y"
      aria-labelledby="gallery-cta-heading"
    >
      <Container width="default" className="text-center">
        <p data-reveal className="eyebrow">
          {t('gallery', 'ctaEyebrow')}
        </p>
        <h2
          id="gallery-cta-heading"
          data-reveal
          className={cn(
            'mt-3 font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-m',
          )}
        >
          {t('gallery', 'ctaHeadline')}
        </h2>
        <p data-reveal className="mt-4 mx-auto max-w-xl text-body-l text-ink/80">
          {t('gallery', 'ctaSubheadline')}
        </p>
        <div
          data-reveal
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          {APP_LAUNCHED ? (
            <Link
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('cta_click', { location: 'gallery_cta', target: 'app_store' })}
              className={primaryCtaClasses}
            >
              {ctaText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                track('cta_click', { location: 'gallery_cta', target: 'waitlist' });
                openWaitlist();
              }}
              className={primaryCtaClasses}
            >
              {ctaText}
            </button>
          )}
          <Link
            href="/how-it-works"
            onClick={() => track('cta_click', { location: 'gallery_cta', target: 'how_it_works' })}
            className={secondaryCtaClasses}
          >
            {t('gallery', 'ctaSecondary')}
          </Link>
        </div>
      </Container>
    </section>
  );
}
