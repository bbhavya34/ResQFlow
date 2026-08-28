"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAegis } from "@/lib/aegis/store";

const PRIMARY_NAV = [
  { to: "/", label: "Command Center" },
  { to: "/resources", label: "Resources" },
  { to: "/allocation", label: "Allocation" },
  { to: "/camps", label: "Relief Camps" },
] as const;

const FIELD_NAV = [
  { to: "/field", label: "Field Feedback" },
  { to: "/analytics", label: "Analytics" },
] as const;

const SOS_NAV = [
  { to: "/sos", label: "SOS Requests" },
  { to: "/offline-sos", label: "Offline SOS" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { online } = useAegis();

  // Prevent hydration mismatch: the online state is only known client-side
  // after the connectivity probe. Render a neutral badge on the server and
  // swap in the real status after mount.
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full brand-gradient" />
      <header className="sticky top-0 z-[1000] border-b border-border bg-card/90 backdrop-blur-sm">
        <nav aria-label="Primary navigation" className="relative z-[1010] mx-5 py-3">
          <div className="flex w-full min-h-16 items-center rounded-full border border-border bg-card/90 px-5 py-3 text-sm text-foreground shadow-sm backdrop-blur-sm sm:px-9">
            <Link
              href="/"
              aria-label="ResQFlow Command Center"
              className="min-w-0 max-w-[calc(100%-3rem)] shrink leading-tight sm:max-w-none"
            >
              <span className="block text-[15px] font-semibold tracking-tight text-foreground">
                ResQFlow
              </span>
              <span className="block truncate text-[10px] text-muted-foreground sm:text-[11px]">
                National Disaster Response Intelligence Platform
              </span>
            </Link>

            <div className="ml-auto hidden items-center gap-6 xl:flex">
              {PRIMARY_NAV.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    aria-current={active ? "page" : undefined}
                    className={`group relative h-6 overflow-hidden text-[14px] font-medium transition-colors ${
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="block transition-transform duration-300 group-hover:-translate-y-full">
                      {item.label}
                    </span>
                    <span className="absolute left-0 top-full block transition-transform duration-300 group-hover:-translate-y-full">
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              <NavigationDropdown
                label="Field & Analytics"
                active={FIELD_NAV.some((item) => pathname === item.to)}
                items={FIELD_NAV}
              />
              <NavigationDropdown
                label="SOS Operations"
                active={SOS_NAV.some((item) => pathname === item.to)}
                items={SOS_NAV}
              />
            </div>

            <div className="ml-3 flex items-center gap-2">
              <span
                title={!mounted ? "Checking connectivity" : online ? "Online" : "Offline"}
                aria-label={!mounted ? "Checking connectivity" : online ? "Online" : "Offline"}
                className={`size-2.5 shrink-0 rounded-full ring-4 ring-offset-2 ring-offset-card ${
                  !mounted
                    ? "bg-muted-foreground/60 ring-muted-foreground/10"
                    : online
                      ? "bg-emerald-400 ring-emerald-400/15"
                      : "animate-pulse bg-red-400 ring-red-400/15"
                }`}
              />

              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden"
                aria-label={
                  mobileMenuOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
                }
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? (
                  <X aria-hidden="true" />
                ) : (
                  <Menu aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-card p-3 shadow-xl xl:hidden">
              <MobileNavigationLinks
                items={PRIMARY_NAV}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />
              <MobileNavigationGroup
                label="Field & Analytics"
                items={FIELD_NAV}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />
              <MobileNavigationGroup
                label="SOS Operations"
                items={SOS_NAV}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          )}
        </nav>
      </header>

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

type NavItem = {
  to: string;
  label: string;
};

function NavigationDropdown({
  label,
  active,
  items,
}: {
  label: string;
  active: boolean;
  items: readonly NavItem[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`group relative h-6 overflow-hidden text-[14px] font-medium transition-colors ${
            active
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1 transition-transform duration-300 group-hover:-translate-y-full">
            {label}
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </span>
          <span className="absolute left-0 top-full flex items-center gap-1 transition-transform duration-300 group-hover:-translate-y-full">
            {label}
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-52 rounded-2xl border-border bg-card/95 p-2 shadow-xl backdrop-blur-sm"
      >
        {items.map((item) => (
          <DropdownMenuItem
            key={item.to}
            asChild
            className="rounded-xl px-3 py-2.5 text-sm font-medium"
          >
            <Link href={item.to} className="cursor-pointer">
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNavigationLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: readonly NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="grid gap-1">
      {items.map((item) => (
        <Link
          key={item.to}
          href={item.to}
          onClick={onNavigate}
          aria-current={pathname === item.to ? "page" : undefined}
          className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === item.to
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function MobileNavigationGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: readonly NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <MobileNavigationLinks
        items={items}
        pathname={pathname}
        onNavigate={onNavigate}
      />
    </div>
  );
}
