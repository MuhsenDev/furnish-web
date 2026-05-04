import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
  Extend tailwind-merge so it recognizes our custom font-size
  utilities defined in tailwind.config.ts. Without this, twMerge
  treats `text-display-m`, `text-body-l`, etc. as text-color
  utilities (because they start with `text-`) and silently drops
  the actual color when both classes are present
  (e.g. `text-deep text-display-l`).

  Adding them to the 'font-size' group teaches twMerge that they
  are sizes, so they only conflict with each other (not with
  colors). This was the root cause of disappearing colors on
  multiple display headlines.
*/
const twMerge = extendTailwindMerge({
  override: {
    classGroups: {
      'font-size': [
        { text: ['display-xl', 'display-l', 'display-m'] },
        { text: ['body-xl', 'body-l', 'body-m', 'body-s'] },
      ],
    },
  },
});

/*
  cn() composes class names with conditional logic and resolves
  Tailwind utility conflicts (later utility wins). Used by every
  component in src/components.
*/
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
