"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import type { Layers } from "./MapView";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

const ALL: Layers = {
  flood: true,
  sos: true,
  resources: true,
  camps: true,
  hospitals: true,
  shelters: true,
  roads: true,
  rivers: true,
  route: true,
};

const LABELS: { key: keyof Layers; label: string; dot: string }[] = [
  { key: "flood", label: "Flood zones", dot: "bg-red-500" },
  { key: "sos", label: "SOS requests", dot: "bg-orange-500" },
  { key: "resources", label: "Rescue resources", dot: "bg-blue-600" },
  { key: "camps", label: "Relief camps", dot: "bg-emerald-500" },
  { key: "hospitals", label: "Hospitals", dot: "bg-violet-500" },
  { key: "shelters", label: "Shelters", dot: "bg-cyan-500" },
  { key: "roads", label: "Blocked roads", dot: "bg-red-800" },
  { key: "rivers", label: "Rivers", dot: "bg-blue-400" },
  { key: "route", label: "Safe route", dot: "bg-emerald-700" },
];

export function MapPanel({
  height = 560,
  center,
  zoom,
  initial,
  showControls = true,
  showIndiaReset = false,
}: {
  height?: number;
  center?: [number, number];
  zoom?: number;
  initial?: Partial<Layers>;
  showControls?: boolean;
  showIndiaReset?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [layers, setLayers] = useState<Layers>({ ...ALL, ...initial });
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-3">
      {showControls && (
        <div className="flex flex-wrap gap-2">
          {LABELS.map((l) => (
            <button
              key={l.key}
              onClick={() => setLayers((s) => ({ ...s, [l.key]: !s[l.key] }))}
              className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                layers[l.key]
                  ? "border-primary/30 bg-primary/8 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground"
              }`}
            >
              <span
                className={`size-2 rounded-full ${l.dot} ${layers[l.key] ? "" : "opacity-30"}`}
              />
              {l.label}
            </button>
          ))}
        </div>
      )}
      <div
        className="overflow-hidden rounded-lg border border-border"
        style={{ height }}
      >
        {mounted ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading OpenStreetMap tiles…
              </div>
            }
          >
            <MapView
              layers={layers}
              height={height}
              center={center}
              zoom={zoom}
              showIndiaReset={showIndiaReset}
            />
          </Suspense>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Initialising GIS canvas…
          </div>
        )}
      </div>
    </div>
  );
}
