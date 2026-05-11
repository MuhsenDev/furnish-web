'use client';

/*
  vanilla-cookieconsent v3 mount point. Imported dynamically with
  ssr:false from CookieConsentGate so the package's CSS + window
  refs never execute server-side.

  CookieConsent.run() is idempotent; the effect re-runs on client
  navigation but the plugin de-dupes init internally.
*/

import * as React from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import { cookieConsentConfig } from '@/lib/cookie-consent-config';

export default function CookieConsentBanner() {
  React.useEffect(() => {
    CookieConsent.run(cookieConsentConfig);
  }, []);
  return null;
}
