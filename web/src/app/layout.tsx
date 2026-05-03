import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import '../styles/globals.css';

/*
  Per Document 2 Section 11, only the hero display font preloads.
  Fraunces is variable, optical-sized, used for headlines. Inter
  is the body face, NOT preloaded. The browser fetches Inter on
  first paint, which is fast enough for body copy and avoids
  blocking LCP.
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

export const metadata: Metadata = {
  title: 'Furnish, design any room from a photo',
  description:
    'Furnish is an app that fully designs any room from a single photo, and lets you shop every piece in it.',
  applicationName: 'Furnish',
  openGraph: {
    title: 'Furnish',
    description: 'Take a photo. Furnish does the rest.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Furnish',
    description: 'Take a photo. Furnish does the rest.',
  },
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
      <body>
        <a href="#main" className="skip-to-content">
          Skip to content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
