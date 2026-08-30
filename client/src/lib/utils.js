import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Standard shadcn/ui utility: clsx handles conditional classes, twMerge
// resolves conflicting Tailwind classes (e.g. a passed-in "p-4" correctly
// overriding a component's default "p-2") rather than both landing in the
// className string and Tailwind arbitrarily picking one via source order.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
