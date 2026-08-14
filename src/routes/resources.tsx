"use client";

import { definePage } from "@/lib/page-definition";
import { useState } from "react";
import { SectionTitle, StatCard } from "@/components/aegis/ui";
import { useAegis } from "@/lib/aegis/store";

export const Route = definePage("/resources")({
  head: () => ({
    meta: [
      { title: "Resource Registry — FloodRadar" },
      {
        name: "description",
        content:
          "Unified registry of NDRF, SDRF, fire services, ambulances and verified civilian boats, vehicles and volunteers with live availability.",
      },
      { property: "og:title", content: "Resource Registry — FloodRadar" },
      {
        property: "og:description",
        content:
          "Official and verified civilian rescue capacity across Indian flood districts.",
      },
    ],
  }),
  component: ResourcesPage,
});

export default function ResourcesPage() {
  const { resources } = useAegis();
  const [filter, setFilter] = useState<"ALL" | "OFFICIAL" | "CIVILIAN">("ALL");
  const list = resources.filter(
    (r) => filter === "ALL" || r.category === filter,
  );
  const seats = resources.reduce((n, r) => n + r.capacity, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Registered resources"
          value={resources.length}
          sub="official + civilian"
        />
        <StatCard
          label="Available now"
          value={resources.filter((r) => r.availability === "AVAILABLE").length}
          tone="good"
        />
        <StatCard
          label="Total lift capacity"
          value={seats}
          sub="persons per sortie"
        />
        <StatCard
          label="Verification pending"
          value={resources.filter((r) => !r.verified).length}
          tone="warn"
          sub="cannot be auto-recommended first"
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <SectionTitle
            title="Resource registry"
            desc="Capacity, capability, verification and last position update for every asset."
          />
          <div className="flex gap-1 rounded-md border border-border p-1">
            {(["ALL", "OFFICIAL", "CIVILIAN"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-1 text-xs font-semibold ${
                  filter === f
                    ? "brand-gradient text-white"
                    : "text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                {[
                  "ID",
                  "Resource",
                  "Agency",
                  "Base / location",
                  "Capacity",
                  "Capabilities",
                  "Availability",
                  "Verified",
                  "Updated",
                ].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 font-semibold">{r.id}</td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.type} · {r.contact}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {r.agency}
                    <div className="text-muted-foreground">{r.category}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {r.base}
                    <div className="text-muted-foreground">
                      {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
                    </div>
                  </td>
                  <td className="px-4 py-2 tabular-nums">{r.capacity}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.capabilities.map((c) => (
                        <span
                          key={c}
                          className="rounded bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                        r.availability === "AVAILABLE"
                          ? "bg-green/15 text-[oklch(0.42_0.11_155)]"
                          : r.availability === "ENGAGED"
                            ? "bg-amber/20 text-[oklch(0.45_0.13_75)]"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.availability}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {r.verified ? "Verified" : "Pending"}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {r.lastUpdate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
