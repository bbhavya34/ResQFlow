"use client";

import { definePage } from "@/lib/page-definition";
import { toast } from "sonner";
import { SectionTitle, StatCard } from "@/components/aegis/ui";
import { SAFE_ROUTE } from "@/lib/aegis/data";
import { useAegis } from "@/lib/aegis/store";

export const Route = definePage("/offline")({
  head: () => ({
    meta: [
      { title: "Connectivity & Offline Resilience — FloodRadar" },
      {
        name: "description",
        content:
          "Degraded-mode operations with cached response plans, last sync time, plan age and controlled resynchronisation for flood-hit areas.",
      },
      {
        property: "og:title",
        content: "Connectivity & Offline Resilience — FloodRadar",
      },
      {
        property: "og:description",
        content: "Field operations continue when the network drops.",
      },
    ],
  }),
  component: OfflinePage,
});

export default function OfflinePage() {
  const { online, setOnline, resync, lastSync, recommendations, sosList } =
    useAegis();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Link status"
          value={online ? "ONLINE" : "DEGRADED"}
          tone={online ? "good" : "warn"}
          sub={
            online
              ? "Prototype browser channel active"
              : "Cellular backhaul lost"
          }
        />
        <StatCard
          label="Last sync"
          value={lastSync.split(", ")[1] ?? lastSync}
          sub={lastSync}
        />
        <StatCard
          label="Cached plan age"
          value={online ? "0 min" : "Live at disconnect"}
          sub="auto-expires after 6 hrs"
        />
        <StatCard
          label="Cached records"
          value={sosList.length + recommendations.length}
          sub="SOS + assignments held locally"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <SectionTitle
            title="Degraded mode control"
            desc="Simulate a network loss in the field. The controller decides whether to keep running on the cached plan."
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setOnline(false);
                toast.warning(
                  "Switched to DEGRADED MODE — cached response plan in use",
                );
              }}
              className="rounded-md border border-amber/40 bg-amber/15 px-4 py-2 text-sm font-semibold text-[oklch(0.42_0.13_75)]"
            >
              Simulate connectivity drop
            </button>
            <button
              onClick={() =>
                toast.message("Continuing offline — actions queued for sync")
              }
              disabled={online}
              className="rounded-md border border-input px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Continue offline
            </button>
            <button
              onClick={() => {
                resync();
                toast.success(
                  "Reconnected — queued actions synced with the national server",
                );
              }}
              className="rounded-md brand-gradient px-4 py-2 text-sm font-semibold text-white"
            >
              Reconnect &amp; sync
            </button>
          </div>

          <div className="mt-4 rounded-md border border-border p-3 text-xs">
            <p className="font-semibold">What keeps working offline</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>· Cached SOS queue with last-known priority scores</li>
              <li>· Cached allocation plan and safe route geometry</li>
              <li>· Offline OSM tiles for the active district</li>
              <li>· Field reports queued locally and replayed on reconnect</li>
              <li>· SMS fallback gateway for intake and confirmation</li>
            </ul>
          </div>
        </div>

        <div className="panel p-5">
          <SectionTitle
            title="Cached response plan"
            desc="Snapshot held on the field device / district server."
          />
          <div className="rounded-md border border-border">
            <div className="border-b border-border bg-muted/50 px-3 py-2 text-xs font-semibold">
              Plan snapshot · {lastSync}
            </div>
            <div className="space-y-2 p-3 text-xs">
              <p>
                Route {SAFE_ROUTE.resourceId} → SOS {SAFE_ROUTE.sosId} ·{" "}
                {SAFE_ROUTE.km} km · ETA {SAFE_ROUTE.etaMin} min
              </p>
              {recommendations.slice(0, 4).map((r) => (
                <p key={r.sos.id}>
                  {r.resource.id} → SOS {r.sos.id} · ETA {r.etaMin} min ·{" "}
                  {r.sos.place}
                </p>
              ))}
              <p className="text-muted-foreground">
                Plan valid while cached age is under 6 hours. Beyond that the
                controller must re-verify with the district EOC over voice/SMS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
