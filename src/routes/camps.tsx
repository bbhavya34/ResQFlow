"use client";

import { definePage } from "@/lib/page-definition";
import { SectionTitle, StatCard } from "@/components/aegis/ui";
import { useAegis } from "@/lib/aegis/store";

export const Route = definePage("/camps")({
  head: () => ({
    meta: [
      { title: "Relief Camp Operations — FloodRadar" },
      {
        name: "description",
        content:
          "Occupancy, food and water stock, medical staffing and urgent requisitions across relief camps in Kerala, Assam, Bihar, Odisha, Bengal and Uttarakhand.",
      },
      {
        property: "og:title",
        content: "Relief Camp Operations — FloodRadar",
      },
      {
        property: "og:description",
        content:
          "Live relief camp capacity and supply dashboard for Indian flood districts.",
      },
    ],
  }),
  component: CampsPage,
});

export default function CampsPage() {
  const { camps } = useAegis();
  const occupancy = camps.reduce((n, c) => n + c.occupancy, 0);
  const capacity = camps.reduce((n, c) => n + c.capacity, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Camps operational"
          value={camps.length}
          sub="6 districts"
        />
        <StatCard
          label="Persons sheltered"
          value={occupancy}
          sub={`of ${capacity} sanctioned capacity`}
        />
        <StatCard
          label="Camps critical"
          value={camps.filter((c) => c.status === "CRITICAL").length}
          tone="critical"
          sub="over capacity or < 2 days stock"
        />
        <StatCard
          label="Urgent requisitions"
          value={camps.reduce((n, c) => n + c.urgent.length, 0)}
          tone="warn"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {camps.map((c) => {
          const pct = Math.round((c.occupancy / c.capacity) * 100);
          return (
            <div key={c.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold leading-snug">
                    {c.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {c.district}, {c.state} · {c.id}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                    c.status === "CRITICAL"
                      ? "bg-destructive/10 text-destructive"
                      : c.status === "STRAINED"
                        ? "bg-amber/20 text-[oklch(0.45_0.13_75)]"
                        : "bg-green/15 text-[oklch(0.42_0.11_155)]"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-medium tabular-nums">
                    {c.occupancy}/{c.capacity} ({pct}%)
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${pct >= 100 ? "bg-destructive" : "brand-gradient"}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded border border-border py-2">
                  <p className="text-base font-semibold tabular-nums">
                    {c.foodDays}d
                  </p>
                  <p className="text-muted-foreground">Food</p>
                </div>
                <div className="rounded border border-border py-2">
                  <p className="text-base font-semibold tabular-nums">
                    {c.waterDays}d
                  </p>
                  <p className="text-muted-foreground">Water</p>
                </div>
                <div className="rounded border border-border py-2">
                  <p className="text-base font-semibold tabular-nums">
                    {c.medicalStaff}
                  </p>
                  <p className="text-muted-foreground">Medics</p>
                </div>
              </div>

              <div className="mt-3 text-xs">
                <p className="font-semibold text-muted-foreground">
                  Urgent requests
                </p>
                {c.urgent.length ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.urgent.map((u) => (
                      <span
                        key={u}
                        className="rounded bg-destructive/10 px-2 py-0.5 text-destructive"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    None — stocks adequate
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel p-4">
        <SectionTitle
          title="Supply requisition queue"
          desc="Auto-raised from camp stock thresholds; district collector approval pending."
        />
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="py-2 text-left">Camp</th>
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-left">Priority</th>
            </tr>
          </thead>
          <tbody>
            {camps.flatMap((c) =>
              c.urgent.map((u) => (
                <tr key={c.id + u} className="border-t border-border">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{u}</td>
                  <td className="py-2 text-xs">
                    {c.status === "CRITICAL" ? "Immediate" : "Within 24 hrs"}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
