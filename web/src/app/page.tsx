/*
  Home page composition.

  Final composition: 7 sections plus footer.

    1. Hero (Furnish hand wave + Furnish wordmark + walking legs)
    2. HomeCompareSlider (before/after slider)
    3. RoomShowcaseGate -> RoomShowcaseSection
       Mobile (<lg) only. The gate is a client-side matchMedia
       wrapper that returns null on desktop so the section's chunk
       never reaches the wire. Section itself renders 3 SVG
       isometric rooms with idle levitation + entry sequence.
    4. GalleryPreview (mobile shows 3 tiles, desktop shows 9)
    5. ComparisonTable ("Designed for you. Not for designers.")
    6. FounderNote
    7. FinalCTA

  The previous .glb apartment scroll-fill was retired in favor of
  the SVG room loop. Three.js dependencies were removed entirely
  since nothing else in the codebase used them.

  Pre-launch / post-launch differentiation lives inside each
  component via the APP_LAUNCHED flag from @/lib/flags. The page
  composition itself is identical across both states.
*/

import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { GalleryPreview } from '@/components/home/GalleryPreview';
import { HomeCompareSlider } from '@/components/home/HomeCompareSlider';
import { ComparisonTable } from '@/components/home/ComparisonTable';
import { FounderNote } from '@/components/home/FounderNote';
import { FinalCTA } from '@/components/home/FinalCTA';
import { RoomShowcaseGate } from '@/components/home/RoomShowcaseGate';

/* RoomShowcaseSection lives behind RoomShowcaseGate (Surface 3,
   2026-05-16). The gate is a client-side matchMedia wrapper that
   only renders the section on viewports < lg, AND owns the
   `next/dynamic` import so the section's chunk + framer-motion
   bundle + 3 SVG fetches never reach the wire on desktop. */

export const metadata: Metadata = {
  title: 'Furnish. Take a photo. Design your room. Shop it all.',
  description:
    'AI redesigns any room from a single photo and lets you shop every piece. Save 95%+ versus traditional interior designers. Built for renters, homeowners, and everyone tired of empty rooms.',
  alternates: { canonical: 'https://furnish.live/' },
  openGraph: {
    title: 'Furnish',
    description:
      'AI redesigns any room from a single photo and lets you shop every piece.',
    url: 'https://furnish.live/',
    images: [
      {
        url: '/images/og/og-default.jpg',
        width: 1050,
        height: 600,
        alt: 'Furnish, AI redesigns any room from a photo',
      },
    ],
  },
};

/* JSON-LD structured data per Document 4 §10.3. WebSite plus
   Organization schemas. Renders as a script tag inline. */
function HomeStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://furnish.live/#website',
        url: 'https://furnish.live/',
        name: 'Furnish',
        description:
          'AI redesigns any room from a single photo and lets you shop every piece in it.',
        publisher: { '@id': 'https://furnish.live/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://furnish.live/blog?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://furnish.live/#organization',
        name: 'Furnish',
        url: 'https://furnish.live/',
        logo: {
          '@type': 'ImageObject',
          url: 'https://furnish.live/images/og/og-default.jpg',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* The hero used to render a "Join {N} people on the waitlist" line
   below the CTAs, computed from the real Supabase row count. Hassan
   pulled it 2026-05-12 since exposing a low-but-honest count
   undersells the launch. Hero's counterText prop is optional; when
   it's undefined the Hero renders without that line (see the
   `{counterText && ...}` guard in Hero.tsx). To re-enable later,
   restore fetchHeroCounterText and pass its result back into Hero. */
export default async function HomePage() {
  return (
    <>
      <HomeStructuredData />
      <Hero />
      <HomeCompareSlider />
      <RoomShowcaseGate />
      <GalleryPreview />
      <ComparisonTable />
      <FounderNote />
      <FinalCTA />
    </>
  );
}
