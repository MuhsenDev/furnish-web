import * as React from 'react';
import { cn } from '@/lib/utils';

/*
  Container component. Four widths per Document 2 Section 4.2.

    narrow   640px. Body copy in editorial sections.
    default  1200px. Most marketing sections.
    wide     1440px. Gallery grids.
    bleed    100% viewport. Full-bleed cinematic sections (no max-width).

  Horizontal padding is responsive: 16-24px gutters on mobile,
  scaling to 32-48px on desktop. Bleed has zero horizontal padding
  so images can touch the viewport edge.
*/

type ContainerWidth = 'narrow' | 'default' | 'wide' | 'bleed';

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  width?: ContainerWidth;
  as?: keyof JSX.IntrinsicElements;
}

const widthClasses: Record<ContainerWidth, string> = {
  narrow: 'max-w-narrow px-5 sm:px-6 lg:px-8',
  default: 'max-w-default px-5 sm:px-6 lg:px-8',
  wide: 'max-w-wide px-5 sm:px-6 lg:px-8',
  bleed: 'w-full px-0',
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  function Container(
    { width = 'default', as: Component = 'div', className, children, ...rest },
    ref,
  ) {
    const Tag = Component as React.ElementType;
    return (
      <Tag
        ref={ref}
        className={cn('mx-auto w-full', widthClasses[width], className)}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
);
