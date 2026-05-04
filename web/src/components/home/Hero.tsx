'use client';

/*
  Home page Hero, text-forward.

  No room photo. No portrait. The headline is the entire visual
  weight. Centered, generous whitespace, single column. Matches the
  Linear / Apple "premium product page" pattern.

  Layout:
  - Section is min-h-[90vh] (or min-h-screen on lg) with vertically
    centered content. A subtle Lottie arrow sits pinned to the
    bottom of the section as a scroll-down indicator.
  - Content column max-w-4xl, centered.
  - Headline 3 lines, leading-[1.05] (loosened from the previous
    too-tight 0.92), each line nowrap so it doesn't break in
    awkward places on tablet widths.
  - Eyebrow (the locked tagline) above the headline.
  - Subheadline below.
  - 2 CTAs centered horizontally.
  - Sub-CTA caption.
  - Pre-launch only: a small Hello-welcome Lottie above the
    waitlist form as warm accent.
*/

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/Container';
import { EmailWaitlist } from '@/components/shared/EmailWaitlist';
import { LottieAsset } from '@/components/shared/LottieAsset';
import { useHeroSequence } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

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

export function Hero() {
  const heroRef = useHeroSequence<HTMLElement>();

  const primaryCtaText = APP_LAUNCHED
    ? t('common', 'ctaAppStore')
    : t('common', 'ctaWaitlist');

  const primaryCtaHref = APP_LAUNCHED ? APP_STORE_URL : '#waitlist';

  return (
    <section
      ref={heroRef}
      className={cn(
        'relative bg-cream',
        'min-h-[90vh] lg:min-h-screen',
        'flex flex-col',
      )}
    >
      <Container
        width="default"
        className="flex flex-1 items-center pt-24 pb-10 lg:pt-12 lg:pb-12"
      >
        {/* Single centered column. */}
        <div className="mx-auto w-full max-w-4xl text-center">
          <p data-hero-eyebrow className="eyebrow">
            {t('common', 'tagline')}
          </p>

          <h1
            className={cn(
              'mt-5 font-display text-deep',
              'tracking-display-tight leading-[1.05]',
              'text-display-l lg:text-display-xl',
            )}
          >
            <span
              data-hero-headline-line
              className="block whitespace-nowrap"
            >
              {t('home', 'heroLine1')}
            </span>
            <span
              data-hero-headline-line
              className="block whitespace-nowrap"
            >
              {t('home', 'heroLine2')}
            </span>
            <span
              data-hero-headline-line
              className="block whitespace-nowrap"
            >
              {t('home', 'heroLine3')}
            </span>
          </h1>

          <p
            data-hero-subhead
            className={cn(
              'mx-auto mt-6 max-w-2xl text-body-xl text-ink',
              'opacity-90',
            )}
          >
            {t('home', 'heroSubheadline')}
          </p>

          <div
            className={cn(
              'mt-8 flex flex-col gap-3',
              'sm:flex-row sm:items-center sm:justify-center',
            )}
          >
            {APP_LAUNCHED ? (
              <Link
                data-hero-cta-primary
                href={primaryCtaHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track('home_hero_cta_click', { cta_text: 'app_store' })
                }
                className={primaryCtaClasses}
              >
                {primaryCtaText}
                <ArrowRight
                  size={18}
                  strokeWidth={1.5}
                  className="cta-arrow"
                />
              </Link>
            ) : (
              <a
                data-hero-cta-primary
                href="#waitlist"
                onClick={() =>
                  track('home_hero_cta_click', { cta_text: 'waitlist' })
                }
                className={primaryCtaClasses}
              >
                {primaryCtaText}
                <ArrowRight
                  size={18}
                  strokeWidth={1.5}
                  className="cta-arrow"
                />
              </a>
            )}
            <a
              data-hero-cta-secondary
              href="#how-it-works"
              onClick={() => track('home_secondary_cta_click')}
              className={secondaryCtaClasses}
            >
              {t('home', 'heroCtaSecondary')}
            </a>
          </div>

          <p className="mt-4 text-body-s text-muted">
            {APP_LAUNCHED
              ? t('home', 'heroSubCtaPostLaunch')
              : t('home', 'heroSubCtaPreLaunch')}
          </p>

          {/* Pre-launch waitlist with Hello-welcome Lottie accent. */}
          {!APP_LAUNCHED && (
            <div
              id="waitlist"
              className={cn(
                'mt-10 mx-auto max-w-md',
                'scroll-mt-24',
                'flex flex-col items-center gap-3',
              )}
            >
              <LottieAsset
                src="/Animations/Lottie/Hello-welcome.web.lottie"
                className="h-14 w-14"
                tint="warm"
                ariaLabel=""
              />
              <div className="w-full">
                <EmailWaitlist location="hero" />
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* Scroll-down cue. Sits pinned to the bottom of the section
          regardless of content height. Tiny, decorative, low-key. */}
      <div
        className={cn(
          'pb-8 flex justify-center pointer-events-none',
          'opacity-60',
        )}
        aria-hidden="true"
      >
        <LottieAsset
          src="/Animations/Lottie/Arrow%201.lottie"
          className="h-10 w-10"
          tint="warm"
        />
      </div>
    </section>
  );
}
