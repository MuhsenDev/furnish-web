import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shared/PagePlaceholder';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'See how Furnish redesigns your room from a single photo, step by step. From your photo to your dream room in about a minute.',
  alternates: { canonical: 'https://furnish.live/how-it-works' },
  openGraph: {
    title: 'How It Works | Furnish',
    description:
      'See how Furnish redesigns your room from a single photo, step by step.',
    url: 'https://furnish.live/how-it-works',
  },
};

export default function HowItWorksPage() {
  return (
    <PagePlaceholder
      eyebrow="How It Works"
      title="From your photo to your dream room."
      description="A walkthrough of the photo, quiz, AI generation, review, and shop steps that turn an empty room into a designed one."
      arrivesIn="Document 8 (Static Pages Spec)"
    />
  );
}
