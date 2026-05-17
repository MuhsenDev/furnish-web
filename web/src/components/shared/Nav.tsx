'use client';

/*
  Top navigation, Surface 1 magazine-grade redesign (2026-05-16).

  Key changes vs the prior iteration:
    1. Scroll-state transition: transparent at rest (top of page),
       cream/92 + backdrop-blur + sage-hairline border + shadow-1
       once scrolled past 24px. The nav now reads as "part of the
       hero" at the top and as "a chrome panel" once the user
       commits to scrolling. Eliminates the "pasted on" feel.
    2. Link typography: font-medium (was semibold), tighter tracking,
       link-underline class so hover draws an underline from left to
       right rather than the default browser-style underline pop.
    3. Active-state cue: the link for the current page color-shifts
       to terracotta (Surface 2 accent). Subtle "you are here".
    4. Link row gap bumped 7 -> 9 for more magazine spacing.
    5. Logo optical alignment: wordmark nudged up 1px at sm+ so the
       serif's descenders don't read low against the link baseline.
    6. CTA inset shadow comes from NavCTA itself; no change here.

  Mobile (<lg) hamburger + MenuTakeover overlay unchanged.
  prefers-reduced-motion: state flip is instant (no transition).
*/

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu as MenuIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { Container } from '@/components/Container';
import { MenuTakeover } from './MenuTakeover';
import { NavCTA } from './NavCTA';

/* Primary desktop nav links. Short-form labels per the 2026-05-16
   reference-tier polish pass (Linear/Stripe-style single-word
   convention). Long-form keys (linkHowItWorks, linkWhyFurnish,
   linkGallery) stay in nav.json so the mobile MenuTakeover + Footer
   can use the descriptive variants without breaking. */
const PRIMARY_LINKS: Array<{ href: string; key: string }> = [
  { href: '/how-it-works', key: 'linkHow' },
  { href: '/#why-furnish', key: 'linkCompare' },
  { href: '/gallery', key: 'linkRooms' },
];

/* Pure helper, no React. Decide whether a given nav link points
   at the route the user is currently on. Hash-anchor links
   ("/#why-furnish") never activate, since they're scroll targets
   on the home page, not destinations. */
function isActiveLink(currentPathname: string | null, href: string): boolean {
  if (!currentPathname) return false;
  if (href.startsWith('/#')) return false;
  if (href === '/') return currentPathname === '/';
  return currentPathname === href || currentPathname.startsWith(`${href}/`);
}

export function Nav() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pathname = usePathname();

  /* Scroll-state for the background/border treatment. Cheap
     scroll listener with passive:true + setState only on transition
     (React bails on identical state). Falls back to "scrolled
     immediately" if SSR ever rendered (matches the rest-state on
     first paint by initializing to false). */
  const [isScrolled, setIsScrolled] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const SCROLL_TRIGGER_PX = 24;
    const onScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_TRIGGER_PX);
    };
    onScroll(); // initial state on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-[100] w-full',
          /* Transition the background + border + shadow trio
             together so the state flip reads as one moment, not
             three layered changes. transition-colors covers bg
             and border-color; box-shadow stays on its own
             transition with the same duration. */
          'transition-[background-color,border-color,box-shadow] duration-300 ease-premium',
          isScrolled
            ? cn(
                'bg-cream/92 backdrop-blur-md',
                'border-b border-[var(--color-sage-hairline)]',
                'shadow-1',
              )
            : cn(
                'bg-transparent',
                'border-b border-transparent',
                'shadow-none',
              ),
        )}
      >
        <Container width="default">
          <div className="flex h-16 items-center justify-between sm:h-20">
            {/* Logo + wordmark. translate-y-[-1px] at sm+ corrects
                the Fraunces serif's descender pull so the wordmark
                optical center matches the link baseline. */}
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
                  'sm:translate-y-[-1px]',
                )}
              >
                Furnish
              </span>
            </Link>

            {/* DESKTOP (lg+) inline links. Hidden below lg.
                gap-8 (32px) matches Linear's exact spacing value
                from linear.app top nav. The Round-2 gap-9 read
                slightly loose.

                Active-state pattern (Linear/Vercel hybrid):
                  - Default: text-deep at 75% opacity (subordinate)
                  - Hover: opacity-100 + link-underline draw
                  - Active route: opacity-100 + a 4×4 terracotta
                    dot positioned 8px below the link
                The dot replaces the prior terracotta text color
                (which read too loud against the cream nav bg).
                Quieter, more decisive than an underline indicator. */}
            <nav
              aria-label="Primary"
              className="hidden lg:flex items-center gap-8"
            >
              {PRIMARY_LINKS.map((link) => {
                const active = isActiveLink(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative link-underline',
                      /* 15px is Linear's nav-link size: between
                         body-s (14) and body-m (16). Weight 500 +
                         tighter -0.01em tracking reads as
                         deliberate without being aggressive. */
                      'text-[15px] font-medium tracking-[-0.01em]',
                      'text-deep transition-opacity duration-200 ease-premium',
                      active
                        ? 'opacity-100'
                        : 'opacity-75 hover:opacity-100',
                      /* Active-route dot indicator. Terracotta from
                         Surface 2. 4×4 px, centered horizontally,
                         8px below the text baseline. */
                      active &&
                        'after:absolute after:left-1/2 after:-bottom-2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[var(--color-terracotta)]',
                    )}
                  >
                    {t('nav', link.key)}
                  </Link>
                );
              })}
              {/* 1px vertical rule between the primary links and
                  FAQ. Replaces the prior typographic "·" separator,
                  which read as decoration. The rule reads as a
                  deliberate divider. Reference: Stripe's nav
                  between Solutions and Developers. */}
              <span
                aria-hidden="true"
                className="h-4 w-px bg-[var(--color-sage-hairline)]"
              />
              <Link
                href="/faq"
                aria-current={isActiveLink(pathname, '/faq') ? 'page' : undefined}
                className={cn(
                  'relative link-underline',
                  'text-[15px] font-medium tracking-[-0.01em]',
                  'text-deep transition-opacity duration-200 ease-premium',
                  /* FAQ stays subordinate via opacity (50%), not
                     via font size. The size matches the primary
                     links now so legibility is consistent across
                     the nav row. */
                  isActiveLink(pathname, '/faq')
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-100',
                  isActiveLink(pathname, '/faq') &&
                    'after:absolute after:left-1/2 after:-bottom-2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[var(--color-terracotta)]',
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
