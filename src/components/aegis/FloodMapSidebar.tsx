"use client";

import { useState } from "react";
import {
  Ambulance,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Hospital,
  Info,
  Layers3,
  MapPin,
  Route,
  ShieldAlert,
  TentTree,
  Waves,
  X,
} from "lucide-react";
import {
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerClose,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  BASEMAP_CONFIGS,
  type OverlayLayers,
  useMapStore,
} from "@/lib/aegis/mapStore";

const LAYERS: {
  key: keyof OverlayLayers;
  label: string;
  icon: typeof Waves;
  color: string;
}[] = [
  { key: "flood", label: "Flood extent", icon: Waves, color: "#1677ff" },
  { key: "sos", label: "SOS hotspots", icon: ShieldAlert, color: "#ef4444" },
  { key: "roads", label: "Road flooded", icon: Route, color: "#f97316" },
  {
    key: "resources",
    label: "Rescue resources",
    icon: Ambulance,
    color: "#2563eb",
  },
  { key: "camps", label: "Relief camps", icon: TentTree, color: "#16a34a" },
  { key: "hospitals", label: "Hospitals", icon: Hospital, color: "#9333ea" },
  { key: "shelters", label: "Shelters", icon: Building2, color: "#0891b2" },
  { key: "rivers", label: "Rivers", icon: Waves, color: "#0284c7" },
  { key: "route", label: "Safe route", icon: MapPin, color: "#059669" },
];

export function FloodMapSidebar({
  showOperationalLayers = true,
}: {
  showOperationalLayers?: boolean;
}) {
  const {
    activeBasemap,
    overlays,
    setActiveBasemap,
    toggleOverlay,
    resetOverlays,
  } = useMapStore();
  const [basemapsOpen, setBasemapsOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [floodedFeaturesOpen, setFloodedFeaturesOpen] = useState(false);
  const activeCount = Object.values(overlays).filter(Boolean).length;

  return (
    <DrawerContent
      aria-label="Map filters"
      className="inset-y-0 right-0 left-auto h-full max-h-none w-full max-w-md gap-0 rounded-l-[10px] rounded-t-none border-slate-300 bg-white p-0 text-slate-800"
    >
      <DrawerHeader className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-5 py-0 text-left">
        <DrawerTitle className="text-lg font-bold tracking-tight">
          {showOperationalLayers ? "Map Filters" : "Basemaps"}
        </DrawerTitle>
        <DrawerClose asChild>
          <button
            type="button"
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close map filters"
          >
            <X className="size-5" />
          </button>
        </DrawerClose>
      </DrawerHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {showOperationalLayers && (
          <section className="border-b border-slate-200">
          <button
            type="button"
            onClick={() => setFloodedFeaturesOpen((value) => !value)}
            className="flex w-full items-center justify-between px-5 py-3 text-left font-semibold hover:bg-slate-50"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-6 place-items-center rounded-sm bg-orange-500 text-[11px] font-black text-white">
                !
              </span>
              <span className="text-sm text-orange-600">192 Flooded Features</span>
            </span>
            {floodedFeaturesOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          {floodedFeaturesOpen && (
            <div className="border-t border-slate-200 px-4 py-3 text-sm">
              <p className="text-slate-600">Flooded areas and critical infrastructure affected by the current flood event.</p>
            </div>
          )}
          </section>
        )}

        <section className="border-b border-slate-200">
          {showOperationalLayers && (
            <button
              type="button"
              onClick={() => setBasemapsOpen((value) => !value)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <Layers3 className="size-4 text-slate-500" />
                Basemaps
              </span>
              {basemapsOpen ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          )}
          {(!showOperationalLayers || basemapsOpen) && (
            <div className={`grid grid-cols-2 gap-2 px-4 ${showOperationalLayers ? "pb-4" : "py-4"}`}>
              {(
                Object.keys(BASEMAP_CONFIGS) as (keyof typeof BASEMAP_CONFIGS)[]
              ).map((id) => {
                const item = BASEMAP_CONFIGS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveBasemap(id)}
                    className={`overflow-hidden rounded border text-left ${activeBasemap === id ? "border-blue-600 ring-1 ring-blue-600" : "border-slate-200"}`}
                  >
                    <span
                      className="block h-12 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${item.thumbnail})`,
                        backgroundColor: item.previewColor,
                      }}
                    />
                    <span className="block truncate bg-white px-2 py-1.5 text-[11px] font-semibold">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {showOperationalLayers && (
          <section>
          <button
            type="button"
            onClick={() => setLayersOpen((value) => !value)}
            className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold hover:bg-slate-50"
          >
            <span>Layers</span>
            {layersOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          {layersOpen && (
            <div className="px-4 pb-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Site layers
              </p>
              <div className="mb-4 border-b border-slate-300 pb-3">
                <label className="mb-1 block text-[10px] text-slate-500">
                  Date
                </label>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="size-4 text-slate-500" />
                  <span>23 Aug 2026</span>
                </div>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Active flood layers
                </p>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {activeCount}
                </span>
              </div>
              <div className="space-y-0.5">
                {LAYERS.map(({ key, label, icon: Icon, color }) => (
                  <label
                    key={key}
                    className="group flex cursor-pointer items-center gap-2.5 rounded px-0.5 py-2 text-[12px] hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={overlays[key]}
                      onChange={() => toggleOverlay(key)}
                      className="size-4 accent-[#1261a0]"
                    />
                    <span
                      className="grid size-6 place-items-center rounded-full border-2 border-slate-800 bg-white"
                      style={{ color }}
                    >
                      <Icon className="size-3.5 stroke-[2.5]" />
                    </span>
                    <span className="font-medium text-slate-700">{label}</span>
                    <Info className="ml-auto size-3.5 text-sky-500 opacity-80" />
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={resetOverlays}
                className="mt-3 w-full rounded border border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Show all active flooding layers
              </button>
            </div>
          )}
          </section>
        )}
      </div>

      <DrawerFooter className="flex items-center gap-2 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">
        <CircleDot className="size-4 text-blue-600" />
        Live operational data · India
      </DrawerFooter>
    </DrawerContent>
  );
}
