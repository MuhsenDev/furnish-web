/*
  Public aggregate signup counter.

  Server component. Reads the row count from Supabase at request
  time and renders "Join {N} people on the waitlist" near the hero
  CTA. The displayed number is `live_count + POSITION_OFFSET` per
  the position-offset policy; the offset stays server-side only.

  When Supabase isn't configured (dev / pre-launch) the counter
  renders the offset by itself so the hero still shows a sensible
  baseline number instead of "Join 0 people".

  No client-side polling. The page is server-rendered, so a fresh
  number arrives on every page load.
*/

import * as React from 'react';
import { isSupabaseConfigured, supabaseCount } from '@/lib/supabase';
import { POSITION_OFFSET } from '@/lib/referral';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface WaitlistCounterProps {
  className?: string;
}

async function fetchCount(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return POSITION_OFFSET;
  }
  const result = await supabaseCount('waitlist');
  if (!result.ok || result.count == null) {
    return POSITION_OFFSET;
  }
  return result.count + POSITION_OFFSET;
}

export async function WaitlistCounter({ className }: WaitlistCounterProps) {
  const total = await fetchCount();
  const formatted = total.toLocaleString('en-US');

  return (
    <p
      className={cn(
        'text-body-s text-muted',
        className,
      )}
      aria-live="off"
    >
      {t('waitlist', 'publicCounter').replace('{n}', formatted)}
    </p>
  );
}
