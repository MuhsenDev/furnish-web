import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shared/PagePlaceholder';

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Browse rooms designed by Furnish. Six styles across four room types. Filter by style, vibe, or room type.',
  alternates: { canonical: 'https://furnish.live/gallery' },
  openGraph: {
    title: 'Gallery | Furnish',
    description: 'Browse rooms designed by Furnish.',
    url: 'https://furnish.live/gallery',
  },
};

export default function GalleryPage() {
  return (
    <PagePlaceholder
      eyebrow="Gallery"
      title="See what is possible."
      description="A curated set of AI-generated rooms across six styles and four room types. Filter, browse, and tap any card to see the before-and-after."
      arrivesIn="Document 6 (Sample Gallery Spec)"
    />
  );
}
