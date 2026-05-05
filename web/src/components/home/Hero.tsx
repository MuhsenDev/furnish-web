'use client';

/*
  Home page Hero, 2-column on desktop.

  Desktop (lg+): left column = eyebrow + headline + subhead + CTAs.
  Right column = hand-wave Lottie + "Furnish" wordmark + a second
  mirrored hand at the bottom-right.

  Mobile: stacked, text-first. Same content, just stacked.

  CTAs in this iteration:
  - Removed the inline EmailWaitlist form from the hero entirely.
  - Removed the arrow Lottie pointing at the form.
  - Added a primary "Join the Waitlist" button next to the secondary
    "See How It Works". Both render side-by-side on sm+, stacked
    on mobile.
  - Pre-launch: the primary CTA opens a WaitlistModal that explains
    how the waitlist works and collects the email. Post-launch:
    the primary CTA links to the App Store as before.

  Right column visual: the Lottie has had its "Haloo" letter
  outlines stripped from the .lottie file. The "Furnish" wordmark
  is overlaid as HTML text in display serif. A second instance of
  the same Lottie sits at the bottom-right with `scaleX(-1)` so a
  second hand waves from the opposite direction.
*/

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/Container';
import { LottieAsset } from '@/components/shared/LottieAsset';
import { WaitlistModal } from '@/components/shared/WaitlistModal';
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
  const [waitlistOpen, setWaitlistOpen] = React.useState(false);

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
          {/* LEFT column: text + CTAs. */}
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
                'text-display-l',
              )}
            >
              <span data-hero-headline-line className="block whitespace-nowrap">
                {t('home', 'heroLine1')}
              </span>
              <span data-hero-headline-line className="block whitespace-nowrap">
                {t('home', 'heroLine2')}
              </span>
              <span data-hero-headline-line className="block whitespace-nowrap">
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

            {/* CTAs: primary "Join the Waitlist" + secondary "See
                How It Works" side-by-side on sm+, stacked on mobile.
                Pre-launch primary opens the WaitlistModal; post-
                launch links to the App Store. */}
            <div
              className={cn(
                'mt-8 flex flex-col gap-3',
                'sm:flex-row sm:items-center',
                'sm:justify-center lg:justify-start',
              )}
            >
              {APP_LAUNCHED ? (
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
              ) : (
                <button
                  type="button"
                  data-hero-cta-primary
                  onClick={() => {
                    track('home_hero_cta_click', { cta_text: 'waitlist' });
                    setWaitlistOpen(true);
                  }}
                  className={primaryCtaClasses}
                >
                  {t('home', 'waitlistButton')}
                  <ArrowRight
                    size={18}
                    strokeWidth={1.5}
                    className="cta-arrow"
                  />
                </button>
              )}

              <Link
                data-hero-cta-secondary
                href="/how-it-works"
                onClick={() => track('home_secondary_cta_click')}
                className={secondaryCtaClasses}
              >
                {t('home', 'heroCtaSecondary')}
              </Link>
            </div>

            <p className="mt-4 text-body-s text-muted">
              {APP_LAUNCHED
                ? t('home', 'heroSubCtaPostLaunch')
                : t('home', 'heroSubCtaPreLaunch')}
            </p>
          </div>

          {/* RIGHT column: hand-wave Lottie + "Furnish" wordmark
              overlay + second mirrored hand at bottom-right. */}
          <div
            className={cn(
              'order-2 lg:order-2 lg:col-span-6',
              'flex justify-center lg:justify-end',
            )}
          >
            <div
              className={cn(
                'relative w-full',
                'max-w-[22rem] sm:max-w-[30rem]',
                'lg:max-w-[36rem] xl:max-w-[42rem]',
                'aspect-square',
              )}
            >
              {/* Primary hand wave (existing). */}
              <LottieAsset
                src="/Animations/Lottie/Hello-welcome.web.lottie"
                className="absolute inset-0 h-full w-full"
                ariaLabel=""
              />

              {/* Furnish wordmark overlay. */}
              <span
                className={cn(
                  'absolute inset-x-0 bottom-[14%]',
                  'text-center',
                  'font-display tracking-display-tight',
                  'pointer-events-none',
                  /* `wordmark-wave` keyframe in globals.css. */
                  'wordmark-wave',
                )}
                style={{
                  color: 'var(--color-deep)',
                  fontSize: 'clamp(3rem, 11vw, 9rem)',
                  lineHeight: '1',
                }}
              >
                Furnish
              </span>

              {/* Second hand at bottom-right, mirrored horizontally
                  via scaleX(-1) so it waves from the opposite
                  direction. Smaller so it reads as a secondary
                  accent rather than competing with the primary. */}
              <div
                className={cn(
                  'absolute bottom-[-4%] right-[-2%]',
                  'h-[40%] w-[40%]',
                  'pointer-events-none',
                )}
                style={{ transform: 'scaleX(-1)' }}
                aria-hidden="true"
              >
                <LottieAsset
                  src="/Animations/Lottie/Hello-welcome.web.lottie"
                  className="h-full w-full"
                  ariaLabel=""
                />
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Waitlist modal. Mounted always (when pre-launch); the
          component returns null when `open` is false so it's free
          when not displayed. */}
      {!APP_LAUNCHED && (
        <WaitlistModal
          open={waitlistOpen}
          onClose={() => setWaitlistOpen(false)}
        />
      )}
    </section>
  );
}
