import { create } from "zustand";

export type BasemapId = "openfloodgauge" | "topo" | "terrain" | "osm";

export type BasemapConfig = {
  id: BasemapId;
  name: string;
  shortName: string;
  label: string;
  description: string;
  tiles: string;
  thumbnail: string;
  maxzoom: number;
  attribution: string;
  previewColor: string;
};

const OPENFLOODGAUGE_TILE_URL =
  process.env["NEXT_PUBLIC_OPENFLOODGAUGE_TILE_URL"] ??
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";

export const BASEMAP_CONFIGS: Record<BasemapId, BasemapConfig> = {
  openfloodgauge: {
    id: "openfloodgauge",
    name: "OpenFloodGauge Live Flood Extent",
    shortName: "Flood",
    label: "OpenFloodGauge",
    description: "Managed real-time flood extent intelligence overlay",
    tiles: OPENFLOODGAUGE_TILE_URL,
    thumbnail:
      process.env["NEXT_PUBLIC_OPENFLOODGAUGE_TILE_URL"] ??
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/4/7/11",
    maxzoom: 19,
    attribution:
      '<a href="https://openfloodgauge.org" target="_blank" rel="noopener noreferrer">OpenFloodGauge</a>',
    previewColor: "#bae6fd",
  },
  topo: {
    id: "topo",
    name: "Esri World Topo Map",
    shortName: "Topo",
    label: "Topo",
    description: "Topographical terrain, elevation contours & hillshading",
    tiles:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    thumbnail:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/4/7/11",
    maxzoom: 19,
    attribution:
      'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">Esri</a>',
    previewColor: "#e6f4ea",
  },
  terrain: {
    id: "terrain",
    name: "Esri World Terrain Base",
    shortName: "Terrain",
    label: "Terrain",
    description: "Shaded relief and elevation landforms",
    tiles:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
    thumbnail:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/4/7/11",
    maxzoom: 13,
    attribution:
      'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">Esri</a> &mdash; USGS, NOAA',
    previewColor: "#f4f1ea",
  },
  osm: {
    id: "osm",
    name: "OpenStreetMap Standard",
    shortName: "OSM",
    label: "OSM",
    description: "Community mapped roads, paths, and points of interest",
    tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    thumbnail: "https://tile.openstreetmap.org/4/11/7.png",
    maxzoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    previewColor: "#e2e8f0",
  },
};

export type OverlayLayers = {
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

export const DEFAULT_OVERLAY_LAYERS: OverlayLayers = {
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

interface MapState {
  activeBasemap: BasemapId;
  overlays: OverlayLayers;
  switcherOpen: boolean;
  cursorCoordinates: { lat: number; lng: number };
  setActiveBasemap: (id: BasemapId) => void;
  setSwitcherOpen: (open: boolean) => void;
  toggleSwitcherOpen: () => void;
  setCursorCoordinates: (coords: { lat: number; lng: number }) => void;
  toggleOverlay: (layerKey: keyof OverlayLayers) => void;
  setOverlays: (overlays: Partial<OverlayLayers>) => void;
  resetOverlays: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  activeBasemap: "openfloodgauge",
  overlays: DEFAULT_OVERLAY_LAYERS,
  switcherOpen: false,
  cursorCoordinates: { lat: 36.97128, lng: 51.47111 },
  setActiveBasemap: (id: BasemapId) => set({ activeBasemap: id }),
  setSwitcherOpen: (open: boolean) => set({ switcherOpen: open }),
  toggleSwitcherOpen: () =>
    set((state) => ({ switcherOpen: !state.switcherOpen })),
  setCursorCoordinates: (coords) => set({ cursorCoordinates: coords }),
  toggleOverlay: (layerKey) =>
    set((state) => ({
      overlays: {
        ...state.overlays,
        [layerKey]: !state.overlays[layerKey],
      },
    })),
  setOverlays: (newOverlays) =>
    set((state) => ({
      overlays: {
        ...state.overlays,
        ...newOverlays,
      },
    })),
  resetOverlays: () => set({ overlays: DEFAULT_OVERLAY_LAYERS }),
}));
