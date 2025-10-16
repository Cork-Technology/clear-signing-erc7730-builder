import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateLabel(name: string, maxLength: number = 30): string {
  if (name.length <= maxLength) {
    return name;
  }
  return name.slice(0, maxLength - 3) + '...';
}
