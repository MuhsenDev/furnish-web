'use client';

/*
  Home page Hero per Document 5 Section 1, updated to swap the static
  hero image for a signature 3D animated portrait per Hassan's call.

  Layout:
    Desktop (lg+): 5/7 grid. Headline + CTAs in the left 5 columns,
                   3D portrait in the right 7 columns. Both columns
                   center-aligned vertically over the full viewport
                   height.
    Mobile:        Stacked. Headline + CTAs + waitlist on top. The
                   3D portrait fills the natural vertical space below
                   (about 60vh) where the room photo used to live.

  The 3D portrait is dynamically imported with ssr:false so the
  three.js bundle never reaches the SSR HTML and so the chunk loads
  off the critical path. A cream-colored placeholder fills the
  portrait slot while the chunk streams in. The Hero reveal
  choreography (useHeroSequence) targets [data-hero-image] which is
  set on the portrait wrapper, so the existing fade-in still works.

  Copy is locked. 3-line headline ("Take a photo. / Furnish does /
  the rest."), subheadline, two CTAs side-by-side, sub-CTA below.
*/

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/Container';
import { EmailWaitlist } from '@/components/shared/EmailWaitlist';
import { useHeroSequence } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/* Lazy-load the 3D portrait. ssr:false because three.js touches
   `window` and a `<canvas>` element on construction; rendering it on
   the server would either bail or ship dead HTML. The placeholder
   matches the cream hero background so there's no flash while the
   chunk streams in. */
const HeroPortrait = dynamic(
  () => import('./HeroPortrait').then((m) => m.HeroPortrait),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-cream" aria-hidden="true" />
    ),
  },
);

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
        'relative overflow-hidden bg-cream',
        'min-h-[90vh] lg:min-h-screen',
      )}
    >
      <Container width="default" className="relative">
        <div
          className={cn(
            'grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14',
            'pt-12 lg:pt-0',
            'lg:min-h-screen',
          )}
        >
          {/* Text column. Desktop: left 5 of 12 columns, vertically
              centered. Mobile: full-width on top. */}
          <div
            className={cn(
              'order-1 lg:col-span-5',
              'flex flex-col justify-center',
            )}
          >
            <h1
              className={cn(
                'font-display text-deep',
                'tracking-display-tight leading-display-tight',
                'text-display-l lg:text-display-xl',
              )}
            >
              <span data-hero-headline-line className="block">
                {t('home', 'heroLine1')}
              </span>
              <span data-hero-headline-line className="block">
                {t('home', 'heroLine2')}
              </span>
              <span data-hero-headline-line className="block">
                {t('home', 'heroLine3')}
              </span>
            </h1>

            <p data-hero-eyebrow className="eyebrow mt-6">
              {t('common', 'tagline')}
            </p>

            <p
              data-hero-subhead
              className={cn(
                'mt-3 max-w-lg text-body-xl text-ink',
                'opacity-90',
              )}
            >
              {t('home', 'heroSubheadline')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
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

            {/* Inline waitlist form, pre-launch only. Anchored with
                id="waitlist" so the primary CTA's #waitlist hash
                scrolls here. */}
            {!APP_LAUNCHED && (
              <div id="waitlist" className="mt-6 scroll-mt-24">
                <EmailWaitlist location="hero" />
              </div>
            )}
          </div>

          {/* Portrait column. Desktop: right 7 of 12 columns, full
              viewport height. Mobile: stacked below text, ~60vh
              tall. The data-hero-image attribute lets useHeroSequence
              fade the portrait in along with the rest of the hero. */}
          <div
            data-hero-image
            className={cn(
              'order-2 lg:col-span-7',
              'relative flex items-center justify-center',
              'h-[60vh] sm:h-[70vh] lg:h-screen',
              'pb-12 lg:pb-0',
            )}
          >
            <HeroPortrait />
          </div>
        </div>
      </Container>
    </section>
  );
}
