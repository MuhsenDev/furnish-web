/*
  Home page composition.

  Hassan trimmed the layout in this iteration:
  - Removed ValueProp (was the "How it works" 3-numbered-column block).
  - Removed HowItWorks (the standalone /how-it-works section was
    duplicating ValueProp's content; the dedicated /how-it-works
    page still exists for users who want the full walkthrough).
  - Removed BeYouStrip (the Be You Lottie banner).
  - Moved ComparisonTable up to take HowItWorks's old slot, so
    "Designed for you. Not for designers." surfaces higher in the
    flow.

  Final composition: 7 sections plus footer.

    1. Hero (text-forward, no photo)
    2. ApartmentScrollSection (3D apartment, scroll-driven drops)
    3. GalleryPreview (mobile shows 3 tiles, desktop shows 9)
    4. HomeCompareSlider
    5. ComparisonTable ("Designed for you. Not for designers.")
    6. FounderNote
    7. FinalCTA

  Pre-launch / post-launch differentiation lives inside each
  component via the APP_LAUNCHED flag from @/lib/flags. The page
  composition itself is identical across both states.
*/

import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { ApartmentScrollSection } from '@/components/home/ApartmentScrollSection';
import { GalleryPreview } from '@/components/home/GalleryPreview';
import { HomeCompareSlider } from '@/components/home/HomeCompareSlider';
import { ComparisonTable } from '@/components/home/ComparisonTable';
import { FounderNote } from '@/components/home/FounderNote';
import { FinalCTA } from '@/components/home/FinalCTA';

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
        width: 1200,
        height: 630,
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

export default function HomePage() {
  return (
    <>
      <HomeStructuredData />
      <Hero />
      <ApartmentScrollSection />
      <GalleryPreview />
      <HomeCompareSlider />
      <ComparisonTable />
      <FounderNote />
      <FinalCTA />
    </>
  );
}
