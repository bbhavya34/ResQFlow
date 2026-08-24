"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { definePage } from "@/lib/page-definition";
import { SectionTitle, StatCard } from "@/components/aegis/ui";
import { useAegis } from "@/lib/aegis/store";
import {
  buildCampForecasts,
  type CampForecastRisk,
  type ForecastHorizon,
} from "@/lib/aegis/campForecast";

const ReliefCampMap = dynamic(
  () =>
    import("@/components/aegis/ReliefCampMap").then((mod) => mod.ReliefCampMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] animate-pulse rounded-md bg-muted" />
    ),
  },
);

export const Route = definePage("/camps")({
  head: () => ({
    meta: [
      { title: "Relief Camp Operations — ResQFlow" },
      {
        name: "description",
        content:
          "Occupancy, food and water stock, medical staffing and urgent requisitions across relief camps in Kerala, Assam, Bihar, Odisha, Bengal and Uttarakhand.",
      },
      {
        property: "og:title",
        content: "Relief Camp Operations — ResQFlow",
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
  const { camps, sosList } = useAegis();
  const occupancy = camps.reduce((n, c) => n + c.occupancy, 0);
  const capacity = camps.reduce((n, c) => n + c.capacity, 0);
  const availableCamps = camps.filter((c) => c.occupancy < c.capacity);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>(24);
  const focusedCampId = selectedCampId || availableCamps[0]?.id;
  const forecasts = useMemo(
    () => buildCampForecasts(camps, sosList, forecastHorizon),
    [camps, sosList, forecastHorizon],
  );
  const campsNeedingAction = forecasts.filter(
    (forecast) => forecast.risk === "CRITICAL" || forecast.risk === "HIGH",
  ).length;
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

      <div className="panel overflow-hidden">
        <div className="border-b border-border p-4">
          <SectionTitle
            title="Camp demand & supply forecast"
            desc="Projects arrivals from active SOS demand, then estimates capacity, food, water and medical pressure. Prototype estimate — deterministic, not a trained AI model."
            right={
              <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
                {([6, 12, 24] as const).map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setForecastHorizon(hours)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                      forecastHorizon === hours
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            }
          />
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
              {campsNeedingAction} camp{campsNeedingAction === 1 ? "" : "s"}{" "}
              need action
            </span>
            <span className="rounded bg-muted px-2.5 py-1 text-muted-foreground">
              Forecast horizon: next {forecastHorizon} hours
            </span>
            <span className="rounded bg-muted px-2.5 py-1 text-muted-foreground">
              Human review required before requisition or diversion
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Camp</th>
                <th className="px-3 py-3 text-left">Forecast risk</th>
                <th className="px-3 py-3 text-left">Demand</th>
                <th className="px-3 py-3 text-left">Supply cover</th>
                <th className="px-3 py-3 text-left">Why flagged</th>
                <th className="px-4 py-3 text-left">Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((forecast) => (
                <tr
                  key={forecast.camp.id}
                  className="border-t border-border align-top"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold">{forecast.camp.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {forecast.camp.district}, {forecast.camp.state}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <ForecastRiskBadge
                      risk={forecast.risk}
                      score={forecast.riskScore}
                    />
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    <p className="font-medium">
                      +{forecast.projectedArrivals} arrivals
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {forecast.projectedOccupancy}/{forecast.camp.capacity} (
                      {forecast.projectedOccupancyPct}%)
                    </p>
                  </td>
                  <td className="px-3 py-3 text-xs tabular-nums">
                    <p>Food: {forecast.foodHoursRemaining}h</p>
                    <p className="mt-1">
                      Water: {forecast.waterHoursRemaining}h
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {Number.isFinite(forecast.peoplePerMedic)
                        ? `${forecast.peoplePerMedic} people/medic`
                        : "No medic recorded"}
                    </p>
                  </td>
                  <td className="max-w-[260px] px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                    {forecast.reasons.slice(0, 2).join(" · ")}
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-xs font-medium leading-relaxed">
                    {forecast.actions[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border bg-muted/25 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
          Method: active SOS cases are mapped by district or state. Expected
          arrivals scale by the selected horizon; food and water cover are
          adjusted for average projected occupancy. Risk combines capacity,
          minimum supply cover, medical load and unresolved requisitions.
        </div>
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

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
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

        <div className="panel p-4">
          <SectionTitle
            title="Relief camp availability map"
            desc="Select an available camp to inspect its location, occupancy and supplies."
          />
          <label className="mb-3 block text-xs font-semibold text-muted-foreground">
            Available relief camp
            <select
              value={focusedCampId ?? ""}
              onChange={(event) => setSelectedCampId(event.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              {availableCamps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name} — {camp.capacity - camp.occupancy} places
                  available
                </option>
              ))}
            </select>
          </label>
          <ReliefCampMap
            camps={camps}
            selectedCampId={focusedCampId}
            height={340}
          />
        </div>
      </div>
    </div>
  );
}

function ForecastRiskBadge({
  risk,
  score,
}: {
  risk: CampForecastRisk;
  score: number;
}) {
  const className =
    risk === "CRITICAL"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : risk === "HIGH"
        ? "bg-amber/20 text-[oklch(0.45_0.13_75)] border-amber/30"
        : risk === "WATCH"
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-green/15 text-[oklch(0.42_0.11_155)] border-green/25";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {risk} · {score}/100
    </span>
  );
}
