"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/aegis/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { AegisProvider } from "@/lib/aegis/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AegisProvider>
      <AppShell>{children}</AppShell>
      <Toaster position="top-right" />
    </AegisProvider>
  );
}
