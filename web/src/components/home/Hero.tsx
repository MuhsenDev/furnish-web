'use client';

/*
  Home page Hero, text-forward.

  No room photo. No portrait. The headline is the entire visual
  weight. Centered, generous whitespace, single column. Linear /
  Apple "premium product page" pattern.

  Pre-launch variant (current shipped state):
  - Headline + supporting text + secondary CTA only
  - Below the secondary CTA: a generous Hello-welcome Lottie (now
    big, no warm-tint filter, green-screen layer stripped from the
    .lottie file so it sits transparently on the cream background)
  - Below the Lottie: an arrow Lottie pointing DOWN at the waitlist
    form
  - Below the arrow: the inline waitlist form (which has its own
    "Join the Waitlist" submit button — that's the one Hassan kept)

  Removed in this iteration: the duplicate primary CTA above the
  waitlist form (Hassan's note: "remove the 'Join' button"). The
  waitlist form's own submit button IS the call to action; the
  arrow points the user at it.

  Post-launch variant: keeps the App Store CTA where the primary
  CTA used to be. The Lottie + arrow + waitlist block isn't
  rendered post-launch.
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

          {/* CTAs row.
              Post-launch: App Store CTA + secondary "See How It
              Works".
              Pre-launch: secondary CTA only. The "Join the Waitlist"
              CTA used to live here too but was removed; the waitlist
              form's own submit button below is the call to action. */}
          <div
            className={cn(
              'mt-8 flex flex-col gap-3',
              'sm:flex-row sm:items-center sm:justify-center',
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

          {/* Pre-launch only: Hello-welcome Lottie (big, no tint),
              arrow Lottie pointing at the waitlist form, and the
              waitlist form itself. */}
          {!APP_LAUNCHED && (
            <div
              id="waitlist"
              className={cn(
                'mt-12 mx-auto max-w-md',
                'scroll-mt-24',
                'flex flex-col items-center',
              )}
            >
              {/* Hello-welcome — sized big now per Hassan. The
                  .lottie file had its green-screen background layer
                  stripped so it sits cleanly on the cream BG. No
                  CSS tint applied because the source colors are now
                  on-brand against cream. */}
              <LottieAsset
                src="/Animations/Lottie/Hello-welcome.web.lottie"
                className="h-40 w-40 sm:h-48 sm:w-48"
                ariaLabel=""
              />

              {/* Arrow pointing down at the waitlist form. Sized
                  bigger than the previous bottom-of-section cue
                  since this one is functional, not decorative. */}
              <LottieAsset
                src="/Animations/Lottie/Arrow%201.lottie"
                className="-mt-2 h-14 w-14 opacity-80"
                tint="warm"
                ariaLabel=""
              />

              <div className="mt-2 w-full">
                <EmailWaitlist location="hero" />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
