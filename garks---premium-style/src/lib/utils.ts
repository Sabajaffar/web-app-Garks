import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function haptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [40],
      success: [10, 50, 10],
      warning: [50, 10, 50],
      error: [100, 50, 100],
    };
    window.navigator.vibrate(patterns[style]);
  }
}
