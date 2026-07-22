"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, Clock, AlertCircle, BellOff } from "lucide-react";
import { TopNav } from "@/components/ui/top-nav";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

const ICONS: Record<NotificationType, React.ReactNode> = {
  PAYMENT_SUCCESS: <Sparkles size={16} className="text-gold" />,
  SUBSCRIPTION_EXPIRING_SOON: <Clock size={16} className="text-amber-400" />,
  SUBSCRIPTION_EXPIRED: <AlertCircle size={16} className="text-red-400" />,
};

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
        <span className="eyebrow">Updates</span>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Notifications</h1>

        <div className="mt-10 space-y-3">
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
              <BellOff size={22} className="text-muted" />
              <p className="text-sm text-muted">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  n.read ? "border-border bg-card" : "border-gold/30 bg-gold/5"
                )}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20">
                  {ICONS[n.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{n.message}</p>
                  <p className="mt-1.5 text-xs text-muted/70">
                    {new Date(n.createdAt).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
