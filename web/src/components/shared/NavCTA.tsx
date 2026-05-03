'use client';

/*
  Persistent CTA pill in the top-right of the nav per Document 4
  Section 5.1. Pre-launch: "Join the Waitlist" links to the home
  page #waitlist anchor. Post-launch: "Get the App" links to the
  iOS App Store URL.

  Gated by the NEXT_PUBLIC_APP_LAUNCHED env var. Default value
  pre-launch.

  Smaller on mobile but always visible. The waitlist/App Store
  conversion is the entire site's job; the pill earns its real
  estate.
*/

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { trackCtaClick } from '@/lib/analytics';

export interface NavCTAProps {
  /** Where this CTA lives. Used for analytics attribution. */
  location?: 'nav' | 'menu' | 'footer';
  className?: string;
}

const APP_LAUNCHED = process.env.NEXT_PUBLIC_APP_LAUNCHED === 'true';
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '/';

export function NavCTA({ location = 'nav', className }: NavCTAProps) {
  const label = APP_LAUNCHED ? t('common', 'ctaAppStore') : t('common', 'ctaWaitlist');
  const href = APP_LAUNCHED ? APP_STORE_URL : '/#waitlist';
  const target = APP_LAUNCHED ? '_blank' : undefined;
  const rel = APP_LAUNCHED ? 'noopener noreferrer' : undefined;

  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      onClick={() => trackCtaClick(location, APP_LAUNCHED ? 'app_store' : 'waitlist')}
      className={cn(
        'btn-primary-hover inline-flex items-center justify-center',
        'rounded-full bg-[var(--color-accent)] text-cream',
        'px-4 py-2 text-body-s font-semibold',
        'sm:px-5 sm:py-2.5 sm:text-body-m',
        'shadow-1',
        className,
      )}
    >
      {label}
    </Link>
  );
}
