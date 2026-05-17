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
import Link from 'next/link';
import { Container } from '@/components/Container';
import { EmailWaitlist } from '@/components/shared/EmailWaitlist';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { useScrollReveal } from '@/lib/motion';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { cn } from '@/lib/utils';

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
        /* min-h dropped from 80vh to 60vh, the prior 80vh was sized
           for a full-bleed cinematic photo. Without the photo, 80vh
           reads as empty cream. 60vh keeps the section commanding
           without dead space below the card. */
        'min-h-[60vh] flex items-center',
        'bg-cream',
      )}
      aria-labelledby="final-cta-heading"
    >
      {/* Warm radial halo behind the card. Replaces the full-bleed
          art-deco bedroom photo from the prior iteration; the photo
          was doing decoration work that competed with the card's
          content, the two darkening overlays existed only to fight
          the photo back into legibility, and the whole pattern read
          as a stock-photo template.

          The halo uses the same chromatic recipe as --gradient-hero
          (bronze at low alpha radiating to transparent), so the
          bottom of the page chromatically echoes the top. Card
          sits ON this halo rather than fighting against a photo.

          Reference: Vercel's homepage final CTA block (radial
          gradient behind a flat panel), plus Raycast's CTA-block
          pattern of trusting copy + a single accent shape over
          photography. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(139, 111, 71, 0.10) 0%, rgba(139, 111, 71, 0.04) 40%, transparent 75%)',
        }}
      />

      <Container width="default" className="relative">
        {/* Centered card. bg-surface (Furnish's lightest brand
            color, slightly brighter than the page cream) so the
            card visually lifts off the halo via a subtle lightness
            step, not via a hard fill change. Border picks up the
            sage hairline from Surface 2 so it carries through the
            Surface-2 divider treatment instead of the dead ink
            border that lived here before.

            Reference: Linear's contact-page card and Vercel's CTA
            panel — a lifted surface with a deliberate edge, no
            decorative bg image fighting it. */}
        <div
          className={cn(
            'mx-auto max-w-2xl text-center',
            'rounded-[var(--radius)]',
            'bg-surface',
            'border border-[var(--color-sage-hairline)]',
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
            <>
              <div
                id="final-waitlist"
                className="mt-8 scroll-mt-24 flex justify-center"
                data-reveal
              >
                <EmailWaitlist location="final_cta" scheme="on-light" />
              </div>
              {/* Last-mile reassurance directly under the email
                  field. Pairs with the hero trust line ("Free. No
                  card. Just your email.") so both ends of the page
                  close the same objections. Tight top margin so it
                  reads as belonging to the form, not floating. */}
              <p
                data-reveal
                className="mt-3 text-center text-body-s text-muted"
              >
                {t('home', 'finalCtaReassurance')}
              </p>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
