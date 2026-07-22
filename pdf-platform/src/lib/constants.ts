// Per-file upload cap. Enforced both client-side (fast feedback) and
// server-side (the client check can't be trusted — someone could hit
// /api/upload directly). Large scanned textbooks can run 30-60MB, so
// 100MB leaves headroom without letting a single upload eat a big chunk
// of the Supabase Storage quota.
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

// Book cap for the Free plan. Enforced server-side in POST /api/books.
export const FREE_PLAN_BOOK_LIMIT = 10;

// Shelf Pro pricing (KES, whole shillings — Daraja's Amount field takes no
// decimals). durationDays uses fixed day counts rather than calendar-month
// arithmetic to sidestep month-length edge cases (e.g. Jan 31 + 1 month).
export const PRICING = {
  MONTHLY: { amount: 149, label: "Monthly", durationDays: 30 },
  YEARLY: { amount: 1499, label: "Yearly", durationDays: 365 },
} as const;

export type SubscriptionPlanKey = keyof typeof PRICING;

// How many days before a subscription's currentPeriodEnd the cron job
// creates a "expiring soon" reminder notification.
export const SUBSCRIPTION_REMINDER_DAYS_BEFORE_EXPIRY = 3;

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
