/*
  FTC affiliate disclosure block per Document 7 §5.4 and Document
  10 §4.3.

  LOCKED COPY. Do not modify. Renders at the very top of every
  blog post, before the body content. Visually distinct (subtle
  accent-tint background) but not loud.
*/

import * as React from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export function BlogDisclosure({
  className,
}: {
  className?: string;
}) {
  return (
    <aside
      role="note"
      aria-label="Affiliate disclosure"
      className={cn(
        'rounded-[var(--radius-sm)] border border-[var(--color-accent)]/15',
        'bg-[var(--color-accent)]/5',
        'px-4 py-3',
        'flex items-start gap-3',
        className,
      )}
    >
      <Info
        size={18}
        strokeWidth={1.75}
        className="mt-0.5 shrink-0 text-[var(--color-accent)]"
        aria-hidden="true"
      />
      <p className="text-body-s leading-relaxed text-ink/80">
        {t('blog', 'ftcDisclosure')}{' '}
        <Link
          href={t('blog', 'ftcLearnMoreHref')}
          className="font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
        >
          {t('blog', 'ftcLearnMore')}
        </Link>
      </p>
    </aside>
  );
}
