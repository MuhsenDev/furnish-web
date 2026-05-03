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
  title: 'Terms of Service',
  description:
    'The terms governing your use of Furnish. Acceptable use, account termination, disclaimers, and governing law.',
  alternates: { canonical: 'https://furnish.live/terms' },
  openGraph: {
    title: 'Terms of Service | Furnish',
    description: 'The terms governing your use of Furnish.',
    url: 'https://furnish.live/terms',
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  const doc = loadLegalDocument('terms');
  if (!doc) notFound();
  return <LegalPage document={doc} />;
}
