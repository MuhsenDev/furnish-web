/*
  About page per Document 8 §1.
  Hero, founder section, vision/mission, values, how-we-make-money
  (anchored as the FTC disclosure target), roadmap, contact, plus
  an in-page CTA via the BlogCTABox pattern reused per Doc 8 §1.11.
*/

import type { Metadata } from 'next';
import {
  AboutHero,
  FounderSection,
  VisionMissionSection,
  ValuesSection,
  HowWeMakeMoneySection,
  RoadmapSection,
  ContactSection,
} from '@/components/static/AboutSections';
import { BlogCTABox } from '@/components/blog/BlogCTABox';

export const metadata: Metadata = {
  title: 'About',
  description:
    'The story behind Furnish. Why interior design should be accessible, and how AI closes the gap between aspiration and a real, shoppable room.',
  alternates: { canonical: 'https://furnish.live/about' },
  openGraph: {
    title: 'About | Furnish',
    description:
      'The story behind Furnish, the values that hold us to it, and how we make money.',
    url: 'https://furnish.live/about',
  },
};

/* JSON-LD: Organization plus Person (founder) per Doc 8 build step 9. */
function AboutStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://furnish.live/#organization',
        name: 'Furnish',
        url: 'https://furnish.live/',
        founder: { '@id': 'https://furnish.live/about#hassan' },
      },
      {
        '@type': 'Person',
        '@id': 'https://furnish.live/about#hassan',
        name: 'Hassan Muhsen',
        jobTitle: 'Founder',
        worksFor: { '@id': 'https://furnish.live/#organization' },
        homeLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Garden City',
            addressRegion: 'MI',
            addressCountry: 'US',
          },
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

export default function AboutPage() {
  return (
    <>
      <AboutStructuredData />
      <AboutHero />
      <FounderSection />
      <VisionMissionSection />
      <ValuesSection />
      <HowWeMakeMoneySection />
      <RoadmapSection />
      <ContactSection />
      <BlogCTABox />
    </>
  );
}
