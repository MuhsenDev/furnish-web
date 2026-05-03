import * as React from 'react';
import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

/*
  Treatment A from Document 2 Section 3.3: full-bleed cinematic.
  Image fills the viewport edge-to-edge. No padding, no border,
  no card. Text overlay uses the gradient overlay rule from Section
  1.3.4 (NOT text-shadow).

  Used for: hero, major section transitions, "See It Yourself"
  reveals. Maximum 3 per page.

  Aspect ratio is configurable but defaults to 16:9 to keep desktop
  rhythm without forcing portrait crops. Set fill={false} and
  provide width/height for non-fill cases.
*/

export interface FullBleedImageProps extends Omit<ImageProps, 'className'> {
  /**
   * Optional dark gradient overlay for text-on-imagery. Applies the
   * .img-overlay-dark utility from globals.css.
   */
  overlay?: boolean;
  /**
   * Optional caption rendered as an absolutely positioned text block.
   * Use for hero treatments only. Pass JSX so the caller controls
   * positioning, type scale, and color.
   */
  children?: React.ReactNode;
  className?: string;
  /**
   * Tailwind aspect ratio class. Defaults to aspect-video (16:9).
   */
  aspectClassName?: string;
}

export function FullBleedImage({
  overlay = false,
  children,
  className,
  aspectClassName = 'aspect-video',
  alt,
  ...imgProps
}: FullBleedImageProps) {
  return (
    <figure
      className={cn(
        'relative w-full overflow-hidden',
        aspectClassName,
        overlay && 'img-overlay-dark',
        className,
      )}
    >
      <Image
        alt={alt}
        fill={imgProps.fill ?? true}
        sizes={imgProps.sizes ?? '100vw'}
        placeholder={imgProps.placeholder ?? 'blur'}
        className="object-cover"
        {...imgProps}
      />
      {children}
    </figure>
  );
}
