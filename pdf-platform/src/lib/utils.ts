import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeRemaining(minutes: number): string {
  if (minutes < 1) return "< 1 min remaining";
  if (minutes < 60) return `${Math.round(minutes)} min remaining`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m remaining`;
}

export function calcPercentComplete(currentPage: number, totalPages: number): number {
  if (!totalPages) return 0;
  return Math.min(100, Math.round((currentPage / totalPages) * 100));
}
