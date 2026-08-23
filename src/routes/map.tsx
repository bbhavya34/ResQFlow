"use client";

import dynamic from "next/dynamic";
import { definePage } from "@/lib/page-definition";

const MapContainer = dynamic(
  () =>
    import("@/components/aegis/MapContainer").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#04132b] text-slate-400">
        <div className="size-7 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="text-xs font-mono text-slate-300 tracking-widest">
          LOADING MAP…
        </p>
      </div>
    ),
  },
);

export const Route = definePage("/map")({
  head: () => ({
    meta: [
      { title: "Operations Map — ResQFlow" },
      {
        name: "description",
        content:
          "Interactive Esri + Leaflet view of Indian flood zones, SOS requests, rescue resources, relief camps, hospitals and safe routes.",
      },
      {
        property: "og:title",
        content: "Operations Map — ResQFlow",
      },
    ],
  }),
  component: MapPage,
});

export default function MapPage() {
  return (
    /* Fill the entire remaining viewport below the app header */
    <div className="flex h-[calc(100vh-154px)] min-h-[640px] w-full flex-col overflow-hidden">
      <MapContainer
        height="100%"
        className="flex-1 rounded-none border-0"
        showTopBar={true}
        showBasemapSwitcher={false}
      />
    </div>
  );
}
