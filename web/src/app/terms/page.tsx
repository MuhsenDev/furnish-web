import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shared/PagePlaceholder';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms governing your use of Furnish. Acceptable use, account termination, disclaimers, and governing law.',
  alternates: { canonical: 'https://furnish.live/terms' },
  openGraph: {
    title: 'Terms of Service | Furnish',
    description: 'The terms governing your use of Furnish.',
    url: 'https://furnish.live/terms',
  },
};

export default function TermsPage() {
  return (
    <PagePlaceholder
      eyebrow="Legal"
      title="Terms of Service."
      description="Acceptable use, account termination, disclaimers, governing law. Generated alongside the Privacy Policy and reviewed before launch."
      arrivesIn="Document 8 (Static Pages Spec)"
    />
  );
}
