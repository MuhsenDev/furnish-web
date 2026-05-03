import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shared/PagePlaceholder';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'The Furnish Edit. Design ideas, room inspiration, and shopping guides for real homes at real budgets.',
  alternates: { canonical: 'https://furnish.live/blog' },
  openGraph: {
    title: 'Blog | Furnish',
    description: 'The Furnish Edit. Design ideas and shopping guides.',
    url: 'https://furnish.live/blog',
  },
};

export default function BlogIndexPage() {
  return (
    <PagePlaceholder
      eyebrow="Blog"
      title="The Furnish Edit."
      description="Design ideas, room inspiration, and shopping guides. Five posts go live at launch and grow from there."
      arrivesIn="Document 7 (Blog Content Plan)"
    />
  );
}
