// Centralized, book-themed Unsplash imagery used across marketing + app chrome.
// Direct CDN URLs (hotlink-safe); sizing params keep payloads small.
const U = "https://images.unsplash.com";
const opts = (w: number) => `?auto=format&fit=crop&q=80&w=${w}`;

export const IMAGES = {
  // Warm open book on a desk — landing hero
  heroBook: `${U}/photo-1512820790803-83ca734da794${opts(1400)}`,
  // Assorted books piled on shelves (user-selected) — auth split panel
  shelves: `${U}/photo-1521587760476-6c12a4b040da${opts(1200)}`,
  // Library interior — library page banner
  library: `${U}/photo-1507842217343-583bb7270b66${opts(1600)}`,
  // Stacked books, moody — dashboard empty state / billboard fallback
  stack: `${U}/photo-1524995997946-a1c2e315a42f${opts(1400)}`,
  // Cozy reading nook — secondary
  nook: `${U}/photo-1519682337058-a94d519337bc${opts(1200)}`,
} as const;
