/*
  Author bio at the bottom of each post. Two locked authors:
    the-furnish-edit  Editorial team voice (most posts)
    hassan-muhsen     Founder voice (only the founder-story post)

  Author keys map to i18n entries. No photos at v1 (stays text-only
  until Hassan supplies one).
*/

import * as React from 'react';
import { Container } from '@/components/Container';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

const AUTHORS: Record<string, { nameKey: string; bioKey: string }> = {
  'the-furnish-edit': {
    nameKey: 'authorTheFurnishEdit',
    bioKey: 'authorTheFurnishEditBio',
  },
  'hassan-muhsen': {
    nameKey: 'authorHassan',
    bioKey: 'authorHassanBio',
  },
};

export function BlogAuthorBio({ author }: { author: string }) {
  const meta = AUTHORS[author] ?? AUTHORS['the-furnish-edit'];
  return (
    <Container width="narrow" className="my-section-y-tight">
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5',
          'rounded-[var(--radius)] border border-[rgba(43,30,24,0.08)]',
          'bg-surface px-5 py-5 sm:px-6 sm:py-6',
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center',
            'rounded-full bg-[var(--color-accent)]/15',
            'font-display text-deep',
          )}
        >
          {t('blog', meta.nameKey).charAt(0)}
        </div>
        <div>
          <p className="font-display text-display-m text-deep tracking-display-tight">
            {t('blog', meta.nameKey)}
          </p>
          <p className="mt-1 text-body-m text-ink/80">
            {t('blog', meta.bioKey)}
          </p>
        </div>
      </div>
    </Container>
  );
}
