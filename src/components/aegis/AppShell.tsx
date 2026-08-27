"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { useAegis } from "@/lib/aegis/store";

const NAV = [
  { to: "/", label: "Command Centre" },
  { to: "/map", label: "Operations Map" },
  { to: "/offline-sos", label: "🧭 Offline SOS" },
  { to: "/sos", label: "SOS Requests" },
  { to: "/resources", label: "Resources" },
  { to: "/allocation", label: "Allocation" },
  { to: "/camps", label: "Relief Camps" },
  { to: "/field", label: "Field Feedback" },
  { to: "/analytics", label: "Analytics" },
  { to: "/offline", label: "Connectivity" },
  { to: "/demo", label: "Demo Run" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { online, lastSync } = useAegis();

  // Prevent hydration mismatch: the online state is only known client-side
  // after the connectivity probe. Render a neutral badge on the server and
  // swap in the real status after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full brand-gradient" />
      <header className="sticky top-0 z-[900] border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-foreground">
              ResQFlow
            </span>
            <span className="block text-[11px] text-muted-foreground">
              National Disaster Response Intelligence Platform
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] text-muted-foreground">Last sync</p>
              <p className="text-xs font-medium text-foreground">{lastSync}</p>
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold ${
                !mounted
                  ? "border-border bg-card text-muted-foreground"
                  : online
                  ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                  : "border-red-500/40 bg-red-950/50 text-red-400"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  !mounted ? "bg-muted-foreground" : online ? "bg-emerald-400" : "bg-red-400 animate-pulse"
                }`}
              />
              {!mounted ? "CHECKING..." : online ? "ONLINE" : "OFFLINE MODE"}
            </div>
          </div>
        </div>
        <nav className="mx-auto max-w-[1600px] overflow-x-auto px-2 pb-1">
          <ul className="flex min-w-max items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <li key={n.to}>
                  <Link
                    href={n.to}
                    className={`inline-block rounded-t-md border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {mounted && !online && (
        <div className="border-b border-red-500/30 bg-red-950/30 px-4 py-2 text-center text-xs font-medium text-red-400">
          ⚠ OFFLINE MODE — Operating on cached emergency plan. All field operations continue offline.
        </div>
      )}

      <main className="mx-auto max-w-[1600px] px-4 py-6">{children}</main>

      <footer className="mt-8 border-t border-border bg-card">
        <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-7 md:grid-cols-[1.2fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="text-sm font-semibold text-foreground">
              ResQFlow
            </Link>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
              A unified command platform for coordinated flood response,
              resource visibility and relief operations.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Operations
            </p>
            <nav className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <Link href="/map" className="hover:text-primary">
                Live map
              </Link>
              <Link href="/sos" className="hover:text-primary">
                SOS requests
              </Link>
              <Link href="/resources" className="hover:text-primary">
                Resources
              </Link>
              <Link href="/camps" className="hover:text-primary">
                Relief camps
              </Link>
            </nav>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Operational notice
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Verify current field conditions and obtain authorization from the
              responsible response controller before deployment.
            </p>
          </div>
        </div>
        <div className="border-t border-border/70">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-muted-foreground">
            <p>© 2026 ResQFlow. All rights reserved.</p>
            <p>India flood response coordination platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
