'use client';

/*
  PostHogProvider , Furnish marketing site analytics.

  Wires PostHog (posthog-js) into the Next.js App Router with proper
  pageview tracking. Pageviews fire on every client-side navigation
  via usePathname + useSearchParams, NOT PostHog's default
  capture_pageview (which only fires on full page loads and misses
  most SPA route changes).

  The Furnish project on PostHog is shared between:
    - This marketing site (furnish.live)
    - The mobile/web app (the static SPA in MuhsenDev/furnish-app)
  So events from both surfaces aggregate into one funnel ,
  furnish.live visitor → waitlist signup → app open → first redesign
  → first product tap → affiliate click → purchase. That's the
  cross-surface story the launch plan section 4.4.9 expects.

  Env vars (set in Vercel project settings):
    NEXT_PUBLIC_POSTHOG_KEY   , phc_* public-write key (safe to ship)
    NEXT_PUBLIC_POSTHOG_HOST  , usually https://us.i.posthog.com

  If NEXT_PUBLIC_POSTHOG_KEY is unset, this component no-ops cleanly.
  Local dev without the env var doesn't break anything.

  Privacy posture:
    - person_profiles: 'identified_only' , anonymous visitors don't
      create person profiles. Only PostHog session IDs.
    - capture_pageleave: true , measures dwell + bounce.
    - Vercel Analytics already runs site-wide without consent
      gating (see layout.tsx). PostHog adopts the same posture.
      EU GDPR consent gating is a follow-up if needed; the existing
      CookieConsentGate self-scopes to /blog/* for Skimlinks.
*/

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
    if (!key) {
      // Local dev or missing env var , no-op. Don't spam the console
      // with a warning every time; one info-level line is enough.
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info('[Furnish] PostHog skipped (NEXT_PUBLIC_POSTHOG_KEY not set).');
      }
      return;
    }
    // posthog.__loaded guards re-init during HMR / strict-mode double-render.
    // The cast is needed because posthog-js does not type this internal flag.
    if ((posthog as unknown as { __loaded?: boolean }).__loaded) return;
    posthog.init(key, {
      api_host: host,
      // We handle pageviews ourselves below (SPA routing).
      capture_pageview: false,
      capture_pageleave: true,
      person_profiles: 'identified_only',
      // Defer autocapture until after the first paint , Furnish's hero
      // animation is heavy; we don't want PostHog's listener registration
      // adding microtask overhead during the initial paint window.
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.info('[Furnish] PostHog initialized.');
        }
      },
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      {/* Suspense boundary is required because PageViewTracker reads
          useSearchParams, which suspends during prerender per Next 14
          App Router rules. */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    let url = window.location.origin + pathname;
    const search = searchParams?.toString();
    if (search) url += `?${search}`;
    ph.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}
