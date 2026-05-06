'use client';

/*
  Final CTA section per Document 5 Section 8.

  Full-bleed cinematic AI-generated room image (Hero-2: art-deco
  bedroom, moody) with heavy gradient overlay. Centered headline
  plus CTA. Pre-launch shows email waitlist below; post-launch
  shows App Store badge.

  DEVIATION: §8.6 calls for a parallax effect on the background
  image. Document 3 anti-patterns and the Doc 5 prompt section
  both forbid parallax. Skipping per the higher-authority rule.
  Background stays static. The cross-fade overlay still gives
  enough cinematic feel without the parallax.

  Section anchored as id="cta" (or id="waitlist" pre-launch and
  id="download" post-launch via aliases handled by the Hero anchor).
  Fires home_final_cta_click on click.
*/

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { EmailWaitlist } from '@/components/shared/EmailWaitlist';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { useScrollReveal } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { cn } from '@/lib/utils';

const FINAL_CTA_IMAGE_SRC = '/images/hero/hero-2-art-deco-bedroom-evening.jpg';

const finalCtaButtonClasses = cn(
  'btn-primary-hover',
  'inline-flex items-center justify-center gap-2',
  'rounded-sm bg-[var(--color-accent)] text-cream',
  'px-9 py-4.5 text-body-l font-semibold',
  'shadow-2',
);

export function FinalCTA() {
  const sectionRef = useScrollReveal<HTMLElement>({
    yOffset: 30,
    stagger: 0.15,
  });
  const { open: openWaitlist } = useWaitlist();

  const ctaText = APP_LAUNCHED
    ? t('common', 'ctaAppStore')
    : t('common', 'ctaWaitlist');
  const ctaHref = APP_LAUNCHED ? APP_STORE_URL : '#final-waitlist';
  const subLine = APP_LAUNCHED
    ? t('home', 'finalCtaSubLinePostLaunch')
    : t('home', 'finalCtaSubLinePreLaunch');

  return (
    <section
      ref={sectionRef}
      id="final-cta"
      className={cn(
        'relative overflow-hidden',
        'min-h-[80vh] flex items-center',
      )}
      aria-labelledby="final-cta-heading"
    >
      {/* Full-bleed cinematic background image. */}
      <Image
        src={FINAL_CTA_IMAGE_SRC}
        alt={t('home', 'finalCtaImageAlt')}
        fill
        sizes="100vw"
        className="absolute inset-0 object-cover"
      />
      {/* Layered overlays for legibility. The previous gradient at
          /55 /40 /70 left bright areas of the image showing through
          enough to wash out the cream headline. Now layered:
          (1) ink (brand near-black) at 65% darkens the whole image,
          (2) a deep-warm vertical gradient on top of that for the
              cinematic vignette feel.
          Cream text now sits on a dark backdrop with high contrast. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/65"
      />
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-b from-deep/30 via-transparent to-deep/55',
        )}
      />

      <Container width="default" className="relative">
        {/* Centered brand-color card wrapping the entire CTA block.
            Cream background pops against the dark image overlay so
            the headline reads cleanly. Text colors switch from
            on-dark cream tones to on-light deep/ink tones since the
            backdrop inside the card is now light. */}
        <div
          className={cn(
            'mx-auto max-w-2xl text-center',
            'rounded-[var(--radius)]',
            'bg-cream',
            'border border-[rgba(43,30,24,0.08)]',
            'shadow-2',
            'p-8 sm:p-12 lg:p-14',
          )}
        >
          <p data-reveal className="eyebrow">
            {t('home', 'finalCtaEyebrow')}
          </p>
          <h2
            id="final-cta-heading"
            data-reveal
            className={cn(
              'mt-4 font-display text-deep',
              'tracking-display-tight leading-display-tight',
              'text-display-l lg:text-display-xl',
            )}
          >
            {t('home', 'finalCtaHeadline')}
          </h2>

          <div className="mt-section-y-tight" data-reveal>
            {APP_LAUNCHED ? (
              <Link
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track('home_final_cta_click', { cta_text: 'app_store' })
                }
                className={finalCtaButtonClasses}
              >
                {ctaText}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  track('home_final_cta_click', { cta_text: 'waitlist' });
                  openWaitlist();
                }}
                className={finalCtaButtonClasses}
              >
                {ctaText}
              </button>
            )}
          </div>

          <p data-reveal className="mt-6 text-body-m text-ink/75">
            {subLine}
          </p>

          {!APP_LAUNCHED && (
            <div
              id="final-waitlist"
              className="mt-8 scroll-mt-24 flex justify-center"
              data-reveal
            >
              <EmailWaitlist location="final_cta" scheme="on-light" />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
