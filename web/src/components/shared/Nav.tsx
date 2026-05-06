'use client';

/*
  Top navigation per Document 4 Section 5.1.

  Layout:
    [Furnish wordmark]        [Menu trigger]  [Persistent CTA pill]

  The wordmark is a Link to /. The Menu trigger opens the full-screen
  takeover (MenuTakeover). The CTA pill is always visible (waitlist
  pre-launch, App Store post-launch).

  Sticky positioning so the nav stays accessible during long scrolls.
  Background is the cream surface with a subtle bottom border so the
  edge stays defined when content scrolls underneath.
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
            {/* Logo + wordmark. Logo always visible; wordmark
                hides on the smallest viewports so the right-side
                Menu/CTA cluster doesn't collide with it on a 320px
                iPhone SE. From sm: up the wordmark appears next to
                the logo in display serif. */}
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
                  /* Wordmark hidden below sm so the logo-only state
                     keeps the bar uncluttered on narrow phones. */
                  'hidden sm:inline',
                  'text-2xl sm:text-3xl',
                )}
              >
                Furnish
              </span>
            </Link>

            <div className="flex items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={t('nav', 'menuTrigger')}
                aria-expanded={menuOpen}
                className={cn(
                  'inline-flex items-center gap-2',
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
