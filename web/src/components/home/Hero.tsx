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
import { Container } from '@/components/Container';
import { LottieAsset } from '@/components/shared/LottieAsset';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { useHeroSequence } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const primaryCtaClasses = cn(
  'btn-primary-hover',
  'inline-flex items-center justify-center',
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

export interface HeroProps {
  /**
   * Pre-formatted aggregate counter copy from the server (e.g.
   * "Join 1,234 people on the waitlist"). Rendered just under the
   * sub-CTA text. Server side computes this from a Supabase row
   * count + the private POSITION_OFFSET so the offset never lands
   * in the client bundle.
   */
  counterText?: string;
}

export function Hero({ counterText }: HeroProps = {}) {
  const heroRef = useHeroSequence<HTMLElement>();
  const { open: openWaitlist } = useWaitlist();

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
        /* Desktop top padding was lg:pt-12 (48px), too small to
           clear the sm:h-20 sticky nav (80px). The headline's first
           line ("Designed for") was visibly clipped under the nav
           on first paint at lg+ widths. Bumped to lg:pt-28 (112px)
           so the headline starts comfortably below the nav with
           breathing room. */
        className="flex flex-1 items-center pt-24 pb-10 lg:pt-28 lg:pb-12"
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
              {/* No ArrowRight icon on the hero primary CTA, when
                  the arrow has its default opacity:0 (visible only
                  on hover) it still occupies layout space, pushing
                  the visible text ~17px left of the button's visual
                  center. Hassan flagged the off-center text directly.
                  Cleanest fix: drop the icon. The button is now
                  text-only, perfectly centered between the px-7
                  paddings. */}
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
                </Link>
              ) : (
                <button
                  type="button"
                  data-hero-cta-primary
                  onClick={() => {
                    track('home_hero_cta_click', { cta_text: 'waitlist' });
                    openWaitlist();
                  }}
                  className={primaryCtaClasses}
                >
                  {t('home', 'waitlistButton')}
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

            {/* Aggregate signup counter, rendered only when the
                server passed in copy. Subtle, intentionally not
                shouty: same muted text size as the sub-CTA, just a
                tighter top margin so it pairs visually. */}
            {counterText && !APP_LAUNCHED && (
              <p className="mt-1.5 text-body-s text-muted">
                {counterText}
              </p>
            )}
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

                  Sits on the LEFT side of the "Furnish" wordmark,
                  symmetric to the RIGHT hand below. Non-mirrored
                  Lottie has its visible hand at element (20%, 49%) -
                  near the LEFT edge of the wrapper, so placing
                  the wrapper extending past the parent's left edge
                  parks the hand right at parent x ≈ 5% (just past
                  the visible left edge of the text).

                  Target visible hand at parent (5%, 50%):
                    wrapper.left + 0.20 * 0.70 = 0.05
                      -> wrapper.left = -9% -> left -9%

                  Y position is breakpoint-conditional because the
                  wordmark text scales with viewport width
                  (clamp(3rem, 11vw, 8rem)) and so its parent-%
                  Y range is different on mobile vs desktop:

                    mobile  (<lg): font 48px, text Y range 67.7-82.0%
                    desktop (lg+): font 128px, text Y range 56.8-82.6%

                  Pixel-sampled the hand canvas across a full
                  animation cycle: the hand-wave isn't a small
                  static glyph, it sweeps through canvas y 35%-61%
                  (a 26pp range). After scale(2.0) origin (20%, 49%)
                  that becomes element y 21%-73% (a 52pp range),
                  so the hand bbox's peak parent-y extent is
                  wrapper.top + 51pp (= 0.73 * 70).

                  Mobile (top-[13%]): the entire hero composition -
                  hands + wordmark + legs, was uniformly shifted
                  up the Y axis by 10pp on mobile so the hands peek
                  out more prominently above the wordmark.

                  Desktop (lg:top-[3%]): peak hand bot = 3 + 51 =
                  54%, ~7px clear of desktop text top 55.3%. This
                  is much higher than the corner of "Furnish" but
                  it's the only Y position that satisfies "neither
                  hand touching ANY text" across the full animation
                  cycle. Hand center moves to parent y ≈ 36%, hand
                  visually waves above the text rather than from
                  the corner. */}
              <div
                className={cn(
                  'absolute',
                  'left-[-9%] top-[13%] lg:top-[3%]',
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
                  SAME origin at (20%, 49%), the natural hand
                  position. With this single-origin combo:
                  - scaleX(-1) origin (20%, 49%): hand at (20%, 49%)
                    stays at (20%, 49%) but mirrored (since origin
                    x = hand x).
                  - scale(2.0) origin (20%, 49%): hand stays at
                    (20%, 49%), 2x bigger.

                  So the hand stays anchored at wrapper (20%, 49%)
                  same as the LEFT hand. Wrapper position math is
                  identical to LEFT.

                  Target: visible hand at (90%, 50%) of parent -
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
                    /* RIGHT hand: just past the right edge of the
                       Furnish wordmark. With scale(-2, 2) + default
                       origin (50%, 50%), hand at element (20%, 49%)
                       maps to (110%, 48%), past the wrapper's
                       right edge.

                       X: wrapper.left + 1.10 * 0.70 = 0.98
                          -> wrapper.left = 21% -> right 9%

                       Y is breakpoint-conditional, same reasoning
                       as the LEFT hand: the hand-wave sweep is
                       wide enough that the hand bbox extends ~51pp
                       below the wrapper.top. To clear desktop text
                       top (55.3%) at every animation frame:

                       Desktop lg:top-[4%]: peak hand bot = 4 + 51
                       = 55%, ≈1.5px clear of text top. RIGHT hand
                       sits 1pp lower than LEFT (which is at
                       lg:top-[3%]) so the "RIGHT lower than LEFT"
                       spec from earlier iterations is preserved.

                       Mobile (top-[18%]): shifted up 10pp from
                       prior top-[28%] in lockstep with the LEFT
                       hand and wordmark to bring the hands into
                       view above the wordmark. */
                    'right-[9%] top-[18%] lg:top-[4%]',
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

              {/* Walking legs SUPER DAMN CLOSE to the Furnish
                  textbox bottom, but not touching.

                  Pixel-sampled the actual rendered legs canvas:
                  the dotlottie player squashes the natural 1350x1800
                  lottie into the 369x737 wrapper (0.75 aspect ->
                  0.5 aspect). Visible-legs bbox lands at canvas y
                  57.5%-79.0%, which means the visible legs TOP sits
                  at 57.05% of wrapper height (canvas fills 99.2% of
                  the wrapper, no letterboxing).

                  With wrapper width 72% of parent and aspect-[1/2],
                  wrapper height = 145.2% of parent. So visible
                  legs top in parent coords =
                    wrapper.top + 0.5705 * 145.2 = wrapper.top + 82.84

                  Desktop (lg:top-[1.5%]): visible legs top at
                  parent y = 84.34%, which is 1.5pp (≈8px) below
                  desktop wordmark text bottom (82.6%), the "super
                  damn close, not touching" gap Hassan asked for.

                  Mobile (top-[-8.5%]): shifted up 10pp in lockstep
                  with the rest of the hero composition. Visible
                  legs top = -8.5 + 82.84 = 74.34%, which is 2.34pp
                  below the mobile wordmark text bottom (after that
                  was also shifted to bottom-[28%], yielding text
                  bottom at parent y 72%). Same proportional 8px
                  gap maintained. */}
              {readyForExtras && (
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2',
                    'top-[-8.5%] lg:top-[1.5%]',
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
                  Lottie elements would otherwise cover it.

                  Mobile uses bottom-[28%] so the wordmark sits in
                  the middle of the parent box rather than the
                  lower third, paired with the +10pp UP shift on
                  hands and legs so the whole composition reads
                  higher and the hands peek out above the text.

                  Desktop reverts to lg:bottom-[18%] (Hassan: the
                  desktop hero is finalized). */}
              <span
                className={cn(
                  'absolute inset-x-0',
                  'bottom-[28%] lg:bottom-[18%]',
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

      {/* Waitlist modal lives at the layout level via
          WaitlistProvider, Hero just calls openWaitlist() when
          the primary CTA is clicked. No local modal mount needed. */}
    </section>
  );
}
