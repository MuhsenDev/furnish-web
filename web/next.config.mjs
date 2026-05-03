/** @type {import('next').NextConfig} */

/*
  next.config.mjs

  Includes redirects per Document 4 Section 6.2, security headers
  per Document 9 Section 12.4 (provisional, refined when Doc 9
  ships), and image optimization defaults per Document 2 Section 11.

  Note on i18n: Document 4 Section 7 specifies architecture ready
  for future locales. App Router does NOT support the legacy i18n
  config field. The architecture lives in src/lib/i18n.ts and
  src/content/i18n/<locale>/ instead. See the i18n module header
  for the migration path when more locales launch.
*/

const APP_LAUNCHED = process.env.NEXT_PUBLIC_APP_LAUNCHED === 'true';
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || '/';

const nextConfig = {
  reactStrictMode: true,

  /* Force trailing-slash absent. /about not /about/. */
  trailingSlash: false,

  /* Image optimization defaults. */
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap'],
  },

  /* Redirects per Document 4 Section 6.2. */
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

  /* Security headers per Document 9 Section 12.4 (provisional).
     Refined when Doc 9 ships with the full CSP. */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
