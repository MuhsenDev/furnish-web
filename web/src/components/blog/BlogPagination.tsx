/*
  Pagination component. Not used at v1 (6 posts, all fit on one
  page) but built for future-proofing per the deliverables list.
  Activated when post count exceeds the per-page cap.
*/

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface BlogPaginationProps {
  /** 1-indexed current page number. */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** URL pattern, e.g. "/blog?page=" with the number appended. */
  hrefPattern: string;
}

export function BlogPagination({
  currentPage,
  totalPages,
  hrefPattern,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const prevHref =
    currentPage > 1 ? `${hrefPattern}${currentPage - 1}` : null;
  const nextHref =
    currentPage < totalPages ? `${hrefPattern}${currentPage + 1}` : null;

  const linkClasses = cn(
    'inline-flex items-center gap-2 rounded-full',
    'border border-[rgba(43,30,24,0.16)] bg-surface',
    'px-4 py-2 text-body-s font-semibold text-ink',
    'hover:border-[rgba(43,30,24,0.32)]',
    'aria-disabled:opacity-40 aria-disabled:pointer-events-none',
  );

  return (
    <nav
      aria-label="Blog pagination"
      className="flex items-center justify-center gap-3 py-section-y-tight"
    >
      {prevHref ? (
        <Link href={prevHref} className={linkClasses}>
          <ChevronLeft size={16} strokeWidth={1.75} />
          {t('blog', 'paginationPrev')}
        </Link>
      ) : (
        <span aria-disabled="true" className={linkClasses}>
          <ChevronLeft size={16} strokeWidth={1.75} />
          {t('blog', 'paginationPrev')}
        </span>
      )}

      <span className="text-body-s text-muted">
        {currentPage} / {totalPages}
      </span>

      {nextHref ? (
        <Link href={nextHref} className={linkClasses}>
          {t('blog', 'paginationNext')}
          <ChevronRight size={16} strokeWidth={1.75} />
        </Link>
      ) : (
        <span aria-disabled="true" className={linkClasses}>
          {t('blog', 'paginationNext')}
          <ChevronRight size={16} strokeWidth={1.75} />
        </span>
      )}
    </nav>
  );
}
