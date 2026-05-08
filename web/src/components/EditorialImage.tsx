import * as React from 'react';
import Image, { type ImageProps } from 'next/image';
import { Card, CardCaption } from '@/components/Card';
import { cn } from '@/lib/utils';

/*
  Treatment B from Document 2 Section 3.3: editorial card.
  Image inside a rounded card with optional caption below. Most
  images on the site use this treatment.

  Captions follow the "Designed in 30 seconds" micro-copy pattern
  from Document 2 Appendix A (Burrow lesson). Caption metadata
  carries style name, room type, and brief description.

  Aspect ratio defaults to 4:3 (standard interior photography
  framing). 3:2 is also valid. Pass aspectClassName to override.
*/

export interface EditorialImageProps extends Omit<ImageProps, 'className'> {
  caption?: {
    eyebrow?: string;
    title?: string;
    meta?: string;
  };
  className?: string;
  aspectClassName?: string;
  interactive?: boolean;
}

export function EditorialImage({
  caption,
  className,
  aspectClassName = 'aspect-[4/3]',
  interactive = true,
  alt,
  ...imgProps
}: EditorialImageProps) {
  return (
    <Card
      variant="image"
      interactive={interactive}
      className={cn('flex flex-col', className)}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-sm',
          aspectClassName,
        )}
      >
        <Image
          alt={alt}
          fill={imgProps.fill ?? true}
          sizes={imgProps.sizes ?? '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
          placeholder={imgProps.placeholder ?? 'blur'}
          className="object-cover"
          {...imgProps}
        />
      </div>
      {caption && (
        <CardCaption
          eyebrow={caption.eyebrow}
          title={caption.title}
          meta={caption.meta}
        />
      )}
    </Card>
  );
}
