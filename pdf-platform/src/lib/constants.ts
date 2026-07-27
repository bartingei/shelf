// Per-file upload cap. Enforced both client-side (fast feedback) and
// server-side (the client check can't be trusted — someone could hit
// /api/upload directly). Large scanned textbooks can run 30-60MB, so
// 100MB leaves headroom without letting a single upload eat a big chunk
// of the Supabase Storage quota.
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

// Book cap for the Free plan. Enforced server-side in POST /api/books.
export const FREE_PLAN_BOOK_LIMIT = 10;

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
