import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Robustly parses a date string that might be in DD/MM/YYYY or YYYY-MM-DD format.
 */
export function parseDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date(0);
  
  // Handle DD/MM/YYYY or D/M/YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1]);
    const m = parseInt(dmyMatch[2]);
    const y = parseInt(dmyMatch[3]);
    // Use Date constructor (year, monthIndex, day) which is always local
    return new Date(y, m - 1, d);
  }
  
  // Handle YYYY-MM-DD
  const ymdMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1]);
    const m = parseInt(ymdMatch[2]);
    const d = parseInt(ymdMatch[3]);
    return new Date(y, m - 1, d);
  }
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date(0) : date;
}
