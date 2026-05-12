/** @type {import('next').NextConfig} */

/*
  next.config.mjs

  Redirects per Document 4 §6.2. Security headers per Document 9
  §15.1. Image optimization defaults per Document 2 §11. Image
  domains for retailer-hosted product images per Document 7 §4.

  Note on i18n: Document 4 §7 specifies architecture ready for
  future locales. App Router does NOT support the legacy i18n
  config field. The architecture lives in src/lib/i18n.ts and
  src/content/i18n/<locale>/ instead.

  Note on CSP: Document 9 §15.1 requires CSP report-only at launch
  with promotion to enforced after 2 weeks of clean reports.
  Plausible plus Skimlinks domains pre-allowed in script-src.
  Inline styles allowed for Tailwind plus Next.js runtime.
*/

const APP_LAUNCHED = process.env.NEXT_PUBLIC_APP_LAUNCHED === 'true';
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || '/';

/* Content Security Policy. Report-only at launch (per Doc 9 §15.1).
   Promote to enforcing once we have two weeks of clean reports.
   The unsafe-inline on style-src is required by Tailwind's
   runtime; the unsafe-eval is required by Next.js dev mode and
   removed in production via the conditional below. */
const isDev = process.env.NODE_ENV !== 'production';

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://plausible.io https://*.skimresources.com https://*.skimlinks.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.skimresources.com https://*",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://plausible.io https://*.skimresources.com https://*.skimlinks.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    /* Allow Next/Image to optimize images served from retailer CDNs
       (used by ProductCard fallback when an image is referenced by
       its retailer URL rather than a locally cached copy). Pattern
       list is conservative and expanded as new retailers join. */
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.shopify.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap', 'framer-motion'],
  },

  async redirects() {
    const launchedRedirects = APP_LAUNCHED
      ? [
          { source: '/app', destination: APP_STORE_URL, permanent: false },
          { source: '/ios', destination: APP_STORE_URL, permanent: false },
        ]
      : [];

    return [
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/contact', destination: '/about#contact', permanent: true },
      { source: '/help', destination: '/about#contact', permanent: true },
      { source: '/work', destination: '/gallery', permanent: true },
      { source: '/gallery/all', destination: '/gallery', permanent: true },
      { source: '/android', destination: '/?coming-soon=android', permanent: false },
      ...launchedRedirects,
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          /* HSTS. 2 years, include subdomains, eligible for preload
             list. Per Doc 9 §15.1. */
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          /* CSP report-only at launch. Promote to enforced
             (Content-Security-Policy) after two weeks of clean
             reports per Doc 9 §15.1. */
          {
            key: 'Content-Security-Policy-Report-Only',
            value: cspDirectives,
          },
          /* Cross-origin policies. Block third-party iframes from
             reading our context; required for some Lighthouse
             security checks. */
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
