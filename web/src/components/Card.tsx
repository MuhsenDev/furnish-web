import * as React from 'react';
import { cn } from '@/lib/utils';

/*
  Card variants per Document 2 Section 6.2.

    image     Hosts an image with optional caption. Tighter inset
              around the image. Border 8% ink, shadow-1 at rest,
              shadow-2 on hover. Lift 4px on hover (desktop).
    content   Hosts copy (testimonials, statistics). More generous
              internal padding. Same surface and border treatment.

  Both variants rest on the surface color (slightly elevated from
  page bg) and use border-radius from app tokens.
*/

type CardVariant = 'image' | 'content';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /**
   * When true, the card lifts on desktop hover. Disable for static
   * cards (e.g. testimonials with no interaction).
   */
  interactive?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  image: 'p-3 sm:p-4',
  content: 'p-6 sm:p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'image', interactive = true, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-[var(--radius)] bg-surface',
        'border border-[rgba(43,30,24,0.08)]',
        'shadow-1',
        'transition-[transform,box-shadow] duration-200 ease-premium',
        interactive && 'hover:shadow-2 hover:-translate-y-1',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

/*
  CardCaption is a helper for the editorial caption sitting beneath
  an image inside an image card. Holds metadata: style name, room
  type, brief description.
*/
export interface CardCaptionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title?: string;
  meta?: string;
}

export function CardCaption({
  eyebrow,
  title,
  meta,
  className,
  ...rest
}: CardCaptionProps) {
  return (
    <div className={cn('px-1 pt-3 pb-1', className)} {...rest}>
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      {title && (
        <p className="text-body-l font-semibold leading-tight text-deep">
          {title}
        </p>
      )}
      {meta && (
        /* Meta line was previously text-muted (#8A7760), which on a
           cream/beige card surface read as washed-out, Hassan
           flagged "Living Room / Contemporary / Designed in 30s" on
           the gallery as barely readable. text-ink at 70% opacity
           keeps the line subordinate to the title without sacrificing
           legibility. Affects gallery, blog index, related posts,
           home gallery preview consistently. */
        <p className="mt-1 text-body-s leading-caption text-ink/70">{meta}</p>
      )}
    </div>
  );
}
