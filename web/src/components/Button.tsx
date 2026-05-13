import * as React from 'react';
import { cn } from '@/lib/utils';

/*
  Three button variants only, per Document 2 Section 6.1.

    primary    The one CTA per section. Background = accent. Text =
               cream. Subtle shadow at rest, lifted shadow on hover.
    secondary  Quieter CTA. Transparent background, low-opacity ink
               border. Background fills with ink at 6% on hover.
    tertiary   Inline link-style. Accent text, underline on hover.

  Hover translates Y by 1px on primary and secondary. Cards lift 4px,
  buttons lift 1px. The contrast preserves "buttons are firm, cards
  are soft" per Document 2 Section 6.

  Hover states are desktop-only delight. Mobile touch behavior keeps
  the active flash via a brief opacity bump.
*/

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-[var(--color-accent-peach)] text-deep',
    'shadow-1 hover:shadow-2',
    'hover:-translate-y-px active:translate-y-0',
    'transition-[transform,box-shadow,background-color]',
  ),
  secondary: cn(
    'bg-transparent text-ink',
    'border border-[rgba(43,30,24,0.12)]',
    'hover:bg-[rgba(43,30,24,0.06)]',
    'hover:-translate-y-px active:translate-y-0',
    'transition-[transform,background-color,border-color]',
  ),
  tertiary: cn(
    'bg-transparent text-[var(--color-accent)] p-0',
    'underline-offset-4 hover:underline',
    'transition-colors',
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-body-s',
  md: 'px-7 py-3.5 text-body-m',
  lg: 'px-8 py-4 text-body-l',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', className, children, ...rest },
    ref,
  ) {
    const isLink = variant === 'tertiary';
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-sans font-semibold',
          'duration-200 ease-premium',
          !isLink && 'rounded-sm',
          variantClasses[variant],
          !isLink && sizeClasses[size],
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
