/*
  Phase 4 placeholder for the 7 page templates that build in
  Documents 5 through 8. Renders a minimal eyebrow plus headline
  plus brief copy plus a deferral note pointing to the document
  that fully builds the page.

  This component disappears once each page builds for real. It
  exists only so the routing scaffold ships without dead screens.
*/

import * as React from 'react';
import Link from 'next/link';
import { Container } from '@/components/Container';
import { SectionDivider } from '@/components/SectionDivider';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface PagePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Which document fully builds this page. Shown as a small note. */
  arrivesIn: string;
  /** Optional CTA back to home. Defaults to true. */
  showHomeCta?: boolean;
}

const homeLinkClasses = cn(
  'inline-flex items-center justify-center gap-2',
  'rounded-sm px-7 py-3.5 text-body-m font-semibold',
  'bg-[var(--color-accent-peach)] text-deep',
  'shadow-1 transition-[transform,box-shadow]',
  'btn-primary-hover',
);

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  arrivesIn,
  showHomeCta = true,
}: PagePlaceholderProps) {
  return (
    <Container
      width="default"
      className="flex min-h-[60vh] flex-col justify-center py-section-y"
    >
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h1 className="font-display text-display-l tracking-display-tight leading-display-tight text-deep max-w-3xl">
        {title}
      </h1>
      <p className="mt-6 max-w-narrow text-body-xl text-ink">{description}</p>
      <SectionDivider className="mt-section-y-tight" />
      <p className="mt-6 text-body-s text-muted">
        Full content arrives with {arrivesIn}.
      </p>
      {showHomeCta && (
        <div className="mt-section-y-tight">
          <Link href="/" className={homeLinkClasses}>
            {t('common', 'ctaGoHome')}
          </Link>
        </div>
      )}
    </Container>
  );
}
