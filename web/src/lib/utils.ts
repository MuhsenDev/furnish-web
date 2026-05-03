import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/*
  cn() composes class names with conditional logic and resolves
  Tailwind utility conflicts (later utility wins). Used by every
  component in src/components.
*/
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
