'use client';

/*
  Category pills under the app grid per spec §3.4 + §4.4.

  Per spec §4.4: hover state fills background left-to-right with
  the accent color. Furnish uses sage-soft (the Surface 2 active-
  state tint) as the resting state and shifts to sage-hairline
  (slightly stronger) on hover, with a left-to-right transition
  via a positioned pseudo-element.

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
            'group relative overflow-hidden',
            'inline-flex items-center rounded-full',
            'border border-[var(--color-sage-hairline)]',
            'bg-transparent text-deep',
            'px-4 py-1.5 text-body-s font-medium',
            'transition-[color,border-color] duration-300 ease-premium',
            'hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
            'focus-visible:ring-offset-cream',
          )}
        >
          {/* Left-to-right fill effect on hover. A positioned
              pseudo-element grows from scaleX(0) to scaleX(1) with
              transform-origin left. The Link's text sits on top
              (z-10 via relative). */}
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-0 origin-left',
              'bg-[var(--color-sage-soft)]',
              'transition-transform duration-300 ease-premium',
              'scale-x-0 group-hover:scale-x-100',
            )}
          />
          <span className="relative z-10">{cat.label}</span>
        </Link>
      ))}
    </div>
  );
}
