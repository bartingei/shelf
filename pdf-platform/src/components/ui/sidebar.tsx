"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LayoutDashboard, LogOut, Upload } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onUpload?: () => void;
}

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/library", icon: BookOpen, label: "Library" },
];

export function Sidebar({ onUpload }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <BookOpen size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">Shelf</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-accent/15 text-accent"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}

        {onUpload && (
          <button
            onClick={onUpload}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Upload size={18} />
            Upload PDF
          </button>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-red-400"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}