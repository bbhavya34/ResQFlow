"use client";

import React from "react";
import {
  BASEMAP_CONFIGS,
  type BasemapId,
  useMapStore,
} from "@/lib/aegis/mapStore";
import { Layers } from "lucide-react";

export const DISPLAY_BASEMAPS: {
  id: BasemapId;
  label: string;
  name: string;
}[] = [
  {
    id: "openfloodgauge",
    label: "Flood",
    name: "OpenFloodGauge Live Flood Extent",
  },
  { id: "topo", label: "Topo", name: "Esri Topo" },
  { id: "terrain", label: "Terrain", name: "Esri Terrain" },
  { id: "osm", label: "OSM", name: "OpenStreetMap" },
];

export interface BasemapSwitcherProps {
  className?: string | undefined;
  onSelect?: ((id: BasemapId) => void) | undefined;
}

/**
 * Leaflet Esri Visual Thumbnail Basemap Switcher matching the screenshot.
 * Positioned in bottom-left corner with thumbnail preview cards, active indicator,
 * and clean layout (shape files option avoided as requested).
 */
export function BasemapSwitcher({
  className = "",
  onSelect,
}: BasemapSwitcherProps) {
  const { activeBasemap, switcherOpen, setActiveBasemap, toggleSwitcherOpen } =
    useMapStore();

  const handleSelect = (id: BasemapId) => {
    setActiveBasemap(id);
    if (onSelect) {
      onSelect(id);
    }
  };

  const activeConfig = BASEMAP_CONFIGS[activeBasemap];
  const selectableLayers = DISPLAY_BASEMAPS.filter(
    (l) => l.id !== activeBasemap,
  );

  return (
    <div
      className={`absolute bottom-6 left-3 z-[1000] flex flex-col gap-2 select-none pointer-events-auto ${className}`}
    >
      {/* Expanded Horizontal Tray */}
      {switcherOpen && (
        <div className="flex items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Active Basemap Selected Highlight Card */}
          <div
            className="relative size-[74px] sm:size-[82px] rounded-lg overflow-hidden border-2 border-white shadow-[0_4px_16px_rgba(0,0,0,0.6)] cursor-pointer group transition-transform active:scale-95"
            style={{
              backgroundImage: `url(${activeConfig.thumbnail})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onClick={toggleSwitcherOpen}
            title={`Active: ${activeConfig.name} (Click to toggle tray)`}
          >
            {/* Dark gradient for text readability */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-3 pb-1 text-center">
              <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide drop-shadow-md">
                {activeConfig.label}
              </span>
            </div>
          </div>

          {/* Selectable basemap options */}
          <div className="bg-white/95 text-slate-800 rounded-xl shadow-2xl border border-slate-200/90 px-3 py-2 flex items-center gap-3.5 backdrop-blur-md">
            {selectableLayers.map((layer) => {
              const config = BASEMAP_CONFIGS[layer.id];
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => handleSelect(layer.id)}
                  className="group flex flex-col items-center gap-1 focus:outline-none transition-transform hover:-translate-y-0.5 active:scale-95"
                  title={config.name}
                >
                  <div
                    className="size-11 sm:size-12 rounded-lg border border-slate-300 group-hover:border-blue-500 shadow-sm overflow-hidden transition-all duration-150 group-hover:shadow-md"
                    style={{
                      backgroundImage: `url(${config.thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: config.previewColor,
                    }}
                  />
                  <span className="text-[11px] font-medium text-sky-600 group-hover:text-sky-800 tracking-tight transition-colors">
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Launcher "Layers" Button */}
      <button
        type="button"
        onClick={toggleSwitcherOpen}
        className="relative size-[64px] sm:size-[68px] rounded-lg overflow-hidden border-2 border-white/80 hover:border-white shadow-xl flex flex-col items-center justify-end pb-1 text-white font-semibold text-[11px] transition-all hover:scale-105 active:scale-95 group focus:outline-none"
        style={{
          backgroundImage: `url(${activeConfig.thumbnail})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        title="Toggle Basemap Layers Tray"
      >
        <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition-colors" />
        <div className="relative z-10 flex items-center gap-1 drop-shadow-md">
          <Layers className="size-3 text-white" />
          <span>Layers</span>
        </div>
      </button>
    </div>
  );
}

export default BasemapSwitcher;
