import * as React from 'react';
import { cn } from '@/lib/utils';

/*
  SectionDivider is the brand marker, Document 2 Section 8.1.
  A single-pixel horizontal line in the peach accent, used 1-2
  times per page maximum as a subtle transition between major
  sections. NEVER used as a button underline or any tactical role.

  Width defaults to 56px (the marker variant). Set width="full"
  for the rare full-width divider used at the very top or bottom
  of an editorial section.

  Color: switched from bronze (--color-accent) to peach
  (--color-accent-peach) in the 2026-05 brand expansion where
  peach became a third primary color. Bronze stays on actionable
  surfaces (CTAs, focus rings, links). The divider is a
  non-actionable brand marker so peach reads cleanly here.
*/

type DividerWidth = 'marker' | 'full';
type DividerAlign = 'left' | 'center' | 'right';

export interface SectionDividerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  width?: DividerWidth;
  align?: DividerAlign;
}

const widthClasses: Record<DividerWidth, string> = {
  marker: 'w-14',
  full: 'w-full',
};

const alignClasses: Record<DividerAlign, string> = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
};

export function SectionDivider({
  width = 'marker',
  align = 'left',
  className,
  ...rest
}: SectionDividerProps) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={cn(
        'h-px bg-[var(--color-accent-peach)]',
        widthClasses[width],
        alignClasses[align],
        className,
      )}
      {...rest}
    />
  );
}
