import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shared/PagePlaceholder';

export const metadata: Metadata = {
  title: 'About',
  description:
    'The story behind Furnish. Why interior design should be accessible, and how AI closes the gap between aspiration and a real, shoppable room.',
  alternates: { canonical: 'https://furnish.live/about' },
  openGraph: {
    title: 'About | Furnish',
    description: 'The story behind Furnish.',
    url: 'https://furnish.live/about',
  },
};

export default function AboutPage() {
  return (
    <PagePlaceholder
      eyebrow="About"
      title="Why Furnish exists."
      description="Aspiration is achievable. Furnish closes the gap between the room you have and the room you have been imagining."
      arrivesIn="Document 8 (Static Pages Spec)"
    />
  );
}
