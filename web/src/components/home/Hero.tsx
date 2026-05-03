'use client';

/*
  Home page Hero per Document 5 Section 1.

  Layout:
    Desktop: 60/40 split. Image fills 60% from right edge. Text in
             the left 40%. Gradient overlay on image's left edge
             ensures text legibility where they meet.
    Mobile:  Stacked. Image fills top 50%. Text below.

  Copy is locked. 3-line headline ("Take a photo. / Furnish does /
  the rest."), subheadline, two CTAs side-by-side, sub-CTA below.

  Motion: useHeroSequence() from @/lib/motion runs the choreographed
  reveal per Document 3 §5.

  Hero image is locked at hero-1 (Scandinavian living room, bright
  morning) for initial build. Hassan curates the actual image into
  public/images/hero/hero-1-scandinavian-living-morning.jpg.
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
        'relative overflow-hidden',
        'min-h-[90vh] lg:min-h-screen',
        'bg-cream',
      )}
    >
      {/* Background image. On mobile fills top 50% via positioned
          inset; on desktop fills the right 60% via the inset-y-0
          right-0 w-3/5 pattern. */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-[50vh]',
          'lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:w-3/5',
        )}
        data-hero-image
      >
        <Image
          src={HERO_IMAGE_SRC}
          alt={t('home', 'heroImageAlt')}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
        {/* Left-edge gradient overlay on desktop so text reads
            cleanly where the image meets the text column. */}
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-0 hidden lg:block',
            'bg-gradient-to-r from-cream via-cream/30 to-transparent',
          )}
        />
        {/* Bottom gradient on mobile for the image-to-text fade. */}
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 bottom-0 h-16 lg:hidden',
            'bg-gradient-to-b from-transparent to-cream',
          )}
        />
        {/* Image attribution per §1.10. */}
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

      {/* Text content. Sits above the image on mobile (margin-top to
          push past the 50vh image), and in the left 40% on desktop. */}
      <Container width="default" className="relative h-full">
        <div
          className={cn(
            'mt-[52vh] pb-12 lg:mt-0 lg:pb-0',
            'flex min-h-[40vh] flex-col justify-center lg:min-h-screen',
            'lg:max-w-xl xl:max-w-2xl',
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

          <p
            data-hero-eyebrow
            className="eyebrow mt-6"
          >
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
                <ArrowRight size={18} strokeWidth={1.5} className="cta-arrow" />
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
                <ArrowRight size={18} strokeWidth={1.5} className="cta-arrow" />
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
      </Container>
    </section>
  );
}
