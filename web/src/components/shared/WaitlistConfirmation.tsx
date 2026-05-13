'use client';

/*
  Waitlist confirmation surface.

  Rendered in place of the signup form once the user submits a
  valid email. Confirms the signup with a "You're on the list"
  eyebrow, then offers the share affordances (referral link with
  Copy + native share + Twitter/X / iMessage / Copy Link buttons)
  and a confirmation reminder for the email we just sent.

  Inputs come from the API response: { position, referralCode }.
  `position` is still passed by callers but is intentionally not
  rendered any more (Hassan, 2026-05: "no fake numbers, no real
  numbers either, just confirm they're on the list"). The share
  URL is derived by prefixing referralCode with the canonical
  site URL.

  Copy/share fallback chain:
    1. navigator.share if available -> primary mobile path
    2. navigator.clipboard.writeText -> always available in modern
       browsers, used for the Copy button
    3. document.execCommand('copy') -> last-resort fallback for
       very old WebKit; rarely hit in 2026

  No platform-specific tracking. Buttons fire window.open or a
  share intent and let the OS handle it.
*/

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Copy, Share2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface WaitlistConfirmationProps {
  email: string;
  position: number;
  referralCode: string;
  /**
   * If true, this user was already on the list. The confirmation
   * surface tones the headline accordingly (still warm; doesn't
   * scold).
   */
  alreadyOnList?: boolean;
  /** Optional class on the root for parent layout overrides. */
  className?: string;
}

const SITE_URL = 'https://furnish.live';

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function WaitlistConfirmation({
  email,
  referralCode,
  alreadyOnList,
  className,
}: WaitlistConfirmationProps) {
  const prefersReducedMotion = useReducedMotion();

  const referralLink = `${SITE_URL}/?ref=${encodeURIComponent(referralCode)}`;
  const shareMessage = t('waitlist', 'shareMessage')
    .replace('{link}', referralLink);

  const [copyState, setCopyState] = React.useState<'idle' | 'copied'>('idle');
  /* Explicit boolean type so TS doesn't narrow to a literal-false
     state from the SSR-initial evaluation of navigator availability. */
  const [showFallbackShares, setShowFallbackShares] = React.useState<boolean>(
    typeof navigator !== 'undefined' && !navigator.share,
  );
  const [canNativeShare, setCanNativeShare] = React.useState<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink);
      } else if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
      }
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      /* Silent fail. The input is selectable so the user can still
         copy manually with Cmd/Ctrl+C. */
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      setShowFallbackShares(true);
      return;
    }
    try {
      await navigator.share({
        title: t('waitlist', 'shareTitle'),
        text: shareMessage,
        url: referralLink,
      });
    } catch {
      /* User canceled or platform refused. No state change. */
    }
  };

  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareIMessage = () => {
    /* sms: scheme with body= works on iOS; Android typically
       handles it too. The leading & after sms: is correct: it tells
       iOS the recipient is empty so the share-sheet picks it up. */
    const body = encodeURIComponent(shareMessage);
    window.location.href = `sms:&body=${body}`;
  };

  return (
    <div className={cn('text-center', className)}>
      <p className="eyebrow">
        {alreadyOnList
          ? t('waitlist', 'confirmAlreadyEyebrow')
          : t('waitlist', 'confirmEyebrow')}
      </p>

      <hr className="my-section-y-tight border-[rgba(43,30,24,0.10)]" />

      <h3
        className={cn(
          'font-display text-deep',
          'tracking-display-tight leading-display',
          'text-display-m',
        )}
      >
        {t('waitlist', 'moveUpHeadline')}
      </h3>
      <p className="mt-3 mx-auto max-w-md text-body-m text-ink/85">
        {t('waitlist', 'moveUpBody')}
      </p>

      {/* Referral link + Copy. Read-only input, full-width pill. */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          ref={inputRef}
          type="text"
          readOnly
          aria-label={t('waitlist', 'referralLinkAria')}
          value={referralLink}
          className={cn(
            'flex-1 min-w-0 rounded-sm border border-[rgba(43,30,24,0.20)] bg-surface',
            'px-4 py-3 text-body-m text-deep font-mono',
            'focus:border-[var(--color-accent)] focus:outline-none',
            'overflow-x-auto',
          )}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={copyLink}
          className={cn(
            'shrink-0 inline-flex items-center justify-center gap-2',
            'rounded-sm border border-[rgba(43,30,24,0.20)]',
            'bg-surface px-5 py-3 text-body-m font-semibold text-deep',
            'transition-colors duration-200 ease-premium',
            'hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/[0.06]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
          )}
        >
          {copyState === 'copied' ? (
            <>
              <Check size={16} strokeWidth={2} aria-hidden="true" />
              {t('waitlist', 'copied')}
            </>
          ) : (
            <>
              <Copy size={16} strokeWidth={2} aria-hidden="true" />
              {t('waitlist', 'copy')}
            </>
          )}
        </button>
      </div>

      {/* Share affordances. Native first; fallback platform buttons
          appear when navigator.share is unavailable OR the user
          taps the "More options" disclosure. */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {canNativeShare && (
          <motion.button
            type="button"
            onClick={nativeShare}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
            }
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2',
              'rounded-sm bg-[var(--color-accent)] text-cream',
              'px-6 py-3 text-body-m font-semibold',
              'shadow-1 btn-primary-hover',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
            )}
          >
            <Share2 size={16} strokeWidth={2} aria-hidden="true" />
            {t('waitlist', 'nativeShare')}
          </motion.button>
        )}

        {!canNativeShare && !showFallbackShares && (
          <button
            type="button"
            onClick={() => setShowFallbackShares(true)}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2',
              'rounded-sm bg-[var(--color-accent)] text-cream',
              'px-6 py-3 text-body-m font-semibold',
              'shadow-1 btn-primary-hover',
            )}
          >
            <Share2 size={16} strokeWidth={2} aria-hidden="true" />
            {t('waitlist', 'shareEllipsis')}
          </button>
        )}
      </div>

      {/* Per-platform share buttons, revealed when native is
          unavailable or the user opts in. */}
      {showFallbackShares && (
        <div
          className={cn(
            'mt-3 flex flex-wrap items-center justify-center gap-2',
          )}
        >
          <button
            type="button"
            onClick={shareTwitter}
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'rounded-sm border border-[rgba(43,30,24,0.20)] bg-surface',
              'px-4 py-2 text-body-s font-semibold text-deep',
              'hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/[0.06]',
            )}
          >
            {t('waitlist', 'shareTwitter')}
          </button>
          {isMobile() && (
            <button
              type="button"
              onClick={shareIMessage}
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'rounded-sm border border-[rgba(43,30,24,0.20)] bg-surface',
                'px-4 py-2 text-body-s font-semibold text-deep',
                'hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/[0.06]',
              )}
            >
              <MessageCircle size={14} strokeWidth={2} aria-hidden="true" />
              {t('waitlist', 'shareIMessage')}
            </button>
          )}
          <button
            type="button"
            onClick={copyLink}
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'rounded-sm border border-[rgba(43,30,24,0.20)] bg-surface',
              'px-4 py-2 text-body-s font-semibold text-deep',
              'hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/[0.06]',
            )}
          >
            <Copy size={14} strokeWidth={2} aria-hidden="true" />
            {t('waitlist', 'shareCopyLink')}
          </button>
        </div>
      )}

      {/* Inbox reminder. */}
      <p className="mt-section-y-tight text-body-s text-ink/70">
        {t('waitlist', 'inboxReminder').replace('{email}', email)}
      </p>
    </div>
  );
}
