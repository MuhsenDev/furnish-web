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
    consentModal: { layout: 'box', position: 'bottom right' },
    preferencesModal: { layout: 'box' },
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
          title: 'A small note on cookies',
          description:
            'On blog posts we use Skimlinks to wrap merchant links so we get attributed for any purchases. That sets a small advertising cookie. The rest of the site uses none. You can accept, reject, or pick.',
          acceptAllBtn: 'Accept',
          acceptNecessaryBtn: 'Reject',
          showPreferencesBtn: 'Pick',
        },
        preferencesModal: {
          title: 'Cookie preferences',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          savePreferencesBtn: 'Save preferences',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'Strictly necessary',
              description:
                'Required for the site to function. Always on.',
              linkedCategory: 'necessary',
            },
            {
              title: 'Advertising and affiliate',
              description:
                'Skimlinks wraps outbound merchant links on blog posts so we earn a small commission when readers buy. No personal data is collected. You can reject and still read every post normally.',
              linkedCategory: 'advertising',
            },
          ],
        },
      },
    },
  },
};
