import * as React from 'react';
import { cn } from '@/lib/utils';

/*
  SectionDivider is the brand marker, Document 2 Section 8.1.
  A single-pixel horizontal line in the accent color, used 1-2
  times per page maximum as a subtle transition between major
  sections. NEVER used as a button underline or any tactical role.

  Width defaults to 56px (the marker variant). Set width="full"
  for the rare full-width divider used at the very top or bottom
  of an editorial section.
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
        'h-px bg-[var(--color-accent)]',
        widthClasses[width],
        alignClasses[align],
        className,
      )}
      {...rest}
    />
  );
}
