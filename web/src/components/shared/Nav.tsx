'use client';

/*
  Top navigation per Document 4 Section 5.1, with a Phase-2 UX
  refactor (2026-05-16): on desktop (≥lg) the global links render
  inline on the top bar so visitors hit them in one click instead of
  two-via-Menu. On mobile (<lg) the hamburger + full-screen takeover
  pattern stays, since 4+ inline links don't fit alongside the
  wordmark and the waitlist pill on a phone.

  Desktop layout (≥lg):
    [Furnish wordmark]  [How It Works · Why Furnish · Gallery · FAQ]  [CTA pill]

  Mobile layout (<lg):
    [Furnish wordmark]                            [Menu trigger] [CTA pill]

  Click depth before this refactor: every primary link was 2 clicks
  (Menu trigger → link). After: 1 click on desktop. Mobile is
  unchanged. The "Menu" button is hidden on lg+ via `lg:hidden`.

  FAQ is rendered visually subordinate (smaller text, muted color,
  preceded by a dot separator) because it's lower-intent than the
  three primary links. Blog and About stay in the mobile takeover
  + footer only on desktop, to keep the top bar tight.

  Why Furnish anchors to /#why-furnish (the comparison table on the
  home page, which already has `id="why-furnish"`). Cross-page hash
  navigation is handled by Next.js automatically.
*/

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu as MenuIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { Container } from '@/components/Container';
import { MenuTakeover } from './MenuTakeover';
import { NavCTA } from './NavCTA';

/* Primary desktop nav links. Three equal-weight links plus FAQ
   rendered separately at a subordinate weight. */
const PRIMARY_LINKS: Array<{ href: string; key: string }> = [
  { href: '/how-it-works', key: 'linkHowItWorks' },
  { href: '/#why-furnish', key: 'linkWhyFurnish' },
  { href: '/gallery', key: 'linkGallery' },
];

export function Nav() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-[100] w-full',
          'bg-cream/85 backdrop-blur-md',
          'border-b border-[rgba(43,30,24,0.06)]',
        )}
      >
        <Container width="default">
          <div className="flex h-16 items-center justify-between sm:h-20">
            {/* Logo + wordmark. Visible at every viewport. */}
            <Link
              href="/"
              aria-label={t('nav', 'logoAriaLabel')}
              className="flex items-center gap-2"
            >
              <Image
                src="/icon.svg"
                alt=""
                width={32}
                height={32}
                priority
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
              <span
                className={cn(
                  'font-display tracking-display-tight text-deep',
                  'text-xl sm:text-3xl',
                )}
              >
                Furnish
              </span>
            </Link>

            {/* DESKTOP (lg+) inline links. Hidden below lg.
                Three primary links read equal weight. A small dot
                separator + FAQ at body-s/muted signals secondary
                nav, so the eye lands on the three primary first. */}
            <nav
              aria-label="Primary"
              className="hidden lg:flex items-center gap-7"
            >
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-body-m font-semibold text-deep',
                    'underline-offset-4 hover:underline',
                  )}
                >
                  {t('nav', link.key)}
                </Link>
              ))}
              <span aria-hidden="true" className="text-muted/40">
                ·
              </span>
              <Link
                href="/faq"
                className={cn(
                  'text-body-s text-muted',
                  'underline-offset-4 hover:underline',
                )}
              >
                {t('nav', 'linkFaq')}
              </Link>
            </nav>

            <div className="flex items-center gap-3 sm:gap-5">
              {/* MOBILE (<lg) hamburger trigger. Hidden on lg+. */}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={t('nav', 'menuTrigger')}
                aria-expanded={menuOpen}
                className={cn(
                  'lg:hidden inline-flex items-center gap-2',
                  'rounded-full px-3 py-2',
                  'text-body-s font-semibold text-deep',
                  'sm:text-body-m',
                  'btn-secondary-hover',
                )}
              >
                <MenuIcon size={18} strokeWidth={1.5} />
                <span className="hidden sm:inline">{t('nav', 'menuTrigger')}</span>
              </button>
              <NavCTA location="nav" />
            </div>
          </div>
        </Container>
      </header>

      <MenuTakeover open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
