'use client';

/*
  MegaNav closed-state top bar.

  Layout:
    Desktop (>=lg): [logo]  ...  [Browse · Learn · Compare · Get Started]  [Waitlist pill]
    Mobile  (<lg):  [logo]                                ...      [Menu icon]  [Waitlist pill]

  Brand adaptations from the ApeChain spec:
    - Cream + bronze + sage palette (not dark + gold).
    - Fraunces wordmark + Inter labels (not Bebas Neue / DM Sans).
    - Waitlist pill IS KEPT in the closed bar despite the spec
      saying "no CTA in the closed bar". Furnish is pre-launch and
      the conversion CTA being constantly visible matters more
      than the spec's restraint argument. Documented in the
      MegaNav build header in commit 2.

  Section triggers:
    Each label is a real <button>. Click opens the overlay to that
    section. While the overlay is open, the active section's label
    visually emphasizes (opacity-100 + bronze tint + subtle right
    shift) and inactive labels mute. Spec §4.2.

  Scroll-state backdrop (matches the Surface 1 nav pattern, kept
  for visual continuity with the rest of the site):
    - scrollY <= 24px: bg-transparent, no border, no shadow
    - scrollY  > 24px: bg-cream/92 + backdrop-blur + sage-hairline
      border + shadow-1
    Transition 300ms ease-premium on bg/border/shadow trio.

  Reduced motion: the @media (prefers-reduced-motion: reduce)
  override in globals.css zeroes all transitions globally, so this
  component's scroll-state flip becomes instant for users who
  prefer it.
*/

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu as MenuIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { Container } from '@/components/Container';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { APP_LAUNCHED, APP_STORE_URL } from '@/lib/flags';
import { trackCtaClick, track } from '@/lib/analytics';
import { navSections, type SectionId } from '@/data/nav-mega';

export interface MegaNavTopBarProps {
  isOpen: boolean;
  activeSection: SectionId | null;
  onOpen: (section: SectionId, trigger?: HTMLElement | null) => void;
  onClose: () => void;
}

const pillClasses = cn(
  'inline-flex items-center justify-center',
  'rounded-full bg-[var(--color-accent)] text-cream',
  'px-4 py-2 text-body-s font-semibold',
  'sm:px-5 sm:py-2.5 sm:text-body-m',
  /* shadow-1 outer + inset deep-ink bottom edge. Matches the
     NavCTA shadow from Surface 1 polish so the existing visual
     language of the pill is preserved. */
  'shadow-[var(--shadow-1),inset_0_-2px_0_rgba(43,30,24,0.22)]',
  /* Lift-on-hover, depress-on-active microstate. Same Stripe/
     Linear physical-depression pattern as the prior NavCTA. */
  'transition-[transform,box-shadow] duration-200 ease-premium',
  'hover:-translate-y-px hover:shadow-[var(--shadow-2),inset_0_-2px_0_rgba(43,30,24,0.22)]',
  'active:translate-y-0 active:shadow-[var(--shadow-1),inset_0_-1px_0_rgba(43,30,24,0.22)]',
);

export function MegaNavTopBar({
  isOpen,
  activeSection,
  onOpen,
  onClose,
}: MegaNavTopBarProps) {
  const { open: openWaitlist } = useWaitlist();

  /* Scroll-state. Passive scroll listener trips at scrollY > 24,
     same threshold as Surface 1's Nav. We branch the backdrop
     based on it. While the overlay is open, force the scrolled
     look because the overlay's backdrop sits behind the topbar
     and the chrome reads cleaner with a defined edge. */
  const [isScrolled, setIsScrolled] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showChrome = isScrolled || isOpen;

  /* Section-trigger handler. Captures the clicked element via
     ref so the orchestrator can restore focus on close (a11y
     dialog pattern per spec §4.5). */
  const handleTriggerClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    section: SectionId,
  ) => {
    if (isOpen && activeSection === section) {
      /* Clicking the active section's trigger closes the overlay,
         mirroring Apple/Stripe pattern. */
      onClose();
      return;
    }
    track('mega_nav_open', { section });
    onOpen(section, e.currentTarget);
  };

  /* Mobile hamburger: opens to the first section (Browse). */
  const handleHamburgerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isOpen) {
      onClose();
      return;
    }
    track('mega_nav_open', { section: navSections[0].id, via: 'hamburger' });
    onOpen(navSections[0].id, e.currentTarget);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-[100] w-full',
        'transition-[background-color,border-color,box-shadow] duration-300 ease-premium',
        showChrome
          ? cn(
              'bg-cream/92 backdrop-blur-md',
              'border-b border-[var(--color-sage-hairline)]',
              'shadow-1',
            )
          : cn('bg-transparent', 'border-b border-transparent', 'shadow-none'),
      )}
    >
      <Container width="default">
        <div className="flex h-16 items-center justify-between sm:h-20">
          {/* Logo + wordmark. Identical treatment to Surface 1 so
              the brand mark stays consistent through the
              transition. translate-y-[-1px] at sm+ corrects
              Fraunces's optical descender pull. */}
          <Link
            href="/"
            aria-label={t('nav', 'logoAriaLabel')}
            className="flex items-center gap-2"
            onClick={() => isOpen && onClose()}
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

          {/* DESKTOP section triggers (lg+). One <button> per
              section. Active section (when overlay is open) gets
              the right-shift + bronze color cue per spec §4.2. */}
          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-8"
          >
            {navSections.map((section) => {
              const isActive = isOpen && activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={(e) => handleTriggerClick(e, section.id)}
                  aria-haspopup="dialog"
                  aria-expanded={isActive}
                  aria-controls="mega-nav-overlay"
                  className={cn(
                    'relative link-underline',
                    /* 15px / weight-500 / -0.01em tracking matches
                       the Surface 1 nav so the site has one
                       typographic system for inline links. */
                    'text-[15px] font-medium tracking-[-0.01em]',
                    'text-deep transition-[opacity,transform,color] duration-200 ease-premium',
                    isActive
                      ? 'opacity-100 text-[var(--color-terracotta)] translate-x-1'
                      : 'opacity-75 hover:opacity-100 hover:-translate-y-px',
                  )}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* MOBILE hamburger (<lg). Opens to Browse. */}
            <button
              type="button"
              onClick={handleHamburgerClick}
              aria-label={
                isOpen ? t('nav', 'menuClose') : t('nav', 'menuTrigger')
              }
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              aria-controls="mega-nav-overlay"
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

            {/* Waitlist CTA pill. KEPT in closed bar despite the
                spec's "no CTA in closed bar" guidance because
                Furnish is pre-launch and conversion intent
                matters on every other page. Post-launch this can
                be revisited. */}
            {APP_LAUNCHED ? (
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCtaClick('nav', 'app_store')}
                className={pillClasses}
              >
                {t('common', 'ctaAppStore')}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  trackCtaClick('nav', 'waitlist');
                  if (isOpen) onClose();
                  openWaitlist();
                }}
                className={pillClasses}
              >
                {t('common', 'ctaWaitlist')}
              </button>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
