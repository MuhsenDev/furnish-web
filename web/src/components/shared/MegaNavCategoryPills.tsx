'use client';

/*
  Category pills under the app grid. Chip-style buttons: sage-soft
  fill + sage-hairline border + shadow at rest, bronze fill +
  bronze border + cream text on hover. Earlier iteration was a
  transparent border-only pill with a scaleX hover-fill animation;
  it read as a tag rather than a button. The chip pattern here
  matches Linear/Vercel category-filter pill conventions.

  Each pill is a plain <Link>. Hrefs route to filtered surfaces
  on /gallery or /blog (e.g., /gallery#style=scandinavian).
*/

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import type { SectionId } from '@/data/nav-mega';

export interface MegaNavCategoryPillsProps {
  sectionId: SectionId;
  categories: Array<{ label: string; href: string }>;
  onActivate: () => void;
}

export function MegaNavCategoryPills({
  sectionId,
  categories,
  onActivate,
}: MegaNavCategoryPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <Link
          key={cat.label}
          href={cat.href}
          onClick={() => {
            track('mega_nav_category_click', {
              section: sectionId,
              category: cat.label,
            });
            onActivate();
          }}
          className={cn(
            'inline-flex items-center rounded-full',
            'border border-[var(--color-sage-hairline)]',
            'bg-[var(--color-sage-soft)] text-deep',
            'px-5 py-2 text-body-m font-semibold',
            'shadow-1',
            'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-premium',
            'hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)]',
            'hover:text-cream hover:shadow-2 hover:-translate-y-px',
            'active:translate-y-0 active:shadow-1',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
            'focus-visible:ring-offset-cream',
          )}
        >
          {cat.label}
        </Link>
      ))}
    </div>
  );
}
