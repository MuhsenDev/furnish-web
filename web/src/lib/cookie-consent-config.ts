/*
  vanilla-cookieconsent v3 configuration. Mounted by
  CookieConsentBanner only on /blog/* paths via CookieConsentGate.

  The Advertising category gates the Skimlinks SDK. The loader does
  not fire until the user explicitly accepts Advertising; rejecting
  removes any previously-injected Skimlinks script tags. This is the
  GDPR-friendly path Skimlinks reviewers look for.

  Necessary is readOnly:true (always on, no user toggle). Mode
  defaults to opt-in, which is what we want.
*/

import type * as CookieConsentNS from 'vanilla-cookieconsent';
import { isSkimlinksEnabled, getSkimlinksScriptSrc } from './skimlinks';

const SKIMLINKS_DOMAIN_FRAGMENT = 'skimresources.com';

export const cookieConsentConfig: CookieConsentNS.CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: 'box',
      position: 'bottom right',
      /* Visually distinguish the two main actions: solid bronze
         "Accept all" (primary) vs bronze-outline "Essentials only"
         (secondary). Same size, same border thickness; the only
         difference is fill. Keeps the hierarchy clear without
         nudging users toward Accept (GDPR best practice). */
      equalWeightButtons: false,
    },
    preferencesModal: {
      layout: 'box',
      equalWeightButtons: false,
    },
  },
  categories: {
    necessary: {
      enabled: true,
      readOnly: true,
    },
    advertising: {
      services: {
        skimlinks: {
          label: 'Skimlinks affiliate links',
          onAccept: () => {
            if (!isSkimlinksEnabled()) return;
            const src = getSkimlinksScriptSrc();
            if (!src) return;
            /* loadScript is dynamically imported at call time so
               this config file stays SSR-safe (no top-level
               reference to the runtime module). */
            import('vanilla-cookieconsent').then((cc) => {
              cc.loadScript(src, { async: 'true' });
            });
          },
          onReject: () => {
            document
              .querySelectorAll(
                `script[src*="${SKIMLINKS_DOMAIN_FRAGMENT}"]`,
              )
              .forEach((s) => s.remove());
          },
          cookies: [{ name: /^skim/ }],
        },
      },
    },
  },
  language: {
    default: 'en',
    translations: {
      en: {
        consentModal: {
          title: 'Cookie preferences',
          description:
            'Furnish uses essential cookies to keep the site working. On blog posts we also load Skimlinks, which attributes affiliate purchases to our retailer partnerships at no additional cost to you. Choose your preference below.',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Essentials only',
          showPreferencesBtn: 'Customize',
        },
        preferencesModal: {
          title: 'Cookie preferences',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Essentials only',
          savePreferencesBtn: 'Save preferences',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'Strictly necessary',
              description:
                'Required for the site to function. Always active.',
              linkedCategory: 'necessary',
            },
            {
              title: 'Advertising and affiliate',
              description:
                'Skimlinks wraps outbound merchant links on blog posts so Furnish earns a small commission when readers buy. No personal data is collected. You can decline and still read every post normally.',
              linkedCategory: 'advertising',
            },
          ],
        },
      },
    },
  },
};
