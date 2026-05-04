'use client';

/*
  Home page Hero per Document 5 Section 1.

  Layout:
    Desktop (lg+): 5/7 grid. Headline + CTAs in the left 5 columns,
                   curated room photo in the right 7 columns. Both
                   columns center-aligned vertically over the full
                   viewport height.
    Mobile:        Stacked, text-first. Headline + CTAs + waitlist
                   on top. The hero room photo fills the natural
                   vertical space below.

  The 3D portrait used to live here in the v1 build of this commit
  series, but Hassan moved it to its own dedicated PortraitSection
  between Hero and GalleryPreview. The hero is back to a curated room
  photo (hero-1, Scandinavian living, bright morning) which the
  user-facing brand wants on the home page.

  Hero image is locked at hero-1 for initial build. Hassan curates
  the actual image into public/images/hero/.
*/

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/Container';
import { EmailWaitlist } from '@/components/shared/EmailWaitlist';
import { useHeroSequence } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const HERO_IMAGE_SRC = '/images/hero/hero-1-scandinavian-living-morning.jpg';

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

          {/* Image column. Desktop: right 7 of 12 columns. Mobile:
              stacked below text in a ~60vh slot. The data-hero-image
              attribute lets useHeroSequence fade the image in along
              with the rest of the hero choreography. */}
          <div
            data-hero-image
            className={cn(
              'order-2 lg:col-span-7',
              'relative overflow-hidden rounded-sm',
              'h-[60vh] sm:h-[70vh] lg:h-screen',
              'pb-12 lg:pb-0',
            )}
          >
            <Image
              src={HERO_IMAGE_SRC}
              alt={t('home', 'heroImageAlt')}
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
            {/* Bottom gradient on mobile so the image fades into the
                cream background of the next section. */}
            <div
              aria-hidden="true"
              className={cn(
                'absolute inset-x-0 bottom-0 h-16 lg:hidden',
                'bg-gradient-to-b from-transparent to-cream',
              )}
            />
            {/* Image attribution per Document 5 §1.10. */}
            <p
              className={cn(
                'absolute bottom-3 right-3 sm:bottom-4 sm:right-4',
                'text-body-s text-cream/70',
                'pointer-events-none',
              )}
            >
              {t('home', 'heroAttribution')}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
