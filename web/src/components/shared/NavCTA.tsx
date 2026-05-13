'use client';

/*
  Persistent CTA pill in the top-right of the nav per Document 4
  Section 5.1.

  Pre-launch: "Join the Waitlist", clicking opens the shared
  WaitlistModal via the WaitlistProvider context (every Join-the-
  Waitlist CTA across the site triggers the same modal so the user
  experience is consistent regardless of which entry point they
  click).

  Post-launch: "Get the App", links to the iOS App Store URL via
  a regular anchor with target="_blank".

  Gated by the NEXT_PUBLIC_APP_LAUNCHED env var. Default pre-launch.
*/

import * as React from 'react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { trackCtaClick } from '@/lib/analytics';
import { useWaitlist } from './WaitlistContext';

export interface NavCTAProps {
  /** Where this CTA lives. Used for analytics attribution. */
  location?: 'nav' | 'menu' | 'footer';
  className?: string;
  /** Optional: when this CTA lives inside another overlay (e.g.
      MenuTakeover) the wrapper may want to dismiss itself before
      the modal opens. */
  onClick?: () => void;
}

const APP_LAUNCHED = process.env.NEXT_PUBLIC_APP_LAUNCHED === 'true';
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '/';

const PILL_CLASSES = cn(
  'btn-primary-hover inline-flex items-center justify-center',
  'rounded-full bg-[var(--color-accent)] text-cream',
  'px-4 py-2 text-body-s font-semibold',
  'sm:px-5 sm:py-2.5 sm:text-body-m',
  'shadow-1',
);

export function NavCTA({ location = 'nav', className, onClick }: NavCTAProps) {
  const { open: openWaitlist } = useWaitlist();
  const label = APP_LAUNCHED
    ? t('common', 'ctaAppStore')
    : t('common', 'ctaWaitlist');

  /* Post-launch: render an external link to the App Store. */
  if (APP_LAUNCHED) {
    return (
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          trackCtaClick(location, 'app_store');
          onClick?.();
        }}
        className={cn(PILL_CLASSES, className)}
      >
        {label}
      </a>
    );
  }

  /* Pre-launch: button that opens the shared WaitlistModal. */
  return (
    <button
      type="button"
      onClick={() => {
        trackCtaClick(location, 'waitlist');
        onClick?.();
        openWaitlist();
      }}
      className={cn(PILL_CLASSES, className)}
    >
      {label}
    </button>
  );
}
