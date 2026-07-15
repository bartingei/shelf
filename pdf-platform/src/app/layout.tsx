import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Editorial display serif for headings — high-contrast with elegant italics.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shelf — Your Reading Platform",
  description: "A cinematic home for your PDFs — organize, annotate, and lose yourself in the long read.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
