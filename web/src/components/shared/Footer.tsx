/*
  Footer per Document 4 Section 5.2.

  Three columns on desktop, stacked on mobile:
    1. Brand: wordmark, blurb, App Store badge or coming-soon note
    2. Site: Home, How It Works, Gallery, Blog, About
    3. Legal and Contact: Privacy, Terms, email link

  Bottom strip: copyright with auto-current year.

  Per Document 8 §1.10, no social media links at v1. Add when
  Furnish has accounts on those platforms.
*/

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { Container } from '@/components/Container';

const APP_LAUNCHED = process.env.NEXT_PUBLIC_APP_LAUNCHED === 'true';

const SITE_LINKS: Array<{ href: string; key: string }> = [
  { href: '/', key: 'linkHome' },
  { href: '/how-it-works', key: 'linkHowItWorks' },
  { href: '/gallery', key: 'linkGallery' },
  { href: '/blog', key: 'linkBlog' },
  { href: '/about', key: 'linkAbout' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'mt-section-y',
        /* Top border lifted from ink/0.08 dead grey to
           sage-hairline. Aligns the footer's chrome edge with the
           rest of the site's divider treatment (Surface 2 sage). */
        'border-t border-[var(--color-sage-hairline)]',
        'bg-[var(--color-beige)]',
        'pt-section-y pb-12',
      )}
    >
      <Container width="default">
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
          {/* Brand column */}
          <div>
            <span
              className="font-display text-3xl tracking-display-tight text-deep"
              aria-hidden="true"
            >
              Furnish
            </span>
            <p className="mt-3 max-w-xs text-body-m text-ink">
              {t('common', 'tagline')}
            </p>
            <p className="mt-4 text-body-s text-muted">
              {t('footer', 'brandBlurb')}
            </p>
            <div className="mt-6">
              {APP_LAUNCHED ? (
                /* Post-launch: App Store badge. The actual badge image
                   ships when Hassan supplies it under public/images/. */
                <span className="text-body-s text-muted">
                  {t('footer', 'appStoreBadgeAlt')}
                </span>
              ) : (
                <p className="text-body-s text-muted">
                  {t('footer', 'comingSoonNote')}
                </p>
              )}
            </div>
          </div>

          {/* Site column */}
          <div>
            <h2 className="eyebrow mb-4">{t('footer', 'siteHeading')}</h2>
            <ul className="space-y-2.5">
              {SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="link-underline text-body-m text-ink"
                  >
                    {t('nav', link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h2 className="eyebrow mb-4">{t('footer', 'legalHeading')}</h2>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/privacy"
                  className="link-underline text-body-m text-ink"
                >
                  {t('footer', 'linkPrivacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="link-underline text-body-m text-ink"
                >
                  {t('footer', 'linkTerms')}
                </Link>
              </li>
              <li>
                <a
                  href={t('footer', 'emailHref')}
                  className="link-underline text-body-m text-ink"
                >
                  {t('footer', 'emailLabel')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-section-y-tight border-t border-[var(--color-sage-hairline)] pt-6">
          {/* Provenance line above the copyright. Establishes that
              a real person in a real place built this, useful trust
              signal in the absence of social proof numbers. Same
              muted body-s as the copyright so it reads as a paired
              cluster, not a banner. */}
          <p className="text-body-s text-muted">
            {t('footer', 'provenance')}
          </p>
          <p className="mt-1 text-body-s text-muted">
            © {year} Furnish. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
