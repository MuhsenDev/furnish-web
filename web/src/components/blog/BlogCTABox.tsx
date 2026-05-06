'use client';

/*
  In-post CTA. Embedded in the middle and at the end of each post.
  Pre-launch shows Join the Waitlist linking to home #waitlist.
  Post-launch shows Get the App with App Store URL.

  Designed to feel like an editorial pull-quote: warm tinted bg,
  rounded card, clear hierarchy. Not a hard sell.
*/

import * as React from 'react';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { track } from '@/lib/analytics';

export interface BlogCTABoxProps {
  /** Optional post slug for analytics attribution. */
  postSlug?: string;
  className?: string;
}

const primaryCtaClasses = cn(
  'btn-primary-hover',
  'inline-flex items-center justify-center gap-2',
  'rounded-sm bg-[var(--color-accent)] text-cream',
  'px-7 py-3.5 text-body-m font-semibold',
  'shadow-1',
);

const secondaryCtaClasses = cn(
  'btn-secondary-hover',
  'inline-flex items-center justify-center gap-2',
  'rounded-sm border border-[rgba(43,30,24,0.16)] bg-transparent',
  'px-7 py-3.5 text-body-m font-semibold text-ink',
);

export function BlogCTABox({ postSlug, className }: BlogCTABoxProps) {
  const { open: openWaitlist } = useWaitlist();
  const ctaText = APP_LAUNCHED
    ? t('common', 'ctaAppStore')
    : t('common', 'ctaWaitlist');
  const ctaHref = APP_LAUNCHED ? APP_STORE_URL : '/#waitlist';

  return (
    <Container width="narrow" className={cn('my-section-y-tight', className)}>
      <div
        className={cn(
          'rounded-[var(--radius)]',
          'bg-[var(--color-beige)]',
          'px-6 py-8 sm:px-8 sm:py-10',
          'text-center',
        )}
      >
        <p className="eyebrow">{t('blog', 'ctaBoxEyebrow')}</p>
        <h2
          className={cn(
            'mt-3 font-display text-deep',
            'tracking-display-tight leading-display',
            'text-display-m',
          )}
        >
          {t('blog', 'ctaBoxHeadline')}
        </h2>
        <p className="mt-4 mx-auto max-w-xl text-body-l text-ink/80">
          {t('blog', 'ctaBoxBody')}
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {APP_LAUNCHED ? (
            <Link
              href={ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track('blog_cta_click', {
                  target: 'app_store',
                  ...(postSlug ? { post: postSlug } : {}),
                })
              }
              className={primaryCtaClasses}
            >
              {ctaText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                track('blog_cta_click', {
                  target: 'waitlist',
                  ...(postSlug ? { post: postSlug } : {}),
                });
                openWaitlist();
              }}
              className={primaryCtaClasses}
            >
              {ctaText}
            </button>
          )}
          <Link
            href="/how-it-works"
            onClick={() =>
              track('blog_cta_click', {
                target: 'how_it_works',
                ...(postSlug ? { post: postSlug } : {}),
              })
            }
            className={secondaryCtaClasses}
          >
            {t('blog', 'ctaBoxSecondary')}
          </Link>
        </div>
      </div>
    </Container>
  );
}
