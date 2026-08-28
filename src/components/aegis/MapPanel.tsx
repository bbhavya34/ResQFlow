"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { OverlayLayers } from "@/lib/aegis/mapStore";

const MapContainer = dynamic(
  () => import("./MapContainer").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#04132b] text-sm text-slate-400">
        Loading map…
      </div>
    ),
  },
);

const ALL: OverlayLayers = {
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

export function MapPanel({
  height = 560,
  center,
  zoom,
  initial,
  showBasemapSwitcher = true,
  className = "",
}: {
  height?: number;
  center?: [number, number];
  zoom?: number;
  initial?: Partial<OverlayLayers>;
  showBasemapSwitcher?: boolean;
  className?: string;
}) {
  const [layers] = useState<OverlayLayers>({ ...ALL, ...initial });

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height, minHeight: height }}
    >
      <MapContainer
        layers={layers}
        height="100%"
        center={center}
        zoom={zoom}
        showBasemapSwitcher={showBasemapSwitcher}
        showTopBar={false}
        showOperationalLayers={false}
        className="absolute inset-0 rounded-none border-0"
      />
    </div>
  );
}

export default MapPanel;
