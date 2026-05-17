/*
  Gallery page composition per Document 6.

  Server component that renders the metadata + structured data,
  then hands rendering to the client wrapper which owns the
  filter state, lightbox state, and URL-fragment sync.
*/

import type { Metadata } from 'next';
import { GalleryClient } from './GalleryClient';
import { galleryImages } from '@/data/gallery';

export const metadata: Metadata = {
  title: 'Sample Gallery. Real rooms designed by Furnish AI.',
  description:
    'Browse 36+ rooms designed by Furnish. Living rooms, bedrooms, kitchens, home offices, and more. Every style. Every room. Designed in seconds, shoppable instantly.',
  alternates: { canonical: 'https://furnish.live/gallery' },
  openGraph: {
    title: 'Sample Gallery | Furnish',
    description: 'Browse 36+ rooms designed by Furnish.',
    url: 'https://furnish.live/gallery',
    images: [
      {
        url: '/images/og/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Furnish gallery, rooms designed by AI',
      },
    ],
  },
};

/* JSON-LD ImageGallery schema per Document 6 §0.3. Each image
   listed as an associated ImageObject. */
function GalleryStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'Furnish Sample Gallery',
    url: 'https://furnish.live/gallery',
    description:
      'Real rooms designed by Furnish AI. 9 room types across multiple styles.',
    associatedMedia: galleryImages.map((img) => ({
      '@type': 'ImageObject',
      contentUrl: `https://furnish.live${img.filename}`,
      name: img.description,
      caption: img.altText,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function GalleryPage() {
  return (
    <>
      <GalleryStructuredData />
      <GalleryClient />
    </>
  );
}
