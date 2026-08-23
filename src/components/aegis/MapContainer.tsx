"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  BASEMAP_CONFIGS,
  type BasemapId,
  type OverlayLayers,
  useMapStore,
} from "@/lib/aegis/mapStore";
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
import { BasemapSwitcher } from "./BasemapSwitcher";
import {
  Plus,
  Minus,
  Maximize2,
  RefreshCw,
  Menu,
  ChevronDown,
  AlertTriangle,
  X,
} from "lucide-react";
import { FloodMapSidebar } from "./FloodMapSidebar";

// India default center [lat, lng]
const INDIA_CENTER: [number, number] = [22.5, 79.0];
const INDIA_DEFAULT_ZOOM = 4.5;
// Precise bounds: J&K (north) to Kanyakumari (south)
const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [6.4, 68.1], // SW — Kanyakumari / Arabian Sea edge
  [37.6, 97.4], // NE — Ladakh / Arunachal
];

type PointAlert = {
  title: string;
  severity: string;
  detail: string;
  coordinates: [number, number];
};

export interface MapContainerProps {
  center?: [number, number] | undefined;
  zoom?: number | undefined;
  height?: number | string | undefined;
  className?: string | undefined;
  layers?: Partial<OverlayLayers> | undefined;
  showTopBar?: boolean | undefined;
  showBasemapSwitcher?: boolean | undefined;
  onMapLoaded?: ((map: L.Map) => void) | undefined;
}

function createCircleCoordinates(
  lat: number,
  lng: number,
  radiusKm: number,
  points = 48,
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    pts.push([
      lat + (radiusKm / 111) * Math.sin(a),
      lng + (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a),
    ]);
  }
  return pts;
}

export function MapContainer({
  center = INDIA_CENTER,
  zoom = INDIA_DEFAULT_ZOOM,
  height = 620,
  className = "",
  layers: layerProps,
  showTopBar = false,
  showBasemapSwitcher = true,
  onMapLoaded,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlaysLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pointAlert, setPointAlert] = useState<PointAlert | null>(null);

  const {
    activeBasemap,
    overlays: storeOverlays,
    cursorCoordinates,
    setOverlays,
    setCursorCoordinates,
  } = useMapStore();
  const { sosList, resources } = useAegis();

  const activeLayers = useMemo<OverlayLayers>(
    () => ({ ...storeOverlays, ...(layerProps || {}) }),
    [layerProps, storeOverlays],
  );
  const initialMapSettingsRef = useRef({
    activeBasemap,
    center,
    onMapLoaded,
    setCursorCoordinates,
    zoom,
  });

  /**
   * Reset view to center of India
   */
  const handleResetToIndia = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(INDIA_BOUNDS, {
        padding: [10, 10],
        animate: true,
      });
    }
  }, []);

  /**
   * Zoom controls
   */
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomOut();
  }, []);

  /**
   * Refresh handler
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    if (mapRef.current) {
      mapRef.current.closePopup();
      mapRef.current.fitBounds(INDIA_BOUNDS, {
        padding: [10, 10],
        animate: true,
        duration: 0.8,
      });
      mapRef.current.invalidateSize();
    }
    setPointAlert(null);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  useEffect(() => {
    const resizeTimer = window.setTimeout(() => {
      mapRef.current?.invalidateSize({ animate: false });
    }, 220);
    return () => window.clearTimeout(resizeTimer);
  }, [sidebarOpen]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    let resizeFrame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        mapRef.current?.invalidateSize({ animate: false });
      });
    });

    observer.observe(container);
    return () => {
      window.cancelAnimationFrame(resizeFrame);
      observer.disconnect();
    };
  }, []);

  // Sync props layers to store
  useEffect(() => {
    if (layerProps) {
      setOverlays(layerProps);
    }
  }, [layerProps, setOverlays]);

  /**
   * Initialize Leaflet map instance
   */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const initialSettings = initialMapSettingsRef.current;

    // Create Leaflet map — use fitBounds for full India view
    const map = L.map(mapContainerRef.current, {
      center: initialSettings.center,
      zoom: initialSettings.zoom,
      zoomControl: false, // We use custom top-left buttons (+, −, [])
      attributionControl: false, // Custom attribution control below
    });

    // Fit precisely to India extent (J&K → Kanyakumari)
    map.fitBounds(INDIA_BOUNDS, { padding: [10, 10], animate: false });

    // Custom attribution matching screenshot style (🇺🇦 Leaflet | Tiles © Esri)
    L.control
      .attribution({
        position: "bottomright",
        prefix: '<span title="A web map library">🇺🇦 Leaflet</span>',
      })
      .addTo(map);

    // Initial base TileLayer
    const initialConfig = BASEMAP_CONFIGS[initialSettings.activeBasemap];
    const tileLayer = L.tileLayer(initialConfig.tiles, {
      maxZoom: initialConfig.maxzoom,
      attribution: initialConfig.attribution,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Layer group for all overlays so base layer switching never deletes overlays
    const overlaysGroup = L.layerGroup().addTo(map);
    overlaysLayerGroupRef.current = overlaysGroup;

    // Mouse movement listener for top-right coordinate display
    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      initialSettings.setCursorCoordinates({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5)),
      });
    });

    mapRef.current = map;

    // Dashboard grids can finish sizing after Leaflet's first measurement.
    // Recalculate the viewport and tile grid after each early layout phase so
    // the basemap fills the complete panel instead of rendering a single row.
    const syncMapLayout = () => {
      if (!mapContainerRef.current?.isConnected) return;
      map.invalidateSize({ animate: false, pan: false });
      tileLayer.redraw();
      map.fitBounds(INDIA_BOUNDS, { padding: [10, 10], animate: false });
    };
    const layoutFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(syncMapLayout);
    });
    const layoutTimers = [100, 350, 900].map((delay) =>
      window.setTimeout(syncMapLayout, delay),
    );

    if (initialSettings.onMapLoaded) {
      initialSettings.onMapLoaded(map);
    }

    return () => {
      window.cancelAnimationFrame(layoutFrame);
      layoutTimers.forEach((timer) => window.clearTimeout(timer));
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /**
   * Switch Esri / Leaflet Basemap tile layer smoothly without affecting overlays
   */
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const config = BASEMAP_CONFIGS[activeBasemap];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(config.tiles, {
      maxZoom: config.maxzoom,
      attribution: config.attribution,
    });

    // Insert tile layer at back (zIndex 1) so overlays stay strictly on top
    newTileLayer.setZIndex(1);
    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [activeBasemap]);

  /**
   * Render and update all GIS overlays and Hotspot pins
   */
  useEffect(() => {
    if (!mapRef.current || !overlaysLayerGroupRef.current) return;
    const group = overlaysLayerGroupRef.current;
    group.clearLayers();

    // 1. FLOOD ZONES
    if (activeLayers.flood) {
      FLOOD_ZONES.forEach((z) => {
        const color =
          z.risk === "SEVERE"
            ? "#dc2626"
            : z.risk === "HIGH"
              ? "#ea8a04"
              : "#0d9488";

        const poly = L.polygon(
          createCircleCoordinates(z.lat, z.lng, z.radiusKm),
          {
            color,
            fillColor: color,
            fillOpacity: 0.2,
            weight: 2,
          },
        );

        poly.bindPopup(`
          <div class="p-2.5 text-xs text-slate-100 bg-[#0f172a] rounded-md border border-slate-700 shadow-xl space-y-1">
            <div class="flex items-center justify-between border-b border-slate-700/80 pb-1">
              <span class="font-bold text-amber-400">${z.name}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">${z.risk}</span>
            </div>
            <div class="text-slate-200">${z.river} River &middot; ${z.state}</div>
            <div class="text-slate-300">Probability: <span class="font-mono text-cyan-400">${Math.round(z.probability * 100)}%</span> &middot; Radius: ${z.radiusKm} km</div>
            <div class="text-[11px] text-slate-400 mt-1 italic">${z.forecast}</div>
          </div>
        `);
        poly.on("click", () => {
          mapRef.current?.flyTo([z.lat, z.lng], 9, { duration: 0.8 });
          setPointAlert({
            title: z.name,
            severity: z.risk,
            detail: `${z.river} River · ${Math.round(z.probability * 100)}% flood probability · ${z.forecast}`,
            coordinates: [z.lat, z.lng],
          });
        });
        group.addLayer(poly);
      });
    }

    // 2. RIVERS
    if (activeLayers.rivers) {
      RIVERS.forEach((r) => {
        const line = L.polyline(r.path, {
          color: "#38bdf8",
          weight: 3.5,
          opacity: 0.75,
        });
        line.bindTooltip(`${r.name} River`, { sticky: true });
        group.addLayer(line);
      });
    }

    // 3. BLOCKED ROADS
    if (activeLayers.roads) {
      BLOCKED_ROADS.forEach((r) => {
        const line = L.polyline(r.path, {
          color: "#ef4444",
          weight: 4,
          dashArray: "6, 6",
        });
        line.bindPopup(`
          <div class="p-2 text-xs text-slate-100 bg-[#0f172a] rounded-md border border-slate-700 shadow-xl">
            <div class="font-bold text-red-400">Blocked: ${r.name}</div>
            <div class="text-slate-300 text-[11px] mt-0.5">${r.reason}</div>
          </div>
        `);
        group.addLayer(line);
      });
    }

    // 4. SAFE ROUTE
    if (activeLayers.route) {
      const routeLine = L.polyline(SAFE_ROUTE.path, {
        color: "#10b981",
        weight: 5,
        opacity: 0.95,
      });
      routeLine.bindPopup(`
        <div class="p-2 text-xs text-slate-100 bg-[#0f172a] rounded-md border border-slate-700 shadow-xl">
          <div class="font-bold text-emerald-400">Safe Route ${SAFE_ROUTE.resourceId} &rarr; SOS ${SAFE_ROUTE.sosId}</div>
          <div class="text-slate-300 text-[11px] mt-0.5">Distance: ${SAFE_ROUTE.km} km &middot; ETA: ${SAFE_ROUTE.etaMin} mins</div>
        </div>
      `);
      group.addLayer(routeLine);
    }

    // 5. RELIEF CAMPS (Green circle pins with white borders like screenshot)
    if (activeLayers.camps) {
      CAMPS.forEach((c) => {
        const campMarker = L.circleMarker([c.lat, c.lng], {
          radius: 9,
          color: "#ffffff",
          fillColor: "#22c55e",
          fillOpacity: 1,
          weight: 2.5,
        });

        campMarker.bindPopup(`
          <div class="p-2.5 text-xs text-slate-100 bg-[#0f172a] rounded-md border border-slate-700 shadow-xl space-y-1">
            <div class="flex items-center justify-between border-b border-slate-700/80 pb-1">
              <span class="font-bold text-emerald-400">${c.name}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">${c.status}</span>
            </div>
            <div class="text-slate-300">Occupancy: <span class="font-bold text-slate-100">${c.occupancy}</span> / ${c.capacity}</div>
            <div class="text-slate-400 text-[11px]">Food ration: ${c.foodDays} days &middot; Potable water: ${c.waterDays} days</div>
          </div>
        `);
        campMarker.on("click", () => {
          mapRef.current?.flyTo([c.lat, c.lng], 12, { duration: 0.8 });
          setPointAlert({
            title: c.name,
            severity: c.status === "CRITICAL" ? "CRITICAL" : "RELIEF CAMP",
            detail: `${c.occupancy} of ${c.capacity} places occupied · Food ${c.foodDays} days · Water ${c.waterDays} days`,
            coordinates: [c.lat, c.lng],
          });
        });
        group.addLayer(campMarker);
      });
    }

    // 6. SOS HOTSPOT PINS (Red / Coral circle pins with white borders like screenshot)
    if (activeLayers.sos) {
      sosList.forEach((s) => {
        const score = priorityScore(s.factors);
        const band = priorityBand(score);
        const color =
          band.tone === "critical"
            ? "#ef4444"
            : band.tone === "high"
              ? "#f97316"
              : "#0d9488";

        // Outer pulse circle
        const pulse = L.circleMarker([s.lat, s.lng], {
          radius: 15,
          color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 1,
        });
        group.addLayer(pulse);

        // Core marker with white border
        const marker = L.circleMarker([s.lat, s.lng], {
          radius: 9,
          color: "#ffffff",
          fillColor: color,
          fillOpacity: 1,
          weight: 2.5,
        });

        marker.bindPopup(`
          <div class="p-2.5 text-xs text-slate-100 bg-[#0f172a] rounded-md border border-slate-700 shadow-xl space-y-1">
            <div class="flex items-center justify-between border-b border-slate-700/80 pb-1">
              <span class="font-bold text-red-400">SOS ${s.id}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-800">${band.label} (${score}/100)</span>
            </div>
            <div class="font-medium text-slate-200">${s.place}, ${s.district}</div>
            <div class="text-slate-300">${s.people} people &middot; ${s.livestock} livestock &middot; ${s.floodDepthM}m depth</div>
            <div class="text-slate-400 text-[11px]">Channel: <span class="text-cyan-400 font-mono">${s.channel}</span> &middot; Status: <span class="text-amber-400 font-semibold">${s.status}</span></div>
            ${s.notes ? `<div class="mt-1 p-1 bg-slate-900 rounded text-[10.5px] text-slate-300 border border-slate-800">${s.notes}</div>` : ""}
          </div>
        `);
        marker.on("click", () => {
          mapRef.current?.flyTo([s.lat, s.lng], 13, { duration: 0.8 });
          setPointAlert({
            title: `SOS ${s.id} · ${s.place}`,
            severity: `${band.label.toUpperCase()} · ${score}/100`,
            detail: `${s.people} people at risk · ${s.floodDepthM}m flood depth · Status ${s.status}`,
            coordinates: [s.lat, s.lng],
          });
        });
        group.addLayer(marker);
      });
    }

    // 7. RESCUE RESOURCES
    if (activeLayers.resources) {
      resources.forEach((r) => {
        const resMarker = L.circleMarker([r.lat, r.lng], {
          radius: 8,
          color: "#ffffff",
          fillColor: r.availability === "AVAILABLE" ? "#2563eb" : "#64748b",
          fillOpacity: 1,
          weight: 2,
        });

        resMarker.bindPopup(`
          <div class="p-2.5 text-xs text-slate-100 bg-[#0f172a] rounded-md border border-slate-700 shadow-xl space-y-1">
            <div class="flex items-center justify-between border-b border-slate-700/80 pb-1">
              <span class="font-bold text-blue-400">${r.name} (${r.id})</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono ${r.availability === "AVAILABLE" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-slate-800 text-slate-400"}">${r.availability}</span>
            </div>
            <div class="text-slate-200">${r.agency} &middot; Base: ${r.base}</div>
            <div class="text-slate-300">Capacity: ${r.capacity} persons &middot; ${r.category}</div>
          </div>
        `);
        resMarker.on("click", () => {
          mapRef.current?.flyTo([r.lat, r.lng], 13, { duration: 0.8 });
          setPointAlert({
            title: `${r.name} · ${r.id}`,
            severity: r.availability,
            detail: `${r.agency} · Capacity ${r.capacity} people · Base ${r.base}`,
            coordinates: [r.lat, r.lng],
          });
        });
        group.addLayer(resMarker);
      });
    }

    // 8. FACILITIES
    if (activeLayers.hospitals || activeLayers.shelters) {
      FACILITIES.filter(
        (f) =>
          (f.kind === "HOSPITAL" && activeLayers.hospitals) ||
          (f.kind === "SHELTER" && activeLayers.shelters),
      ).forEach((f) => {
        const facMarker = L.circleMarker([f.lat, f.lng], {
          radius: 7,
          color: "#ffffff",
          fillColor: f.kind === "HOSPITAL" ? "#a855f7" : "#06b6d4",
          fillOpacity: 1,
          weight: 2,
        });

        facMarker.bindPopup(`
          <div class="p-2.5 text-xs text-slate-100 bg-[#0f172a] rounded-md border border-slate-700 shadow-xl space-y-1">
            <div class="font-bold ${f.kind === "HOSPITAL" ? "text-violet-400" : "text-cyan-400"}">${f.name}</div>
            <div class="text-slate-300 text-[11px]">${f.kind} &middot; ${f.detail}</div>
          </div>
        `);
        facMarker.on("click", () => {
          mapRef.current?.flyTo([f.lat, f.lng], 13, { duration: 0.8 });
          setPointAlert({
            title: f.name,
            severity: f.kind,
            detail: f.detail,
            coordinates: [f.lat, f.lng],
          });
        });
        group.addLayer(facMarker);
      });
    }
  }, [activeLayers, sosList, resources]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border border-slate-700/80 bg-[#04132b] flex flex-col shadow-2xl ${className}`}
      style={{ height }}
    >
      {showTopBar && (
        <div className="flex h-[54px] shrink-0 items-center bg-[#062f55] text-white shadow-md">
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="grid h-full w-14 place-items-center border-r border-white/10 hover:bg-white/10"
            aria-label="Toggle map filters"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 items-center gap-3 px-4">
            <span className="grid size-8 place-items-center rounded-full bg-white/10 text-lg">
              ≋
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold sm:text-base">
                Real-Time Flood Impact Map
              </p>
              <p className="hidden text-[9px] uppercase tracking-[0.18em] text-sky-200 sm:block">
                ResQFlow
              </p>
            </div>
          </div>
          <div className="ml-auto flex h-full items-center">
            <div className="hidden border-l border-white/10 px-4 text-right md:block">
              <p className="text-[10px] text-sky-200">Map position</p>
              <p className="font-mono text-[11px]">
                {cursorCoordinates.lat.toFixed(4)},{" "}
                {cursorCoordinates.lng.toFixed(4)}
              </p>
            </div>
            <button
              type="button"
              className="flex h-full items-center gap-1 border-l border-white/10 px-4 text-xs font-semibold hover:bg-white/10"
            >
              English <ChevronDown className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {showTopBar && (
          <FloodMapSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        {showTopBar && sidebarOpen && (
          <button
            type="button"
            aria-label="Close map filters"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-[1050] bg-slate-950/30 lg:hidden"
          />
        )}

        {/* Leaflet Canvas Container */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div ref={mapContainerRef} className="absolute inset-0 z-0" />

          {pointAlert && (
            <div
              role="alert"
              aria-live="assertive"
              className="absolute left-1/2 top-3 z-[1200] w-[calc(100%-7rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-red-300 bg-white text-slate-900 shadow-[0_12px_35px_rgba(127,29,29,0.35)]"
            >
              <div className="flex items-center gap-2 bg-red-600 px-3 py-2 text-white">
                <AlertTriangle className="size-4 shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-[0.12em]">
                  Critical point notification
                </span>
                <span className="ml-auto rounded bg-white/15 px-2 py-0.5 text-[10px] font-bold">
                  {pointAlert.severity}
                </span>
                <button
                  type="button"
                  onClick={() => setPointAlert(null)}
                  className="grid size-6 place-items-center rounded hover:bg-white/15"
                  aria-label="Dismiss point notification"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-bold">{pointAlert.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {pointAlert.detail}
                </p>
                <p className="mt-2 font-mono text-[10px] text-slate-400">
                  {pointAlert.coordinates[0].toFixed(5)},{" "}
                  {pointAlert.coordinates[1].toFixed(5)}
                </p>
              </div>
            </div>
          )}

          {/* Top-Left Stacked White Navigation Controls (+, −, []) */}
          <div className="absolute top-3 left-3 z-[1000] flex flex-col rounded shadow-md overflow-hidden bg-white border border-slate-300 pointer-events-auto select-none">
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
              className="size-8 flex items-center justify-center text-slate-800 hover:bg-slate-100 border-b border-slate-200 font-bold transition-colors"
            >
              <Plus className="size-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
              className="size-8 flex items-center justify-center text-slate-800 hover:bg-slate-100 border-b border-slate-200 font-bold transition-colors"
            >
              <Minus className="size-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleResetToIndia}
              aria-label="Reset India View"
              title="Reset to India view"
              className="size-8 flex items-center justify-center text-slate-800 hover:bg-slate-100 border-b border-slate-200 transition-colors"
            >
              <Maximize2 className="size-3.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh map"
              title="Refresh map data"
              className="size-8 flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw
                className={`size-3.5 stroke-[2.5] ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Bottom-Left Visual Basemap Switcher (Avoids shape files option) */}
          {showBasemapSwitcher && <BasemapSwitcher />}

          {/* Map Legend — color-coded layer key */}
          <div className="absolute bottom-10 right-2 z-[1000] pointer-events-none select-none">
            <div className="bg-[#04132b]/92 backdrop-blur-sm border border-slate-700/70 rounded-lg px-3 py-2 shadow-xl text-[10px] leading-relaxed">
              <p className="text-slate-400 font-semibold uppercase tracking-widest mb-1.5 text-[9px]">
                Layer Legend
              </p>
              <div className="space-y-1">
                {[
                  { color: "#ef4444", label: "Flood zones" },
                  { color: "#f97316", label: "SOS requests" },
                  { color: "#3b82f6", label: "Rescue resources" },
                  { color: "#22c55e", label: "Relief camps" },
                  { color: "#a855f7", label: "Hospitals" },
                  { color: "#06b6d4", label: "Shelters" },
                  { color: "#991b1b", label: "Blocked roads" },
                  { color: "#60a5fa", label: "Rivers" },
                  { color: "#16a34a", label: "Safe route" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span
                      className="shrink-0 size-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-slate-200">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scale Bar Badge */}
          <div className="absolute bottom-2 left-2 z-[999] pointer-events-none">
            <div className="bg-white/95 text-slate-800 border border-slate-400 text-[10px] font-mono font-semibold px-1.5 py-0.5 shadow-sm rounded">
              500 km
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapContainer;
