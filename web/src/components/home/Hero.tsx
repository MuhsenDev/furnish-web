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

  /* Stagger the secondary Lottie elements (mirrored second hand,
     walking legs) so they mount AFTER the first hand wave has had
     time to download + parse. Loading three Lottie players at once
     was contributing to the perceived slow animation start Hassan
     reported. The first hand renders immediately on mount; the
     extras pop in 350 ms later. */
  const [readyForExtras, setReadyForExtras] = React.useState(false);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setReadyForExtras(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

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

          {/* RIGHT column: a "Furnish character" composed of three
              Lottie + text elements stacked head-to-toe:
                (1) primary hand wave (top, fills wrapper),
                (2) "Furnish" wordmark (the body),
                (3) mirrored second hand at the bottom-right
                    (waving from the opposite side),
                (4) walking legs at the bottom (extending below
                    the wrapper so the character has feet).

              The wrapper max-width is now tighter on desktop than
              the previous iteration so the desktop composition
              reads close to the iOS mobile layout Hassan called
              "beautiful." Previous max-w-[36/42rem] on lg/xl
              spread the hands far apart on big screens; new caps
              keep the character compact at every viewport. */}
          <div
            className={cn(
              'order-2 lg:order-2 lg:col-span-6',
              'flex justify-center lg:justify-end',
            )}
          >
            <div
              className={cn(
                'relative w-full',
                'max-w-[22rem] sm:max-w-[26rem]',
                'lg:max-w-[28rem] xl:max-w-[32rem]',
                'aspect-square',
              )}
            >
              {/* LEFT hand (not mirrored).

                  Verified-in-browser positioning (the "silly
                  mistake" fix): the visible hand actually renders
                  at (20%, 49%) of the wrapper, not (30%, 51%) as
                  earlier math assumed. Layer 1 of the Lottie
                  (animated scale 0->69%) is the rendered hand;
                  its canvas position is (204, 300) of 1000x600
                  = (20.4%, 50%). After meet-mode aspect-fit in
                  the square wrapper, that maps to (20.1%, 48%) of
                  wrapper.

                  Target: visible hand at (70%, 35%) of parent —
                  TOP-RIGHT of the "Furnish" word (wordmark sits
                  at 56-83% from top vertically, ~30-70% from
                  left visually since text-center). 35% from top
                  is well above text top (56%); 70% from left is
                  just past the right edge of the visible text.

                  Math: wrapper.left + 0.20 * 0.70 = 0.70
                        -> wrapper.left = 56% -> right -26%
                        wrapper.top + 0.49 * 0.70 = 0.35
                        -> wrapper.top = 0.7% -> top 1%

                  CSS transform scale(2.0) origin (20%, 49%) doubles
                  the hand visually without canvas clipping. The
                  scale anchor at the hand center keeps positioning
                  math intact (hand stays at 20%, 49% of wrapper
                  post-scale, just rendered larger). */}
              <div
                className={cn(
                  'absolute',
                  /* Verified-in-browser: with transform-origin
                     (20%, 49%) and scale(2.0), the visible hand
                     stays at element (20%, 49%). To land that
                     point at parent (85%, 30%) — top-right of the
                     "Furnish" word (text spans 9.7-89.9% of
                     parent, with top at 54.9%):
                       wrapper.left + 0.20 * 0.70 = 0.85
                       -> wrapper.left = 71% -> right -41%
                       wrapper.top + 0.49 * 0.70 = 0.30
                       -> wrapper.top = -4.3% -> top -4% */
                  'right-[-41%] top-[-4%]',
                  'h-[70%] w-[70%]',
                  'pointer-events-none',
                )}
                style={{
                  transform: 'scale(2.0)',
                  transformOrigin: '20% 49%',
                }}
                aria-hidden="true"
              >
                <LottieAsset
                  src="/Animations/Lottie/Hello-welcome.web.lottie"
                  className="h-full w-full"
                  ariaLabel=""
                />
              </div>

              {/* RIGHT hand (mirrored).

                  Both scaleX(-1) and scale(2.0) applied with the
                  SAME origin at (20%, 49%) — the natural hand
                  position. With this single-origin combo:
                  - scaleX(-1) origin (20%, 49%): hand at (20%, 49%)
                    stays at (20%, 49%) but mirrored (since origin
                    x = hand x).
                  - scale(2.0) origin (20%, 49%): hand stays at
                    (20%, 49%), 2x bigger.

                  So the hand stays anchored at wrapper (20%, 49%)
                  same as the LEFT hand. Wrapper position math is
                  identical to LEFT.

                  Target: visible hand at (90%, 50%) of parent —
                  to the right and lower than left hand (which is
                  at 70%, 35%), still above text top (~55%).

                  Math: wrapper.left + 0.20 * 0.70 = 0.90
                        -> wrapper.left = 76% -> right -6%
                        wrapper.top + 0.49 * 0.70 = 0.50
                        -> wrapper.top = 15.7% -> top 16%

                  Note: the previous iteration tried nested divs
                  with separate scaleX(-1) and scale(2.0) origins,
                  but the layered transform composition mirrored
                  the hand to the wrong side of the wrapper. Single
                  combined transform with shared origin solves it. */}
              {readyForExtras && (
                <div
                  className={cn(
                    'absolute',
                    /* For the mirrored hand, origin at element
                       center (50%, 50%) instead of the hand
                       position. With scale(-2, 2) + origin (50%,
                       50%), the hand at (20%, 49%) maps to:
                         x: 50 + (-2)*(20-50) = 110%
                         y: 50 + 2*(49-50) = 48%
                       So hand ends up at element (110%, 48%),
                       i.e. PAST the element's right edge (which
                       is what we want — mirrored to the right).

                       Target parent (95%, 50%):
                         wrapper.left + 1.10 * 0.70 = 0.95
                         -> wrapper.left = 18% -> right 12%
                         wrapper.top + 0.48 * 0.70 = 0.50
                         -> wrapper.top = 16.4% -> top 16%

                       NB: right-[12%] is POSITIVE (wrapper sits
                       inside parent). Earlier iteration mistakenly
                       used right-[-52%] which pushed the hand off
                       screen past the page right edge. */
                    'right-[12%] top-[16%]',
                    'h-[70%] w-[70%]',
                    'pointer-events-none',
                  )}
                  style={{
                    transform: 'scale(-2, 2)',
                  }}
                  aria-hidden="true"
                >
                  <LottieAsset
                    src="/Animations/Lottie/Hello-welcome.web.lottie"
                    className="h-full w-full"
                    ariaLabel=""
                  />
                </div>
              )}

              {/* Walking legs JUST BELOW the Furnish wordmark.
                  - Top moved from top-[80%] -> top-[82%] so the
                    legs anchor right at the text bottom edge
                    instead of leaving a gap above.
                  - Aspect ratio changed 3/4 -> 1/2 to make the
                    legs 1.5x longer (height 4/3 of width ->
                    height 2x width). Width unchanged at 78% sm:72%.
                  - Net result: legs extend further below the
                    wrapper into the cream space, reading more
                    like full character legs than just feet. */}
              {readyForExtras && (
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2',
                    'top-[82%]',
                    'w-[78%] sm:w-[72%]',
                    'aspect-[1/2]',
                    'pointer-events-none',
                  )}
                  aria-hidden="true"
                >
                  <LottieAsset
                    src="/Animations/Lottie/Legs%20Walk.lottie"
                    className="h-full w-full"
                    ariaLabel=""
                  />
                </div>
              )}

              {/* Furnish wordmark overlay. RENDERED LAST in the JSX
                  so it stacks ON TOP of the hand+legs Lotties; the
                  text always reads cleanly even when overlapping
                  Lottie elements would otherwise cover it. */}
              <span
                className={cn(
                  'absolute inset-x-0 bottom-[18%]',
                  'text-center',
                  'font-display tracking-display-tight',
                  'pointer-events-none',
                  /* `wordmark-wave` keyframe in globals.css. */
                  'wordmark-wave',
                )}
                style={{
                  color: 'var(--color-deep)',
                  fontSize: 'clamp(3rem, 11vw, 8rem)',
                  lineHeight: '1',
                }}
              >
                Furnish
              </span>
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
