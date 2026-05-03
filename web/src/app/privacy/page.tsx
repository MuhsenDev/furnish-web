import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shared/PagePlaceholder';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Furnish collects, uses, and protects your data. Photo storage, AI processing, analytics, and your rights.',
  alternates: { canonical: 'https://furnish.live/privacy' },
  openGraph: {
    title: 'Privacy Policy | Furnish',
    description: 'How Furnish collects, uses, and protects your data.',
    url: 'https://furnish.live/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <PagePlaceholder
      eyebrow="Legal"
      title="Privacy Policy."
      description="How Furnish collects, uses, and protects your data. Generated alongside the Terms of Service and reviewed before launch."
      arrivesIn="Document 8 (Static Pages Spec)"
    />
  );
}
