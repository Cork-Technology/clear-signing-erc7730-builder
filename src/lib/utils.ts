import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateLabel(name: string, maxLength = 30): string {
  if (name.length <= maxLength) {
    return name;
  }
  return name.slice(0, maxLength - 3) + '...';
}

export function removeNullValues(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.filter((item: unknown) => item !== null).map((item: unknown) => removeNullValues(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null) {
        result[key] = removeNullValues(value);
      }
    }
    return result;
  }

  return obj;
}
