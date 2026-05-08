/*
  Privacy page per Document 8 §4.
  Renders the LegalPage template with content from
  src/content/legal/privacy.md. Hassan replaces the placeholder
  body with the Termly or iubenda generated text.
*/

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalPage, loadLegalDocument } from '@/components/static/LegalPage';

export const metadata: Metadata = {
  /* Absolute title, overrides the layout's "%s | Furnish"
     template so the literal title matches the spec exactly. */
  title: { absolute: 'Privacy Policy, Furnish' },
  description: 'How Furnish collects, uses, and protects your data.',
  alternates: { canonical: 'https://furnish.live/privacy' },
  openGraph: {
    title: 'Privacy Policy, Furnish',
    description: 'How Furnish collects, uses, and protects your data.',
    url: 'https://furnish.live/privacy',
  },
  /* App Store reviewers and search engines need access. */
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const doc = loadLegalDocument('privacy');
  if (!doc) notFound();
  return <LegalPage document={doc} />;
}
