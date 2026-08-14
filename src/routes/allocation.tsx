"use client";

import { definePage } from "@/lib/page-definition";
import { useState } from "react";
import { toast } from "sonner";
import { MapPanel } from "@/components/aegis/MapPanel";
import {
  PriorityBreakdown,
  PriorityPill,
  SectionTitle,
  StatusBadge,
} from "@/components/aegis/ui";
import { SAFE_ROUTE, priorityScore } from "@/lib/aegis/data";
import { useAegis } from "@/lib/aegis/store";

export const Route = definePage("/allocation")({
  head: () => ({
    meta: [
      { title: "Smart Allocation & Human Confirmation — FloodRadar" },
      {
        name: "description",
        content:
          "Deterministic prototype matching with ETA, capacity and capability reasoning. Nothing is dispatched without controller confirmation.",
      },
      {
        property: "og:title",
        content: "Smart Allocation & Human Confirmation — FloodRadar",
      },
      {
        property: "og:description",
        content:
          "Explainable rescue assignments with confirm, override and reject controls.",
      },
    ],
  }),
  component: AllocationPage,
});

export default function AllocationPage() {
  const {
    recommendations,
    resources,
    sosList,
    confirmDispatch,
    overrideAssign,
    rejectRecommendation,
  } = useAegis();
  const [override, setOverride] = useState<Record<string, string>>({});
  const dispatched = sosList.filter(
    (s) => s.status === "DISPATCHED" || s.status === "ASSIGNED",
  );

  return (
    <div className="space-y-6">
      <div className="panel p-4">
        <SectionTitle
          title="Smart allocation engine"
          desc="Deterministic prototype rules balance priority, travel time, craft capacity and capability match. OR-Tools integration is deferred to the Django backend phase."
        />
        <div className="grid gap-3 text-xs sm:grid-cols-4">
          {[
            ["Objective", "Minimise weighted rescue delay"],
            ["Hard constraints", "Capability match · capacity · availability"],
            ["Soft costs", "Distance · verification · agency load"],
            ["Dispatch policy", "Human confirmation mandatory"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-border p-3">
              <p className="font-semibold text-foreground">{k}</p>
              <p className="mt-1 text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.sos.id} className="panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">
                    {rec.resource.id} → SOS {rec.sos.id}
                  </h3>
                  <PriorityPill factors={rec.sos.factors} />
                  <StatusBadge status={rec.sos.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rec.sos.place}, {rec.sos.state} · {rec.sos.people} persons ·{" "}
                  {rec.sos.livestock} livestock
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="text-lg font-semibold tabular-nums">
                    {rec.etaMin} min
                  </p>
                  <p className="text-muted-foreground">ETA</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums">
                    {rec.resource.capacity}
                  </p>
                  <p className="text-muted-foreground">Capacity</p>
                </div>
                <div>
                  <p className="text-lg font-semibold tabular-nums">
                    {rec.distanceKm.toFixed(1)} km
                  </p>
                  <p className="text-muted-foreground">Distance</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Why this resource was selected
                </p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {rec.reasons.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full brand-gradient" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                {rec.capabilityMatch.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {rec.capabilityMatch.map((c) => (
                      <span
                        key={c}
                        className="rounded bg-accent px-2 py-0.5 text-[11px] text-accent-foreground"
                      >
                        capability match · {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Priority breakdown ({priorityScore(rec.sos.factors)}/100)
                </p>
                <div className="mt-2">
                  <PriorityBreakdown factors={rec.sos.factors} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <button
                onClick={() => {
                  confirmDispatch(rec.sos.id, rec.resource.id);
                  toast.success(
                    `Dispatch confirmed: ${rec.resource.id} → SOS ${rec.sos.id}`,
                  );
                }}
                className="rounded-md brand-gradient px-4 py-2 text-sm font-semibold text-white"
              >
                Confirm dispatch
              </button>
              <select
                value={override[rec.sos.id] ?? ""}
                onChange={(e) =>
                  setOverride((s) => ({ ...s, [rec.sos.id]: e.target.value }))
                }
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Override with…</option>
                {resources
                  .filter(
                    (r) =>
                      r.availability === "AVAILABLE" &&
                      r.id !== rec.resource.id,
                  )
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.name}
                    </option>
                  ))}
              </select>
              <button
                disabled={!override[rec.sos.id]}
                onClick={() => {
                  const id = override[rec.sos.id]!;
                  overrideAssign(rec.sos.id, id);
                  toast.message(
                    `Controller override: ${id} assigned to SOS ${rec.sos.id}`,
                  );
                }}
                className="rounded-md border border-input px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Apply override
              </button>
              <button
                onClick={() => {
                  rejectRecommendation(rec.sos.id);
                  toast.error(`Recommendation rejected for SOS ${rec.sos.id}`);
                }}
                className="rounded-md border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive"
              >
                Reject
              </button>
              <span className="ml-auto text-xs text-muted-foreground">
                No automatic dispatch — action is logged against the controller
                on duty.
              </span>
            </div>
          </div>
        ))}
        {recommendations.length === 0 && (
          <div className="panel p-8 text-center text-sm text-muted-foreground">
            No open requests awaiting allocation. All active SOS are assigned or
            closed.
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="panel p-4">
          <SectionTitle
            title="Confirmed dispatches"
            desc="Live assignments after human confirmation."
          />
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="py-2 text-left">SOS</th>
                <th className="py-2 text-left">Resource</th>
                <th className="py-2 text-left">Location</th>
                <th className="py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {dispatched.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-2 font-semibold">{s.id}</td>
                  <td className="py-2">{s.assignedResourceId}</td>
                  <td className="py-2 text-xs">{s.place}</td>
                  <td className="py-2">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
              {dispatched.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-4 text-center text-xs text-muted-foreground"
                  >
                    Nothing dispatched yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="panel p-4">
          <SectionTitle
            title="Safe route preview"
            desc={`${SAFE_ROUTE.resourceId} → SOS ${SAFE_ROUTE.sosId} · ${SAFE_ROUTE.km} km · ${SAFE_ROUTE.etaMin} min · flooded segments avoided`}
          />
          <MapPanel
            height={340}
            showControls={false}
            center={[9.946, 76.28]}
            zoom={13}
          />
        </div>
      </div>
    </div>
  );
}
