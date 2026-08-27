"use client";

import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/aegis/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { AegisProvider } from "@/lib/aegis/store";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.info("[ResQFlow] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[ResQFlow] Service Worker registration note:", err);
        });
    }
  }, []);

  return (
    <AegisProvider>
      <AppShell>{children}</AppShell>
      <Toaster position="top-right" />
    </AegisProvider>
  );
}

