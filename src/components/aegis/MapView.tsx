import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polygon, Polyline, Popup, TileLayer, Tooltip } from "react-leaflet";
import {
  BLOCKED_ROADS,
  CAMPS,
  FACILITIES,
  FLOOD_ZONES,
  RIVERS,
  SAFE_ROUTE,
  priorityBand,
  priorityScore,
} from "@/lib/aegis/data";
import { useAegis } from "@/lib/aegis/store";

export type Layers = {
  flood: boolean;
  sos: boolean;
  resources: boolean;
  camps: boolean;
  hospitals: boolean;
  shelters: boolean;
  roads: boolean;
  rivers: boolean;
  route: boolean;
};

function circle(lat: number, lng: number, km: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    pts.push([lat + (km / 111) * Math.sin(a), lng + (km / (111 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a)]);
  }
  return pts;
}

const riskColor: Record<string, string> = {
  SEVERE: "#dc2626",
  HIGH: "#ea8a04",
  MODERATE: "#0d9488",
};

export default function MapView({
  layers,
  center = [17.5, 80.5],
  zoom = 5,
  height = 560,
}: {
  layers: Layers;
  center?: [number, number] | undefined;
  zoom?: number | undefined;
  height?: number | undefined;
}) {
  const { sosList, resources } = useAegis();

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height, width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {layers.flood &&
        FLOOD_ZONES.map((z) => (
          <Polygon
            key={z.id}
            positions={circle(z.lat, z.lng, z.radiusKm)}
            pathOptions={{ color: riskColor[z.risk], fillOpacity: 0.12, weight: 1.5 }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{z.name}</div>
                <div>{z.river} · {z.state}</div>
                <div>Risk: {z.risk} ({Math.round(z.probability * 100)}%)</div>
                <div className="mt-1 text-slate-600">{z.forecast}</div>
              </div>
            </Popup>
          </Polygon>
        ))}

      {layers.rivers &&
        RIVERS.map((r) => (
          <Polyline key={r.name} positions={r.path} pathOptions={{ color: "#2563eb", weight: 3, opacity: 0.6 }}>
            <Tooltip>{r.name} river</Tooltip>
          </Polyline>
        ))}

      {layers.roads &&
        BLOCKED_ROADS.map((r) => (
          <Polyline
            key={r.name}
            positions={r.path}
            pathOptions={{ color: "#b91c1c", weight: 4, dashArray: "6 6" }}
          >
            <Tooltip>Blocked: {r.name} — {r.reason}</Tooltip>
          </Polyline>
        ))}

      {layers.route && (
        <Polyline positions={SAFE_ROUTE.path} pathOptions={{ color: "#059669", weight: 5 }}>
          <Tooltip>
            Safe route {SAFE_ROUTE.resourceId} → {SAFE_ROUTE.sosId} · {SAFE_ROUTE.km} km · {SAFE_ROUTE.etaMin} min
          </Tooltip>
        </Polyline>
      )}

      {layers.sos &&
        sosList.map((s) => {
          const score = priorityScore(s.factors);
          const band = priorityBand(score);
          const color =
            band.tone === "critical" ? "#dc2626" : band.tone === "high" ? "#ea8a04" : "#0d9488";
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold">SOS {s.id} — {band.label} {score}/100</div>
                  <div>{s.place}, {s.district}, {s.state}</div>
                  <div>{s.people} persons · {s.livestock} livestock · {s.floodDepthM} m depth</div>
                  <div>Status: {s.status}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      {layers.resources &&
        resources.map((r) => (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lng]}
            radius={7}
            pathOptions={{
              color: "#1d4ed8",
              fillColor: r.availability === "AVAILABLE" ? "#3b82f6" : "#94a3b8",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{r.name} ({r.id})</div>
                <div>{r.agency}</div>
                <div>Capacity {r.capacity} · {r.availability}</div>
                <div>{r.capabilities.join(", ")}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

      {layers.camps &&
        CAMPS.map((c) => (
          <CircleMarker
            key={c.id}
            center={[c.lat, c.lng]}
            radius={7}
            pathOptions={{ color: "#047857", fillColor: "#10b981", fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{c.name}</div>
                <div>{c.occupancy}/{c.capacity} occupancy · {c.status}</div>
                <div>Food {c.foodDays} d · Water {c.waterDays} d</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

      {FACILITIES.filter(
        (f) => (f.kind === "HOSPITAL" && layers.hospitals) || (f.kind === "SHELTER" && layers.shelters),
      ).map((f) => (
        <CircleMarker
          key={f.id}
          center={[f.lat, f.lng]}
          radius={6}
          pathOptions={{
            color: f.kind === "HOSPITAL" ? "#7c3aed" : "#0891b2",
            fillColor: f.kind === "HOSPITAL" ? "#a78bfa" : "#22d3ee",
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-xs">
              <div className="font-semibold">{f.name}</div>
              <div>{f.detail}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}