/*
  Branded 404 page per Document 4 Section 4.9 plus Section 4I.
  The only fully-built page in Phase 4. Other pages are placeholders.

  Voice: brand-correct dead-end. "Looks like this room is empty."
  Two CTAs: Go home (primary) and Browse the gallery (secondary).
  noindex / nofollow so search engines do not catalog it.
*/

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { SectionDivider } from '@/components/SectionDivider';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('not-found', 'metaTitle'),
  description: t('not-found', 'metaDescription'),
  robots: { index: false, follow: false },
};

const primaryLinkClasses = cn(
  'inline-flex items-center justify-center gap-2',
  'rounded-sm px-7 py-3.5 text-body-m font-semibold',
  'bg-[var(--color-accent)] text-cream',
  'shadow-1 transition-[transform,box-shadow]',
  'btn-primary-hover',
);

const secondaryLinkClasses = cn(
  'inline-flex items-center justify-center gap-2',
  'rounded-sm px-7 py-3.5 text-body-m font-semibold',
  'border border-[rgba(43,30,24,0.12)] bg-transparent text-ink',
  'btn-secondary-hover',
);

export default function NotFound() {
  return (
    <Container
      width="default"
      className="flex min-h-[70vh] flex-col items-center justify-center text-center"
    >
      <div className="max-w-lg">
        <p className="eyebrow mb-4">{t('not-found', 'eyebrow')}</p>
        <h1 className="font-display text-display-l tracking-display-tight leading-display-tight text-deep">
          {t('not-found', 'headline')}
        </h1>
        <p className="mt-6 text-body-xl text-ink">{t('not-found', 'body')}</p>
        <SectionDivider align="center" className="mt-section-y-tight" />
        <div className="mt-section-y-tight flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/" className={primaryLinkClasses}>
            {t('common', 'ctaGoHome')}
          </Link>
          <Link href="/gallery" className={secondaryLinkClasses}>
            {t('common', 'ctaBrowseGallery')}
          </Link>
        </div>
      </div>
    </Container>
  );
}
