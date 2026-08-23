"use client";

import Link from "next/link";
import { definePage } from "@/lib/page-definition";
import { MapPanel } from "@/components/aegis/MapPanel";
import {
  PriorityPill,
  SectionTitle,
  StatCard,
  StatusBadge,
} from "@/components/aegis/ui";
import { FLOOD_ZONES, priorityScore } from "@/lib/aegis/data";
import { useAegis } from "@/lib/aegis/store";

export const Route = definePage("/")({
  head: () => ({
    meta: [
      {
        title: "ResQFlow — National Disaster Response Command Centre",
      },
      {
        name: "description",
        content:
          "Live command centre for Indian flood response: SOS triage, priority scoring, resource allocation, safe routing and relief camps.",
      },
      {
        property: "og:title",
        content: "ResQFlow — Disaster Response Command Centre",
      },
      {
        property: "og:description",
        content:
          "Unified risk alerts, SOS triage, resource allocation and relief camp operations for India.",
      },
    ],
  }),
  component: Index,
});

export default function Index() {
  const { sosList, resources, camps, online, lastSync } = useAegis();
  const open = sosList.filter(
    (s) => s.status === "NEW" || s.status === "TRIAGED",
  );
  const critical = sosList.filter((s) => priorityScore(s.factors) >= 85);
  const awaiting = open.reduce((n, s) => n + s.people, 0);
  const available = resources.filter((r) => r.availability === "AVAILABLE");
  const deployed = resources.filter((r) => r.availability === "ENGAGED");
  const occupancy = camps.reduce((n, c) => n + c.occupancy, 0);
  const availableCapacity = available.reduce((n, r) => n + r.capacity, 0);
  const pressuredCamps = camps.filter(
    (c) => c.status === "CRITICAL" || c.status === "STRAINED",
  );
  const highestDepth = open.reduce(
    (depth, request) => Math.max(depth, request.floodDepthM),
    0,
  );
  const severeZones = FLOOD_ZONES.filter(
    (zone) => zone.risk === "SEVERE" || zone.risk === "HIGH",
  );
  const controllerNotifications = open
    .slice()
    .sort((a, b) => priorityScore(b.factors) - priorityScore(a.factors));

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              National Emergency Operations Centre
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Monsoon Flood Response — Live Command Centre
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Kerala, Assam, Bihar, Odisha, West Bengal, Uttarakhand,
              Maharashtra and Gujarat sectors under active watch. All dispatch
              actions require controller confirmation.
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Operational status</p>
            <p
              className={`text-sm font-semibold ${online ? "text-[oklch(0.42_0.11_155)]" : "text-[oklch(0.45_0.13_75)]"}`}
            >
              {online
                ? "ONLINE · all feeds nominal"
                : "DEGRADED · cached plan active"}
            </p>
            <p className="mt-1">Last sync {lastSync}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard
          label="Active SOS"
          value={open.length}
          sub="awaiting allocation"
          tone="critical"
        />
        <StatCard
          label="Critical"
          value={critical.length}
          sub="priority ≥ 85"
          tone="critical"
        />
        <StatCard
          label="Flood-risk zones"
          value={FLOOD_ZONES.length}
          sub="2 severe · 2 high"
          tone="warn"
        />
        <StatCard
          label="Available resources"
          value={available.length}
          sub="verified & ready"
          tone="good"
        />
        <StatCard
          label="Deployed"
          value={deployed.length}
          sub="engaged in operations"
        />
        <StatCard
          label="Awaiting rescue"
          value={awaiting}
          sub="persons in open requests"
          tone="critical"
        />
        <StatCard
          label="Relief camps"
          value={camps.length}
          sub={`${occupancy} persons sheltered`}
          tone="good"
        />
        <StatCard
          label="Connectivity"
          value={online ? "ONLINE" : "DEGRADED"}
          sub={online ? "Realtime sync active" : "Cached plan in use"}
          tone={online ? "good" : "warn"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="panel self-start overflow-hidden flex flex-col">
          <div className="px-4 pt-4 pb-2 shrink-0">
            <SectionTitle
              title="Operational map — India"
              right={
                <Link
                  href="/map"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Open full GIS view →
                </Link>
              }
            />
          </div>
          {/* Map must not grow beyond its fixed height — overflow-hidden on parent handles clipping */}
          <div className="shrink-0 overflow-hidden">
            <MapPanel height={380} showBasemapSwitcher={false} />
          </div>

          <div className="grid border-t border-border bg-background/35 md:grid-cols-2">
            <section className="border-b border-border p-3 md:border-r">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
                Immediate exposure
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <CommandMetric
                  value={awaiting}
                  label="People awaiting rescue"
                />
                <CommandMetric
                  value={critical.length}
                  label="Critical requests"
                />
                <CommandMetric
                  value={`${highestDepth.toFixed(1)}m`}
                  label="Highest reported depth"
                />
              </div>
              <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">
                    Controller notifications
                  </p>
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                    {controllerNotifications.length}
                  </span>
                </div>
                <ul className="max-h-[104px] space-y-1.5 overflow-y-auto pr-1">
                  {controllerNotifications.map((request) => {
                    const score = priorityScore(request.factors);
                    return (
                      <li
                        key={request.id}
                        className="flex items-center gap-2 rounded border border-border/70 bg-card/70 px-2 py-1.5 text-[11px]"
                      >
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${score >= 85 ? "bg-destructive" : "bg-amber"}`}
                        />
                        <span className="font-semibold text-foreground">
                          SOS {request.id}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                          {request.place}
                        </span>
                        <span className="shrink-0 font-mono text-muted-foreground">
                          {request.people} people
                        </span>
                      </li>
                    );
                  })}
                  {controllerNotifications.length === 0 && (
                    <li className="py-2 text-[11px] text-muted-foreground">
                      No open notifications.
                    </li>
                  )}
                </ul>
              </div>
            </section>

            <section className="border-b border-border p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-green">
                Response readiness
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <CommandMetric
                  value={available.length}
                  label="Ready resources"
                />
                <CommandMetric
                  value={availableCapacity}
                  label="Available seats"
                />
                <CommandMetric
                  value={pressuredCamps.length}
                  label="Pressured camps"
                />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full brand-gradient"
                  style={{
                    width: `${resources.length ? Math.round((available.length / resources.length) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>Fleet readiness</span>
                <span>
                  {resources.length
                    ? Math.round((available.length / resources.length) * 100)
                    : 0}
                  % available
                </span>
              </div>
            </section>

            <section className="p-3 md:border-r">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber">
                Priority sectors
              </p>
              <ul className="mt-2 space-y-1.5">
                {severeZones.slice(0, 4).map((zone) => (
                  <li key={zone.id} className="flex items-center gap-2 text-xs">
                    <span
                      className={`size-2 shrink-0 rounded-full ${zone.risk === "SEVERE" ? "bg-destructive" : "bg-amber"}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {zone.name}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {Math.round(zone.probability * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Response actions
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <CommandLink href="/sos" label="Triage SOS" />
                <CommandLink href="/allocation" label="Allocate teams" />
                <CommandLink href="/resources" label="View resources" />
                <CommandLink href="/camps" label="Check camps" />
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-4">
            <SectionTitle
              title="Priority queue"
              desc="Highest scoring open requests"
            />
            <ul className="space-y-3">
              {open
                .slice()
                .sort(
                  (a, b) => priorityScore(b.factors) - priorityScore(a.factors),
                )
                .slice(0, 5)
                .map((s) => (
                  <li
                    key={s.id}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">SOS {s.id}</span>
                      <PriorityPill factors={s.factors} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.place}, {s.state}
                    </p>
                    <p className="mt-1 text-xs">
                      {s.people} persons · {s.children + s.elderly + s.disabled}{" "}
                      vulnerable · {s.floodDepthM} m depth
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={s.status} />
                      <Link
                        href="/allocation"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Review allocation →
                      </Link>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          <div className="panel p-4">
            <SectionTitle
              title="Flood risk watch"
              desc="Prototype CWC + IMD fixture feed; no ML model"
            />
            <ul className="space-y-2 text-xs">
              {FLOOD_ZONES.map((z) => (
                <li
                  key={z.id}
                  className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{z.name}</p>
                    <p className="text-muted-foreground">{z.forecast}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 font-semibold ${
                      z.risk === "SEVERE"
                        ? "bg-destructive/10 text-destructive"
                        : z.risk === "HIGH"
                          ? "bg-amber/20 text-[oklch(0.45_0.13_75)]"
                          : "bg-teal/15 text-[oklch(0.42_0.09_195)]"
                    }`}
                  >
                    {Math.round(z.probability * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandMetric({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <p className="text-base font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function CommandLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      {label} →
    </Link>
  );
}
