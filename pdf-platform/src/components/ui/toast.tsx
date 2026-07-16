"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, opts?: { variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, opts?: { variant?: ToastVariant }) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant: opts?.variant ?? "success" }]);
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => dismiss(t.id)}
              className={cn(
                "pointer-events-auto flex max-w-sm cursor-pointer items-start gap-2.5 rounded-lg border bg-card px-4 py-3 text-sm shadow-2xl",
                t.variant === "success" ? "border-gold/30" : "border-red-500/30"
              )}
            >
              {t.variant === "success" ? (
                <CheckCircle size={16} className="mt-0.5 shrink-0 text-gold" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              )}
              <span className="flex-1 leading-snug text-foreground/90">{t.message}</span>
              <X size={14} className="mt-0.5 shrink-0 text-muted" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
