"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Camp, Resource, SOS } from "@/lib/aegis/data";

export function ReliefCampMap({
  camps,
  sos,
  vehicle,
  selectedCampId,
  height = 420,
}: {
  camps: Camp[];
  sos?: SOS | undefined;
  vehicle?: Resource | undefined;
  selectedCampId?: string | undefined;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles © Esri",
      },
    ).addTo(map);

    const availableCamps = camps.filter(
      (camp) => camp.occupancy < camp.capacity,
    );
    const routeCamp =
      camps.find((camp) => camp.id === selectedCampId) ?? availableCamps[0];
    const bounds: L.LatLngTuple[] = [];

    camps.forEach((camp) => {
      const availableBeds = Math.max(0, camp.capacity - camp.occupancy);
      const isSelected = camp.id === routeCamp?.id && Boolean(sos);
      const isAvailable = availableBeds > 0;
      const color = !isAvailable
        ? "#dc2626"
        : camp.status === "STRAINED"
          ? "#f59e0b"
          : "#16a34a";

      const marker = L.circleMarker([camp.lat, camp.lng], {
        radius: isSelected ? 12 : 9,
        color: isSelected ? "#0f172a" : "#ffffff",
        fillColor: color,
        fillOpacity: 1,
        weight: isSelected ? 4 : 2.5,
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-3 text-xs text-slate-100 bg-[#0f172a] min-w-[220px]">
          <div class="font-bold text-emerald-400">${camp.name}</div>
          <div class="mt-1 text-slate-300">${camp.district}, ${camp.state}</div>
          <div class="mt-2 border-t border-slate-700 pt-2">Occupancy: <strong>${camp.occupancy}/${camp.capacity}</strong></div>
          <div class="text-slate-300">Available places: <strong class="${isAvailable ? "text-emerald-400" : "text-red-400"}">${availableBeds}</strong></div>
          <div class="text-slate-400">Food ${camp.foodDays} days · Water ${camp.waterDays} days · ${camp.medicalStaff} medics</div>
        </div>
      `);
      bounds.push([camp.lat, camp.lng]);
    });

    const abortController = new AbortController();

    if (sos) {
      const sosMarker = L.circleMarker([sos.lat, sos.lng], {
        radius: 10,
        color: "#ffffff",
        fillColor: "#ef4444",
        fillOpacity: 1,
        weight: 3,
      }).addTo(map);
      sosMarker.bindPopup(`
        <div class="p-3 text-xs text-slate-100 bg-[#0f172a]">
          <div class="font-bold text-red-400">SOS ${sos.id}</div>
          <div class="mt-1">${sos.place}</div>
          <div class="text-slate-300">${sos.people} people · ${sos.floodDepthM}m depth</div>
        </div>
      `);

      if (routeCamp) {
        const routePoints: L.LatLngTuple[] = vehicle
          ? [
              [vehicle.lat, vehicle.lng],
              [sos.lat, sos.lng],
              [routeCamp.lat, routeCamp.lng],
            ]
          : [
              [sos.lat, sos.lng],
              [routeCamp.lat, routeCamp.lng],
            ];

        if (vehicle) {
          const vehicleMarker = L.circleMarker([vehicle.lat, vehicle.lng], {
            radius: 10,
            color: "#ffffff",
            fillColor: "#2563eb",
            fillOpacity: 1,
            weight: 3,
          }).addTo(map);
          vehicleMarker.bindPopup(`
            <div class="p-3 text-xs text-slate-100 bg-[#0f172a]">
              <div class="font-bold text-blue-400">${vehicle.name}</div>
              <div class="mt-1">${vehicle.id} · ${vehicle.type}</div>
              <div class="text-slate-300">${vehicle.agency} · Capacity ${vehicle.capacity}</div>
            </div>
          `);
        }

        const fallbackRoute = L.polyline(routePoints, {
          color: "#10b981",
          weight: 5,
          opacity: 0.85,
          dashArray: "10, 7",
        }).addTo(map);
        fallbackRoute.bindTooltip(`Vehicle route to ${routeCamp.name}`, {
          sticky: true,
        });
        map.fitBounds(routePoints, { padding: [55, 55] });

        const coordinates = routePoints
          .map(([lat, lng]) => `${lng},${lat}`)
          .join(";");
        void fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`,
          { signal: abortController.signal },
        )
          .then((response) => {
            if (!response.ok) throw new Error("Vehicle route unavailable");
            return response.json() as Promise<{
              code: string;
              routes?: Array<{
                distance: number;
                duration: number;
                geometry: { coordinates: [number, number][] };
              }>;
            }>;
          })
          .then((result) => {
            const roadRoute = result.routes?.[0];
            if (result.code !== "Ok" || !roadRoute) return;
            fallbackRoute.remove();
            const roadPoints: L.LatLngTuple[] =
              roadRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            const roadLine = L.polyline(roadPoints, {
              color: "#10b981",
              weight: 5,
              opacity: 0.95,
            }).addTo(map);
            roadLine.bindTooltip(
              `Vehicle route · ${(roadRoute.distance / 1000).toFixed(1)} km · ${Math.ceil(roadRoute.duration / 60)} min`,
              { sticky: true },
            );
            map.fitBounds(roadLine.getBounds(), { padding: [45, 45] });
          })
          .catch(() => {
            // Keep the visible dashed direct corridor when road routing is offline.
          });
      }
    } else if (selectedCampId && routeCamp) {
      map.setView([routeCamp.lat, routeCamp.lng], 11);
    } else if (bounds.length) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 6 });
    } else {
      map.setView([22.5, 79], 5);
    }

    mapRef.current = map;
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 200);
    return () => {
      abortController.abort();
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, [camps, selectedCampId, sos, vehicle]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-md border border-border"
      style={{ height }}
    />
  );
}

export default ReliefCampMap;
