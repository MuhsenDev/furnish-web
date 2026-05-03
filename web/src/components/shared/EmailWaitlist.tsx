'use client';

/*
  Inline email waitlist form per Document 5 §1.8 (hero pre-launch
  variant) and §8.5 (final CTA pre-launch variant).

  POST to /api/waitlist (server route in src/app/api/waitlist/route.ts).
  State machine: idle, loading, success, error.

  Per Document 4 §6.3 forms are minimal: single field, no label
  (placeholder only), inline submit button. Border becomes accent
  color on focus.

  Auto-fires home_email_waitlist_submit on submit-attempt and
  waitlist_success / waitlist_error on resolution.
*/

import * as React from 'react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';

type Status = 'idle' | 'loading' | 'success' | 'error';

export interface EmailWaitlistProps {
  /** Where this form lives. Used for analytics attribution. */
  location: 'hero' | 'final_cta';
  /** Color scheme. 'on-light' for light bg, 'on-dark' for image overlay. */
  scheme?: 'on-light' | 'on-dark';
  className?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailWaitlist({
  location,
  scheme = 'on-light',
  className,
}: EmailWaitlistProps) {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMsg, setErrorMsg] = React.useState<string>('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'loading') return;

    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error');
      setErrorMsg(t('home', 'waitlistInvalidEmail'));
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    track('home_email_waitlist_submit', { location });

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setStatus('success');
      track('waitlist_success', { location });
    } catch {
      setStatus('error');
      setErrorMsg(t('home', 'waitlistError'));
      track('waitlist_error', { location });
    }
  };

  if (status === 'success') {
    return (
      <p
        role="status"
        className={cn(
          'text-body-m',
          scheme === 'on-dark' ? 'text-cream' : 'text-deep',
          className,
        )}
      >
        {t('home', 'waitlistSuccess')}
      </p>
    );
  }

  const inputClasses =
    scheme === 'on-dark'
      ? 'bg-cream/95 border-cream/60 text-deep placeholder:text-muted'
      : 'bg-surface border-[rgba(43,30,24,0.16)] text-ink placeholder:text-muted';

  return (
    <form
      onSubmit={onSubmit}
      className={cn('w-full max-w-md', className)}
      noValidate
    >
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row',
          'items-stretch',
        )}
      >
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-label={t('home', 'waitlistEmailPlaceholder')}
          placeholder={t('home', 'waitlistEmailPlaceholder')}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          className={cn(
            'flex-1 rounded-sm border px-4 py-3',
            'text-body-m',
            'transition-colors duration-200',
            'focus:border-[var(--color-accent)] focus:outline-none',
            inputClasses,
          )}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'btn-primary-hover',
            'inline-flex items-center justify-center',
            'rounded-sm bg-[var(--color-accent)] text-cream',
            'px-6 py-3 text-body-m font-semibold',
            'shadow-1',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          {status === 'loading' ? '...' : t('home', 'waitlistButton')}
        </button>
      </div>
      {status === 'error' && (
        <p
          role="alert"
          className={cn(
            'mt-2 text-body-s',
            scheme === 'on-dark' ? 'text-cream' : 'text-[var(--color-danger)]',
          )}
        >
          {errorMsg}
        </p>
      )}
    </form>
  );
}
