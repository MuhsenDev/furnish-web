/*
  Blog-scoped layout. Loads the Skimlinks SDK only on /blog/*
  routes, only when NEXT_PUBLIC_SKIMLINKS_SITE_ID is set per
  Document 7 cross-document check 7 and Document 10.

  Pre-approval the env var is unset, the script never loads, and
  posts ship with plain retailer URLs. Once Skimlinks approves
  the publisher application and Hassan sets the env var in Vercel,
  the SDK loads on the next deploy and starts wrapping outbound
  retailer links automatically.
*/

import * as React from 'react';
import Script from 'next/script';
import { isSkimlinksEnabled, getSkimlinksScriptSrc } from '@/lib/skimlinks';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const skimlinksSrc = getSkimlinksScriptSrc();

  return (
    <>
      {children}
      {isSkimlinksEnabled() && skimlinksSrc && (
        <Script
          src={skimlinksSrc}
          strategy="afterInteractive"
          /* Skimlinks recommends async; afterInteractive in Next/Script
             attaches an async script, deferred past first paint. */
        />
      )}
    </>
  );
}
