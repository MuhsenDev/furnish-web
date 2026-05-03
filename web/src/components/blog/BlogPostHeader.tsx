/*
  Post header: meta line above the hero. Date, reading time,
  category. Renders inside the post template, just under the nav.
*/

import * as React from 'react';
import { Container } from '@/components/Container';
import { cn } from '@/lib/utils';
import { t, type Namespace } from '@/lib/i18n';
import { formatDate } from '@/lib/i18n';
import type { BlogCategory } from '@/lib/blog';

const CATEGORY_KEYS: Record<BlogCategory, string> = {
  'style-guide': 'categoryStyleGuide',
  'product-roundup': 'categoryProductRoundup',
  'room-specific': 'categoryRoomSpecific',
  comparison: 'categoryComparison',
  trend: 'categoryTrend',
  'founder-story': 'categoryFounderStory',
};

export interface BlogPostHeaderProps {
  date: string;
  updatedAt?: string;
  readingTimeMinutes: number;
  category: BlogCategory;
}

export function BlogPostHeader({
  date,
  updatedAt,
  readingTimeMinutes,
  category,
}: BlogPostHeaderProps) {
  const categoryKey = CATEGORY_KEYS[category];
  const categoryLabel = t('blog' as Namespace, categoryKey);
  const showUpdated = updatedAt && updatedAt !== date;

  return (
    <Container width="narrow" className="pt-section-y-tight">
      <div
        className={cn(
          'flex flex-wrap items-center gap-3 text-body-s text-muted',
        )}
      >
        <span
          className={cn(
            'rounded-full bg-[var(--color-accent)]/10 px-3 py-1',
            'text-[var(--color-accent)] font-semibold',
          )}
        >
          {categoryLabel}
        </span>
        <span aria-hidden="true">·</span>
        <time dateTime={date}>{formatDate(date)}</time>
        <span aria-hidden="true">·</span>
        <span>
          {readingTimeMinutes} {t('blog', 'readingTimeSuffix')}
        </span>
        {showUpdated && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {t('blog', 'lastUpdatedOn')} <time dateTime={updatedAt}>{formatDate(updatedAt!)}</time>
            </span>
          </>
        )}
      </div>
    </Container>
  );
}
