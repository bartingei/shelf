"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Upload, LogOut, Bell } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/library", label: "Library" },
  { href: "/settings", label: "Settings" },
];

interface TopNavProps {
  onUpload?: () => void;
  /** When true the bar is transparent at the top of the page and solidifies on scroll. */
  overHero?: boolean;
}

export function TopNav({ onUpload, overHero = false }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/notifications?limit=1")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUnreadCount(data.unreadCount ?? 0))
      .catch(() => {});
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  const solid = scrolled || !overHero;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        solid ? "border-b border-border bg-background/85 backdrop-blur-md" : "border-b border-transparent"
      )}
    >
      {/* subtle scrim so links stay legible over bright hero imagery */}
      {overHero && !scrolled && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
      )}

      <div className="relative mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-2xl italic tracking-tight text-foreground">
            Shelf<span className="text-gold">.</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {onUpload && (
            <button
              onClick={onUpload}
              className="flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
            >
              <Upload size={15} /> <span className="hidden sm:inline">Upload</span>
            </button>
          )}
          <Link
            href="/notifications"
            title="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-red-400"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
