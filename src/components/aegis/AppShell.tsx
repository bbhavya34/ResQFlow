import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAegis } from "@/lib/aegis/store";

const NAV = [
  { to: "/", label: "Command Centre" },
  { to: "/map", label: "GIS Map" },
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { online, lastSync, setOnline } = useAegis();

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full brand-gradient" />
      <header className="sticky top-0 z-[900] border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md brand-gradient text-sm font-bold text-white">
              AB
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-foreground">
                Aegis Bharat
              </span>
              <span className="block text-[11px] text-muted-foreground">
                National Disaster Response Intelligence Platform
              </span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] text-muted-foreground">Last sync</p>
              <p className="text-xs font-medium text-foreground">{lastSync}</p>
            </div>
            <button
              onClick={() => setOnline(!online)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold ${
                online
                  ? "border-green/30 bg-green/10 text-[oklch(0.42_0.11_155)]"
                  : "border-amber/40 bg-amber/15 text-[oklch(0.45_0.13_75)]"
              }`}
            >
              <span className={`size-2 rounded-full ${online ? "bg-green" : "bg-amber"}`} />
              {online ? "ONLINE" : "DEGRADED MODE"}
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-[1600px] overflow-x-auto px-2 pb-1">
          <ul className="flex min-w-max items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <li key={n.to}>
                  <Link
                    to={n.to}
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

      {!online && (
        <div className="border-b border-amber/40 bg-amber/10 px-4 py-2 text-center text-xs font-medium text-[oklch(0.42_0.13_75)]">
          Connectivity degraded — operating on the cached response plan. Field operations continue offline.
        </div>
      )}

      <main className="mx-auto max-w-[1600px] px-4 py-6">{children}</main>

      <footer className="mt-8 border-t border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-1 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Aegis Bharat · Integrated with SDMA / NDRF / IMD / CWC data feeds (demo dataset)</p>
          <p>Human-in-the-loop dispatch · No automatic deployment</p>
        </div>
      </footer>
    </div>
  );
}