'use client';

/*
  WaitlistModal — dialog that explains how the Furnish waitlist
  works and collects an email address. Opens when the Hero "Join
  the Waitlist" CTA is clicked. Replaces the previous inline
  EmailWaitlist form embedded directly in the hero.

  Why a modal instead of the inline form: Hassan asked for a
  prompt-style flow. The CTA button now sits side-by-side with
  "See How It Works"; clicking it surfaces a small dialog that
  explains the waitlist + collects the email. Cleaner hero.

  Behavior:
  - Esc key closes
  - Click on the backdrop closes
  - Focus moves to the email input on open
  - Body scroll locked while open
  - On submit success, the form swaps to a confirmation state
    (matches the inline EmailWaitlist's pattern)
*/

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

export function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMsg, setErrorMsg] = React.useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  /* Esc closes. Body scroll locks while open. Focus moves to the
     input. All cleanup on unmount or close. */
  React.useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    /* Focus the input on next tick so the dialog has mounted. */
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  /* Reset state when the modal closes so reopening starts fresh. */
  React.useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => {
        setEmail('');
        setStatus('idle');
        setErrorMsg('');
      }, 200);
      return () => window.clearTimeout(t);
    }
  }, [open]);

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
    track('home_email_waitlist_submit', { location: 'modal' });

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
      track('waitlist_success', { location: 'modal' });
    } catch {
      setStatus('error');
      setErrorMsg(t('home', 'waitlistError'));
      track('waitlist_error', { location: 'modal' });
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-modal-title"
      className={cn(
        'fixed inset-0 z-50',
        'flex items-center justify-center',
        'p-4',
      )}
    >
      {/* Backdrop. Click closes. */}
      <button
        type="button"
        aria-label={t('home', 'waitlistModalDismiss')}
        onClick={onClose}
        className={cn(
          'absolute inset-0',
          'bg-deep/70 backdrop-blur-sm',
          'cursor-default',
        )}
      />

      {/* Dialog card. Stop propagation so clicks inside don't
          close. */}
      <div
        className={cn(
          'relative w-full max-w-md',
          'rounded-[var(--radius)]',
          'bg-cream shadow-2',
          'border border-[rgba(43,30,24,0.08)]',
          'p-6 sm:p-8',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button, top-right. */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('home', 'waitlistModalDismiss')}
          className={cn(
            'absolute right-3 top-3',
            'inline-flex h-9 w-9 items-center justify-center',
            'rounded-full text-ink/70 hover:text-deep',
            'hover:bg-[var(--color-beige)]',
            'transition-colors duration-200 ease-premium',
          )}
        >
          <X size={18} strokeWidth={1.75} />
        </button>

        <h2
          id="waitlist-modal-title"
          className={cn(
            'font-display text-deep',
            'tracking-display-tight leading-display-tight',
            'text-display-m',
          )}
        >
          {t('home', 'waitlistModalTitle')}
        </h2>

        <p className="mt-3 text-body-m text-ink/85 leading-relaxed">
          {t('home', 'waitlistModalDescription')}
        </p>

        {status === 'success' ? (
          <p
            role="status"
            className="mt-6 rounded-sm bg-[var(--color-beige)]/60 p-4 text-body-m text-deep"
          >
            {t('home', 'waitlistSuccess')}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6" noValidate>
            <input
              ref={inputRef}
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
                'block w-full',
                'rounded-sm border bg-surface',
                'border-[rgba(43,30,24,0.16)]',
                'px-4 py-3 text-body-m text-ink',
                'placeholder:text-muted',
                'transition-colors duration-200 ease-premium',
                'focus:border-[var(--color-accent)] focus:outline-none',
              )}
            />

            <button
              type="submit"
              disabled={status === 'loading'}
              className={cn(
                'btn-primary-hover',
                'mt-3 w-full',
                'inline-flex items-center justify-center',
                'rounded-sm bg-[var(--color-accent)] text-cream',
                'px-6 py-3 text-body-m font-semibold',
                'shadow-1',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
            >
              {status === 'loading' ? '...' : t('home', 'waitlistButton')}
            </button>

            {status === 'error' && (
              <p
                role="alert"
                className="mt-3 text-body-s text-[var(--color-danger)]"
              >
                {errorMsg}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
