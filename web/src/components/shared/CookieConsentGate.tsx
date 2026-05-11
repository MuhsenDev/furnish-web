'use client';

/*
  Path-scoped gate for the cookie-consent banner. Mounts the banner
  only on /blog/* routes since Skimlinks is the only cookie-setting
  third party we load, and it loads exclusively on blog pages.

  Splitting the gate from the banner lets us:
    1. Run usePathname() (client-only) without dragging the
       vanilla-cookieconsent module into the initial server bundle.
    2. ssr:false the banner so its CSS + window refs never execute
       server-side.
*/

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const CookieConsentBanner = dynamic(
  () => import('./CookieConsentBanner'),
  { ssr: false },
);

export function CookieConsentGate() {
  const pathname = usePathname();
  if (!pathname?.startsWith('/blog')) return null;
  return <CookieConsentBanner />;
}
