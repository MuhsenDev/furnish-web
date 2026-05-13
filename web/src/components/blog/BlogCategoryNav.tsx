'use client';

/*
  Blog category navigation pills.

  Per Hassan's spec (2026-05-08): pill-style category filter above
  the post grid. Active pill uses the brand accent color. URL state
  via ?category=<slug> so views are shareable.

  Spec category buckets:
    All
    Style Guides       maps from frontmatter "style-guide" + "room-specific"
    Buying Guides      maps from frontmatter "product-roundup" + "comparison"
    Style Stories      maps from frontmatter "founder-story"
    Trends             maps from frontmatter "trend"

  The frontmatter category vocabulary stays unchanged (keeps existing
  schema valid + decouples bucket grouping from the underlying
  taxonomy). Mapping lives in this file so future bucket changes
  don't require touching every MDX file.

  Behavior:
    - Click a pill, URL updates with router.replace (no scroll).
    - Filter applied client-side; the post grid is also a client
      component so it re-renders on the active filter.
    - Mobile: pills stay horizontal but become scroll-snap if they
      overflow.
    - Reduced motion: layout animation skipped (the parent grid is
      what does the layout reflow; this nav is just style transitions
      which are short enough to respect even with the global
      reduced-motion CSS reset).
*/

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BlogCategory } from '@/lib/blog';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export type CategoryBucketSlug =
  | 'all'
  | 'style-guides'
  | 'buying-guides'
  | 'style-stories'
  | 'trends';

interface BucketDef {
  slug: CategoryBucketSlug;
  /** Frontmatter `category` values that fall into this bucket. */
  match: BlogCategory[] | 'all';
}

export const CATEGORY_BUCKETS: BucketDef[] = [
  { slug: 'all', match: 'all' },
  { slug: 'style-guides', match: ['style-guide', 'room-specific'] },
  { slug: 'buying-guides', match: ['product-roundup', 'comparison'] },
  { slug: 'style-stories', match: ['founder-story'] },
  { slug: 'trends', match: ['trend'] },
];

/** Maps bucket slug to flat i18n key in the blog namespace. The
    i18n loader does flat lookups, so dot-notation keys would not
    resolve. */
function categoryBucketI18nKey(slug: CategoryBucketSlug): string {
  switch (slug) {
    case 'all':
      return 'categoryBucketAll';
    case 'style-guides':
      return 'categoryBucketStyleGuides';
    case 'buying-guides':
      return 'categoryBucketBuyingGuides';
    case 'style-stories':
      return 'categoryBucketStyleStories';
    case 'trends':
      return 'categoryBucketTrends';
  }
}

/** Shared filter helper so BlogIndex and tests / consumers can reuse. */
export function postMatchesBucket(
  postCategory: BlogCategory,
  bucket: CategoryBucketSlug,
): boolean {
  const def = CATEGORY_BUCKETS.find((b) => b.slug === bucket);
  if (!def || def.match === 'all') return true;
  return def.match.includes(postCategory);
}

export interface BlogCategoryNavProps {
  /** The currently active bucket. */
  active: CategoryBucketSlug;
  /** Counts per bucket for badge display. */
  counts: Record<CategoryBucketSlug, number>;
}

export function BlogCategoryNav({ active, counts }: BlogCategoryNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setActive = (slug: CategoryBucketSlug) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    const qs = params.toString();
    router.replace(qs ? `/blog?${qs}` : '/blog', { scroll: false });
  };

  return (
    <nav
      aria-label={t('blog', 'categoryNavAriaLabel')}
      className={cn(
        'flex gap-2 overflow-x-auto pb-1',
        'snap-x snap-mandatory',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      )}
    >
      {CATEGORY_BUCKETS.map((bucket) => {
        const isActive = bucket.slug === active;
        const count = counts[bucket.slug];
        return (
          <button
            key={bucket.slug}
            type="button"
            onClick={() => setActive(bucket.slug)}
            aria-pressed={isActive}
            className={cn(
              'shrink-0 inline-flex items-center justify-center gap-2 snap-start',
              'rounded-sm border px-4 py-2',
              'text-body-s font-semibold',
              'transition-colors duration-200 ease-premium',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
              isActive
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-cream'
                : cn(
                    'border-[rgba(43,30,24,0.20)] bg-surface text-ink',
                    'hover:border-[var(--color-accent)]',
                    'hover:bg-[var(--color-accent)]/[0.06]',
                    'hover:text-deep',
                  ),
            )}
          >
            <span>{t('blog', categoryBucketI18nKey(bucket.slug))}</span>
            {count > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center',
                  'rounded-full px-1.5 min-w-[1.25rem] h-5',
                  'text-body-s font-semibold tabular-nums',
                  isActive
                    ? 'bg-cream/25 text-cream'
                    : 'bg-[rgba(43,30,24,0.08)] text-ink/70',
                )}
                aria-label={`${count} ${count === 1 ? 'post' : 'posts'}`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
