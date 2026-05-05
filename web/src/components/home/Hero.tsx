'use client';

/*
  Home page Hero, 2-column on desktop:

    Desktop (lg+):
      Left column (col-span-6): eyebrow + 3-line headline + subhead +
        secondary CTA + sub-CTA caption + (pre-launch) arrow + waitlist
        form. Left-aligned text.
      Right column (col-span-6): the "Hallo" Hello-welcome Lottie at
        as-big-as-possible size without obstructing the left column.

    Mobile (below lg):
      Stacked, text-first per Hassan's earlier preference. Order:
        text + CTAs + sub-CTA → Hallo Lottie → arrow → waitlist form.
      The Hallo is sized smaller on mobile so it doesn't dominate
      before the user has read the headline.

  The primary "Join the Waitlist" CTA was previously dropped (the
  waitlist form's own submit button is the call to action). The arrow
  Lottie on the LEFT column points down at the form directly below
  it.
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
        <div
          className={cn(
            'w-full grid items-center',
            'grid-cols-1 lg:grid-cols-12',
            'gap-8 lg:gap-10 xl:gap-14',
          )}
        >
          {/* LEFT column on desktop: text + CTAs + waitlist. Mobile
              order-1 so it appears first (text-first preference). */}
          <div
            className={cn(
              'order-1 lg:order-1 lg:col-span-6',
              'text-center lg:text-left',
            )}
          >
            <p data-hero-eyebrow className="eyebrow">
              {t('common', 'tagline')}
            </p>

            <h1
              className={cn(
                'mt-5 font-display text-deep',
                'tracking-display-tight leading-[1.05]',
                /* On lg+ the headline lives in a 6-column slice so
                   we cap the size at display-l (instead of bumping to
                   display-xl) to avoid awkward mid-phrase wrapping. */
                'text-display-l',
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
                'mt-6 max-w-2xl text-body-xl text-ink',
                'mx-auto lg:mx-0',
                'opacity-90',
              )}
            >
              {t('home', 'heroSubheadline')}
            </p>

            <div
              className={cn(
                'mt-8 flex flex-col gap-3',
                'sm:flex-row sm:items-center',
                'sm:justify-center lg:justify-start',
              )}
            >
              {APP_LAUNCHED && (
                <Link
                  data-hero-cta-primary
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track('home_hero_cta_click', { cta_text: 'app_store' })
                  }
                  className={primaryCtaClasses}
                >
                  {t('common', 'ctaAppStore')}
                  <ArrowRight
                    size={18}
                    strokeWidth={1.5}
                    className="cta-arrow"
                  />
                </Link>
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

            {/* Pre-launch waitlist block.

                Mobile: arrow Lottie ABOVE the form pointing DOWN at
                it (Hassan: "the arrow looks perfect on mobile").

                Desktop (lg+): arrow Lottie BELOW the form, FLIPPED
                180° so it points UP at the form's "Join the waitlist"
                submit button. The mobile arrow is hidden on lg, the
                desktop arrow is hidden below lg. Two LottieAsset
                instances rather than one positioned conditionally —
                keeps the JSX flat and avoids order-class gymnastics. */}
            {!APP_LAUNCHED && (
              <div
                id="waitlist"
                className={cn(
                  'mt-10 scroll-mt-24',
                  'flex flex-col items-center',
                  'lg:items-start',
                  'mx-auto lg:mx-0',
                  'max-w-md',
                )}
              >
                {/* Mobile-only arrow above form, pointing down. */}
                <LottieAsset
                  src="/Animations/Lottie/Arrow%201.lottie"
                  className={cn(
                    'lg:hidden',
                    '-mt-2 h-32 w-32 sm:h-36 sm:w-36',
                    'opacity-80',
                  )}
                  tint="warm"
                  ariaLabel=""
                />

                <div className="mt-2 lg:mt-0 w-full">
                  <EmailWaitlist location="hero" />
                </div>

                {/* Desktop-only arrow below form, flipped to point UP
                    at the "Join the waitlist" submit button. */}
                <LottieAsset
                  src="/Animations/Lottie/Arrow%201.lottie"
                  className={cn(
                    'hidden lg:block',
                    'mt-2 h-28 w-28 xl:h-32 xl:w-32',
                    'rotate-180 opacity-80',
                  )}
                  tint="warm"
                  ariaLabel=""
                />
              </div>
            )}
          </div>

          {/* RIGHT column on desktop: HALLO Lottie. Mobile order-2 so
              it appears below the text content. */}
          <div
            className={cn(
              'order-2 lg:order-2 lg:col-span-6',
              'flex justify-center lg:justify-end',
            )}
          >
            <LottieAsset
              src="/Animations/Lottie/Hello-welcome.web.lottie"
              className={cn(
                'w-full',
                /* Sized big but constrained so it doesn't obstruct
                   the LEFT column on desktop. On mobile it goes
                   smaller because it's competing with text below. */
                'max-w-[22rem] sm:max-w-[30rem]',
                'lg:max-w-[36rem] xl:max-w-[42rem]',
                'aspect-square',
              )}
              ariaLabel=""
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
