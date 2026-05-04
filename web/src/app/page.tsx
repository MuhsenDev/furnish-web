/*
  Home page composition per Document 5, with the dedicated 3D
  PortraitSection inserted between Hero and ValueProp per Hassan's
  call. Nine sections plus footer, top to bottom:

    1. Hero (room photo right column)
    2. PortraitSection (dedicated, deep-espresso background)
    3. ValueProp
    4. GalleryPreview
    5. HomeCompareSlider
    6. HowItWorks
    7. ComparisonTable
    8. FounderNote
    9. FinalCTA

  Footer comes from the root layout.

  Pre-launch / post-launch differentiation lives inside each component
  via the APP_LAUNCHED flag from @/lib/flags. The page composition
  itself is identical across both states.
*/

import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { PortraitSection } from '@/components/home/PortraitSection';
import { ValueProp } from '@/components/home/ValueProp';
import { GalleryPreview } from '@/components/home/GalleryPreview';
import { HomeCompareSlider } from '@/components/home/HomeCompareSlider';
import { HowItWorks } from '@/components/home/HowItWorks';
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
      <PortraitSection />
      <ValueProp />
      <GalleryPreview />
      <HomeCompareSlider />
      <HowItWorks />
      <ComparisonTable />
      <FounderNote />
      <FinalCTA />
    </>
  );
}
