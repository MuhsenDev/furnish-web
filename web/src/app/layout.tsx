import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import Script from 'next/script';
import '../styles/globals.css';
import { Nav } from '@/components/shared/Nav';
import { Footer } from '@/components/shared/Footer';
import { t } from '@/lib/i18n';

/*
  Root layout. Wires nav, footer, fonts, Plausible analytics, and
  default metadata across every route.

  Per Document 2 Section 11, only Fraunces (display) preloads.
  Inter (body) is fetched on first paint without preload.

  Plausible is added per Document 4 Section 11. The
  outbound-links variant auto-tracks every external link click,
  needed for Skimlinks attribution per Document 10.
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
const PLAUSIBLE_DOMAIN =
  process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'furnish.live';

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
        width: 1200,
        height: 630,
        alt: 'Furnish, AI redesigns any room from a photo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Furnish',
    description: 'Take a photo. Furnish does the rest.',
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
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <Script
          defer
          data-domain={PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.outbound-links.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
