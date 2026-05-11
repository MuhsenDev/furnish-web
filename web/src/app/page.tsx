/*
  Home page composition.

  Final composition: 7 sections plus footer.

    1. Hero (Furnish hand wave + Furnish wordmark + walking legs)
    2. HomeCompareSlider (before/after slider)
    3. RoomShowcaseSection (3 SVG isometric rooms with idle
       levitation + jump+spin cycle, infinite loop)
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
import dynamic from 'next/dynamic';
import { Hero } from '@/components/home/Hero';
import { GalleryPreview } from '@/components/home/GalleryPreview';
import { HomeCompareSlider } from '@/components/home/HomeCompareSlider';
import { ComparisonTable } from '@/components/home/ComparisonTable';
import { FounderNote } from '@/components/home/FounderNote';
import { FinalCTA } from '@/components/home/FinalCTA';
import { isSupabaseConfigured, supabaseCount } from '@/lib/supabase';
import { t } from '@/lib/i18n';

/* RoomShowcaseSection pulls in framer-motion (~30 KB gz) which we
   don't want on the critical path. Section is below-the-fold; lazy
   load it. ssr: false keeps the framer-motion bundle out of the
   server-rendered HTML too. The placeholder uses the same cream
   bg as the actual section so there's no color flash when the
   client chunk loads. */
const RoomShowcaseSection = dynamic(
  () =>
    import('@/components/home/RoomShowcaseSection').then(
      (m) => m.RoomShowcaseSection,
    ),
  {
    ssr: false,
    loading: () => (
      <section
        aria-hidden="true"
        className="bg-cream py-section-y min-h-[60vh]"
      />
    ),
  },
);

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

/* Server-side aggregate signup counter. Read at request time so the
   number is always fresh (supabaseCount uses cache: 'no-store').
   Returns undefined when Supabase isn't configured, the count query
   fails, or the count is zero, so the Hero omits the line rather
   than rendering "Join 0 people on the waitlist". */
async function fetchHeroCounterText(): Promise<string | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  const result = await supabaseCount('waitlist');
  if (!result.ok || result.count == null || result.count <= 0) {
    return undefined;
  }
  return t('waitlist', 'publicCounter').replace(
    '{n}',
    result.count.toLocaleString('en-US'),
  );
}

export default async function HomePage() {
  const counterText = await fetchHeroCounterText();
  return (
    <>
      <HomeStructuredData />
      <Hero counterText={counterText} />
      <HomeCompareSlider />
      <RoomShowcaseSection />
      <GalleryPreview />
      <ComparisonTable />
      <FounderNote />
      <FinalCTA />
    </>
  );
}
