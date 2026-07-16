// Falls back to localhost in dev; set NEXT_PUBLIC_SITE_URL in production so
// canonical URLs, the sitemap, and Open Graph tags resolve to the real domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "Shelf";

export const SITE_DESCRIPTION =
  "Shelf is a cinematic home for your PDFs. Upload your collection, let AI sort it into genres, and read in a distraction-free viewer with highlights, notes, bookmarks, and reading progress synced to your account.";

export const SITE_KEYWORDS = [
  "PDF reader",
  "PDF library",
  "ebook reader",
  "PDF organizer",
  "reading app",
  "PDF annotation",
  "PDF highlights",
  "online book reader",
];
