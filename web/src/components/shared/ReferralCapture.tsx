'use client';

/*
  Referral capture + banner.

  Mounted at the layout level (just inside <WaitlistProvider>) so
  every route sees ?ref=xyz on initial load, captures it into
  cookie + localStorage, and shows a subtle banner above the page.

  Banner behavior:
    - Shows only when ?ref=<valid-code> is present in the URL OR a
      previously stored code exists. Persists for the page session
      then auto-dismisses unless the user has stored history of a
      previous referral.
    - Dismissable via X button. Dismissal sets a session-storage
      flag so the banner doesn't reappear on every nav within the
      session. It DOES reappear on a fresh visit, since the
      attribution is still active.
    - Brand-color background, full-width, single-line on desktop.
    - prefers-reduced-motion: instant show, no slide-in.

  This component is a client component because URL params, cookies,
  and localStorage are all client-only. It renders nothing server-
  side, which is fine: the banner is purely informational.
*/

import * as React from 'react';
import { X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { persistReferralCode, readReferralCode } from './referralStorage';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

const SESSION_DISMISS_KEY = 'furnish_ref_banner_dismissed';
const REFERRAL_CODE_RE = /^[a-z0-9]{4,16}$/;

export function ReferralCapture() {
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const fromUrl = searchParams?.get('ref')?.toLowerCase().trim() ?? '';
    if (REFERRAL_CODE_RE.test(fromUrl)) {
      persistReferralCode(fromUrl);
    }

    const stored = readReferralCode();
    if (!stored) {
      setShow(false);
      return;
    }

    /* Skip the banner if the user dismissed it earlier in this
       session. The attribution itself stays active in cookie /
       localStorage. */
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(SESSION_DISMISS_KEY) === '1';
    } catch {
      /* sessionStorage disabled, fall through and show. */
    }
    setShow(!dismissed);
  }, [searchParams]);

  const handleDismiss = () => {
    try {
      window.sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={
            prefersReducedMotion ? false : { height: 0, opacity: 0 }
          }
          animate={{ height: 'auto', opacity: 1 }}
          exit={
            prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
          }
          style={{ overflow: 'hidden' }}
          className={cn(
            'w-full bg-[var(--color-accent-peach)] text-deep',
          )}
        >
          <div
            className={cn(
              'mx-auto max-w-default px-5 sm:px-6 lg:px-8',
              'flex items-center justify-center gap-3',
              'py-2.5',
            )}
          >
            <p className="text-body-s font-medium text-center">
              {t('waitlist', 'referralBanner')}
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={t('waitlist', 'referralBannerDismiss')}
              className={cn(
                'shrink-0 inline-flex h-7 w-7 items-center justify-center',
                'rounded-full text-cream/85 hover:text-cream hover:bg-cream/10',
                'transition-colors duration-150 ease-premium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream',
              )}
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
