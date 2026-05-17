'use client';

/*
  Close button (the X) for the MegaNav overlay. Positioned inside
  the overlay, top-right, below the topbar. Auto-focused on open
  per the WAI-ARIA dialog pattern + spec §4.5.

  Kept in its own file rather than inlined so the close button
  can be referenced by the overlay's focus-trap implementation
  (the topbar's tab order routes here on Tab from the last
  interactive element in the overlay).
*/

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface MegaNavCloseButtonProps {
  onClick: () => void;
  /** Optional ref so the orchestrator can focus this button on open. */
  buttonRef?: React.Ref<HTMLButtonElement>;
}

export function MegaNavCloseButton({ onClick, buttonRef }: MegaNavCloseButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={t('nav', 'menuClose')}
      className={cn(
        'absolute right-4 top-4 sm:right-6 sm:top-6',
        'inline-flex h-11 w-11 items-center justify-center',
        'rounded-full text-deep',
        'bg-surface border border-[var(--color-sage-hairline)]',
        'shadow-1',
        'transition-[transform,box-shadow] duration-200 ease-premium',
        'hover:-translate-y-px hover:shadow-2',
        'active:translate-y-0 active:shadow-1',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-cream',
      )}
    >
      <X size={20} strokeWidth={1.5} />
    </button>
  );
}
