"use client";

import { definePage } from "@/lib/page-definition";
import { MapPanel } from "@/components/aegis/MapPanel";
import { SectionTitle } from "@/components/aegis/ui";
import { BLOCKED_ROADS, FLOOD_ZONES, SAFE_ROUTE } from "@/lib/aegis/data";

export const Route = definePage("/map")({
  head: () => ({
    meta: [
      { title: "GIS Operations Map — FloodRadar" },
      {
        name: "description",
        content:
          "Interactive Leaflet + OpenStreetMap view of Indian flood zones, SOS requests, rescue resources, relief camps, hospitals and safe routes.",
      },
      { property: "og:title", content: "GIS Operations Map — FloodRadar" },
      {
        property: "og:description",
        content:
          "Layered India flood-response map with SOS, resources and safe routing.",
      },
    ],
  }),
  component: MapPage,
});

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div className="panel p-4">
        <SectionTitle
          title="GIS operations map"
          desc="Toggle layers to inspect flood zones, live SOS, resource positions, camps, hospitals, shelters, rivers, blocked roads and generated safe routes."
        />
        <MapPanel height={620} center={[22.5, 79]} zoom={5} showIndiaReset />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-4">
          <h3 className="text-sm font-semibold">Safe routing engine</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Prototype route fixture over OpenStreetMap context. NetworkX graph
            routing is planned for the backend phase.
          </p>
          <dl className="mt-3 space-y-1.5 text-xs">
            <Row
              k="Route"
              v={`${SAFE_ROUTE.resourceId} → SOS ${SAFE_ROUTE.sosId}`}
            />
            <Row
              k="Graph nodes evaluated"
              v={SAFE_ROUTE.nodes.toLocaleString("en-IN")}
            />
            <Row k="Distance" v={`${SAFE_ROUTE.km} km`} />
            <Row k="ETA" v={`${SAFE_ROUTE.etaMin} min`} />
            <Row k="Avoided edges" v="2 flooded road segments" />
          </dl>
        </div>
        <div className="panel p-4">
          <h3 className="text-sm font-semibold">Blocked / submerged roads</h3>
          <ul className="mt-3 space-y-2 text-xs">
            {BLOCKED_ROADS.map((r) => (
              <li
                key={r.name}
                className="border-b border-border pb-2 last:border-0"
              >
                <p className="font-medium">{r.name}</p>
                <p className="text-muted-foreground">{r.reason}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-4">
          <h3 className="text-sm font-semibold">Flood zone register</h3>
          <ul className="mt-3 space-y-2 text-xs">
            {FLOOD_ZONES.map((z) => (
              <li
                key={z.id}
                className="flex justify-between gap-2 border-b border-border pb-2 last:border-0"
              >
                <span>
                  <span className="font-medium">{z.river}</span> · {z.state}
                </span>
                <span className="text-muted-foreground">
                  {z.risk} · {z.radiusKm} km
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
