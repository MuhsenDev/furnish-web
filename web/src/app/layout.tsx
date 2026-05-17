import * as React from 'react';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import '../styles/globals.css';
import { MegaNav } from '@/components/shared/MegaNav';
import { Footer } from '@/components/shared/Footer';
import { WaitlistProvider } from '@/components/shared/WaitlistContext';
import { ReferralCapture } from '@/components/shared/ReferralCapture';
import { CookieConsentGate } from '@/components/shared/CookieConsentGate';
import { PostHogProvider } from '@/components/shared/PostHogProvider';
import { t } from '@/lib/i18n';

/*
  Root layout. Wires nav, footer, fonts, Vercel Analytics plus
  Speed Insights, and default metadata across every route.

  Per Document 2 Section 11, only Fraunces (display) preloads.
  Inter (body) is fetched on first paint without preload.

  Vercel Analytics:
    - Tracks page views and custom events
    - No cookies, no cross-site tracking
    - Activated in Vercel project settings (Analytics > Enable)

  Vercel Speed Insights:
    - Real User Monitoring of Core Web Vitals (LCP, INP, CLS)
    - Activated in Vercel project settings (Speed Insights > Enable)

  Both components no-op when running locally without the
  dashboard toggle on. They only collect on the production deploy.
*/

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
  weight: ['400', '500', '600', '700'],
});

const SITE_URL = 'https://furnish.live';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Furnish, design any room from a photo',
    template: '%s | Furnish',
  },
  description:
    'Furnish is an app that fully designs any room from a single photo, and lets you shop every piece in it.',
  applicationName: 'Furnish',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Furnish',
    description: 'Take a photo. Furnish does the rest.',
    url: SITE_URL,
    siteName: 'Furnish',
    type: 'website',
    images: [
      {
        url: '/images/og/og-default.jpg',
        width: 1050,
        height: 600,
        alt: 'Furnish, AI redesigns any room from a photo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Furnish',
    description: 'Take a photo. Furnish does the rest.',
    images: [
      {
        url: '/images/og/og-default.jpg',
        width: 1050,
        height: 600,
        alt: 'Furnish, AI redesigns any room from a photo',
      },
    ],
  },
  /* Favicon + tab icon variants. /icon.svg is the primary
     (modern browsers render the SVG sharply at any size). PNG
     fallbacks at 16×16 and 32×32 for older browsers that don't
     do SVG favicons. apple-touch-icon at 180×180 PNG for iOS
     home-screen shortcuts (iOS specifically prefers PNG here). */
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: { url: '/icon.svg', type: 'image/svg+xml' },
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#8B6F47',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="skip-to-content">
          {t('common', 'skipToContent')}
        </a>
        {/* PostHogProvider wraps everything so its $pageview events
            fire on every client-side navigation. It uses the App
            Router's usePathname + useSearchParams (Suspense-wrapped
            internally) and no-ops cleanly when
            NEXT_PUBLIC_POSTHOG_KEY isn't set (local dev). */}
        <PostHogProvider>
          {/* WaitlistProvider mounts the modal once at root and
              exposes openWaitlist() to every CTA on the site (nav
              pill, mobile menu, hero, gallery, blog, final CTA,
              comparison table). One modal, many triggers. */}
          <WaitlistProvider>
            {/* ReferralCapture mounts inside Suspense (it uses
                useSearchParams) and silently captures ?ref=xyz on
                first paint. Renders a thin top banner when a code is
                active. Wrapping in Suspense per Next App Router
                requirement. */}
            <React.Suspense fallback={null}>
              <ReferralCapture />
            </React.Suspense>
            {/* CookieConsentGate self-scopes to /blog/* and dynamically
                imports the banner with ssr:false so the consent module
                never runs on the server. Skimlinks activation lives
                inside the config's advertising.services.skimlinks
                onAccept callback, NOT in blog/layout.tsx. */}
            <CookieConsentGate />
            <MegaNav />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </WaitlistProvider>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
