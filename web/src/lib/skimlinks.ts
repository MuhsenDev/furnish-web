/*
  Skimlinks SDK wiring per Document 7 cross-document check 7 and
  Document 10 (full integration spec, not yet shipped).

  Loads ONLY when NEXT_PUBLIC_SKIMLINKS_SITE_ID is set. Loads ONLY
  on /blog/* routes (the SDK wraps outbound retailer links; other
  pages do not have any). Pre-approval, the env var is unset and
  the SDK does not load. Posts ship with plain retailer URLs that
  get wrapped at runtime once the SDK is enabled.

  This module exports a small helper used by the blog layout to
  decide whether to render the script tag.
*/

export const SKIMLINKS_SITE_ID: string =
  process.env.NEXT_PUBLIC_SKIMLINKS_SITE_ID ?? '';

export function isSkimlinksEnabled(): boolean {
  return SKIMLINKS_SITE_ID.length > 0;
}

/*
  Skimlinks script src per their public SDK docs. The siteId is
  embedded in the URL. Document 10 may revise this when it ships.
*/
export function getSkimlinksScriptSrc(): string | null {
  if (!isSkimlinksEnabled()) return null;
  return `https://s.skimresources.com/js/${SKIMLINKS_SITE_ID}.skimlinks.js`;
}
