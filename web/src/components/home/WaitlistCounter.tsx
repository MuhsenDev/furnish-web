/*
  Public aggregate signup counter.

  Server component. Reads the row count from Supabase at request
  time and renders "Join {N} people on the waitlist" near the hero
  CTA. The number is the real Supabase row count, no offset.

  Renders nothing when Supabase isn't configured, when the count
  query fails, or when the count is zero, so the component never
  shows "Join 0 people on the waitlist".

  No client-side polling. The page is server-rendered with
  cache: 'no-store' on the count query, so a fresh number arrives
  on every page load.

  Note: this component is currently not referenced by any route.
  The home page renders its own counter copy inline (see
  app/page.tsx -> fetchHeroCounterText). Kept as a typed primitive
  in case the counter is later promoted to a standalone surface.
*/

import * as React from 'react';
import { isSupabaseConfigured, supabaseCount } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface WaitlistCounterProps {
  className?: string;
}

async function fetchCount(): Promise<number | null> {
  if (!isSupabaseConfigured()) return null;
  const result = await supabaseCount('waitlist');
  if (!result.ok || result.count == null) return null;
  return result.count;
}

export async function WaitlistCounter({ className }: WaitlistCounterProps) {
  const count = await fetchCount();
  if (count == null || count <= 0) return null;
  const formatted = count.toLocaleString('en-US');

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
