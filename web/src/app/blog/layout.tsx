/*
  Blog-scoped layout. The Skimlinks SDK is NOT injected here.

  Skimlinks now loads conditionally through the cookie-consent
  banner: see web/src/lib/cookie-consent-config.ts. The Advertising
  category's skimlinks service calls CookieConsent.loadScript() in
  its onAccept handler, and removes any injected script tag in
  onReject. The env-flag (NEXT_PUBLIC_SKIMLINKS_SITE_ID) remains as
  a kill switch inside that handler.

  Pre-approval the env var is unset, the script never loads, and
  posts ship with plain retailer URLs. Once Skimlinks approves and
  Hassan sets the env var in Vercel, the loader fires after the
  reader accepts the Advertising cookie category.
*/

import * as React from 'react';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
