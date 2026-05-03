/*
  Minimal i18n architecture per Document 4 Section 7.

  v1 ships English-only with the structure ready for future locales.
  Every visible string lives in a JSON file under src/content/i18n/
  and is referenced via this module rather than hardcoded.

  IMPORTANT DEVIATION FROM DOCUMENT 4:
  Document 4 prompt section §4G specifies adding an `i18n` block to
  next.config.mjs. That config field is Pages-Router-only and is
  NOT supported by the Next.js 14 App Router (this project uses
  App Router via src/app/). The recommended App Router pattern is
  middleware-based locale detection plus [locale] route segments.

  At v1 with English-only, no middleware or route segments are
  needed. This helper preserves the architecture intent (translation
  keys, swappable locales) without the unsupported config field.
  When Hassan adds Spanish/French/Arabic post-launch, the path is:
    1. Add the locale JSON files under src/content/i18n/<locale>/
    2. Add the locale to SUPPORTED_LOCALES below
    3. Wire [locale] route segments + middleware (separate doc)

  Components consume strings like:
    import { t } from '@/lib/i18n';
    t('nav', 'menu')           returns "Menu"
*/

import common from '@/content/i18n/en/common.json';
import nav from '@/content/i18n/en/nav.json';
import footer from '@/content/i18n/en/footer.json';
import notFound from '@/content/i18n/en/not-found.json';
import home from '@/content/i18n/en/home.json';
import gallery from '@/content/i18n/en/gallery.json';

export type Locale = 'en';
export type Namespace =
  | 'common'
  | 'nav'
  | 'footer'
  | 'not-found'
  | 'home'
  | 'gallery';

export const DEFAULT_LOCALE: Locale = 'en';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en'] as const;

const messages: Record<Locale, Record<Namespace, Record<string, string>>> = {
  en: {
    common,
    nav,
    footer,
    'not-found': notFound,
    home,
    gallery,
  },
};

/*
  Look up a translation. Falls back to the key itself if the lookup
  misses, so a missing key fails visibly in dev rather than silently
  rendering an empty string.
*/
export function t(
  namespace: Namespace,
  key: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const ns = messages[locale]?.[namespace];
  if (!ns) return key;
  const value = ns[key];
  if (value == null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Missing key "${key}" in ${locale}/${namespace}.`);
    }
    return key;
  }
  return value;
}

/*
  Bulk-fetch all keys in a namespace. Useful when a component renders
  a list of translated strings.
*/
export function getNamespace(
  namespace: Namespace,
  locale: Locale = DEFAULT_LOCALE,
): Record<string, string> {
  return messages[locale]?.[namespace] ?? {};
}

/*
  Currency formatter using the Intl API per Document 4 Section 7.2.
  Hardcoded "$3,000" strings violate the i18n architecture; this
  helper formats based on locale.
*/
export function formatCurrency(
  amount: number,
  locale: Locale = DEFAULT_LOCALE,
  currency = 'USD',
): string {
  return new Intl.NumberFormat(localeToBcp47(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/*
  Date formatter using the Intl API.
*/
export function formatDate(
  date: Date | string | number,
  locale: Locale = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat(localeToBcp47(locale), options).format(d);
}

function localeToBcp47(locale: Locale): string {
  /* Maps internal Locale codes to BCP-47 tags. v1 is just 'en' to
     'en-US'. When more locales are added, expand this mapping. */
  const map: Record<Locale, string> = {
    en: 'en-US',
  };
  return map[locale] ?? 'en-US';
}
