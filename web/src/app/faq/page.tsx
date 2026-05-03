import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shared/PagePlaceholder';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Common questions about Furnish. How the AI works, what photos work best, how shopping the room works, privacy, and pricing.',
  alternates: { canonical: 'https://furnish.live/faq' },
  openGraph: {
    title: 'FAQ | Furnish',
    description: 'Common questions about Furnish.',
    url: 'https://furnish.live/faq',
  },
};

export default function FaqPage() {
  return (
    <PagePlaceholder
      eyebrow="FAQ"
      title="Common questions, answered."
      description="How the AI works, what photos work best, how shopping the room works, privacy, and pricing."
      arrivesIn="Document 8 (Static Pages Spec)"
    />
  );
}
