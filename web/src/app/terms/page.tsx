/*
  Terms page per Document 8 §5.
  Same pattern as /privacy: LegalPage template renders the markdown
  at src/content/legal/terms.md. Hassan pastes the Termly or
  iubenda generated body.
*/

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalPage, loadLegalDocument } from '@/components/static/LegalPage';

export const metadata: Metadata = {
  title: { absolute: 'Terms of Service, Furnish' },
  description:
    'Terms governing your use of furnish.live and the Furnish app.',
  alternates: { canonical: 'https://furnish.live/terms' },
  openGraph: {
    title: 'Terms of Service, Furnish',
    description:
      'Terms governing your use of furnish.live and the Furnish app.',
    url: 'https://furnish.live/terms',
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  const doc = loadLegalDocument('terms');
  if (!doc) notFound();
  return <LegalPage document={doc} />;
}
