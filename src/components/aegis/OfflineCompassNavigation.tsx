"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAegis } from "@/lib/aegis/store";
import {
  syncCampsFromDatabase,
  getCachedSafehouses,
  type Safehouse,
} from "@/lib/offlineStore";
import {
  calculateNearestSafehouse,
  type RoutingResult,
} from "@/lib/offlineRouting";
import { generateCAP12Alert } from "@/lib/capGenerator";
import {
  Compass,
  Radio,
  MapPin,
  AlertOctagon,
  FileCode2,
  Copy,
  Check,
  Database,
  Users,
  MessageSquare,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  Wifi,
  WifiOff,
  Navigation,
} from "lucide-react";

export function OfflineCompassNavigation() {
  const { camps, addSOS, online } = useAegis();
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [routeResult, setRouteResult] = useState<RoutingResult | null>(null);
  const [cachedSafehouses, setCachedSafehouses] = useState<Safehouse[]>([]);
  const [safehouseCount, setSafehouseCount] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>("Initializing GPS & Secure Local Store...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [capXml, setCapXml] = useState<string | null>(null);
  const [showCapModal, setShowCapModal] = useState<boolean>(false);
  const [showDirectory, setShowDirectory] = useState<boolean>(false);
  const [sosSentSuccess, setSosSentSuccess] = useState<boolean>(false);
  const [copiedSMS, setCopiedSMS] = useState<boolean>(false);
  const [copiedXml, setCopiedXml] = useState<boolean>(false);

  // 1. Sync Live Database Camps into IndexedDB Cache & Register SW
  useEffect(() => {
    async function syncDatabase() {
      try {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.register("/sw.js").catch((err) => {
            console.warn("SW registration:", err);
          });
        }

        if (camps && camps.length > 0) {
          const count = await syncCampsFromDatabase(camps);
          setSafehouseCount(count);
          const all = await getCachedSafehouses();
          setCachedSafehouses(all);
          setStatusMsg(`Synchronized ${count} registered relief facilities.`);
        } else {
          const cached = await getCachedSafehouses();
          setSafehouseCount(cached.length);
          setCachedSafehouses(cached);
          setStatusMsg(`Loaded ${cached.length} facilities from local offline cache.`);
        }
      } catch (err: unknown) {
        console.error("Store sync error:", err);
      }
    }
    syncDatabase();
  }, [camps]);

  // 2. Process GPS update through Turf offline routing
  const handlePositionUpdate = useCallback(
    async (lat: number, lng: number, acc?: number) => {
      setUserPos({ lat, lng });
      if (acc !== undefined) setAccuracy(acc);
      setErrorMsg(null);

      try {
        const result = await calculateNearestSafehouse(lat, lng);
        setRouteResult(result);
        setStatusMsg(`Locked: ${result.name} · Vector: ${result.distanceKm} km @ ${result.bearingAngle}° ${result.cardinalHeading}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Routing calculation error";
        setErrorMsg(message);
      }
    },
    [],
  );

  // 3. Hardware GPS Watcher
  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Hardware GNSS receiver unavailable. Falling back to telemetry simulation.");
      simulatePosition(13.0827, 80.2707);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setIsSimulated(false);
        handlePositionUpdate(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy,
        );
      },
      (err) => {
        console.warn("GPS watch position note:", err.message);
        setStatusMsg("Live GNSS signal degraded or permission restricted. Operating on telemetry simulator.");
        simulatePosition(13.0827, 80.2707);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [handlePositionUpdate]);

  const simulatePosition = (lat: number, lng: number) => {
    setIsSimulated(true);
    handlePositionUpdate(lat, lng, 5);
  };

  // 4. Trigger High Priority System SOS Notification
  const triggerSOSAlert = () => {
    if (!routeResult) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Register into central command queue
    if (userPos && routeResult) {
      addSOS({
        id: `SOS-OFFLINE-${Date.now().toString().slice(-4)}`,
        channel: "APP",
        lat: userPos.lat,
        lng: userPos.lng,
        place: routeResult.safehouse?.district ? `${routeResult.safehouse.district} Sector` : "Offline Distress Coordinates",
        district: routeResult.safehouse?.district || "Command Sector",
        state: routeResult.safehouse?.state || "National",
        people: 1,
        children: 0,
        elderly: 0,
        disabled: 0,
        livestock: 0,
        floodDepthM: 1.5,
        medical: false,
        receivedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "NEW",
        factors: [
          { label: "Hardware GNSS Beacon", value: 19, max: 20, note: `Nearest Facility: ${routeResult.name} (${routeResult.distanceKm} km)` },
          { label: "Immediate Evacuation", value: 16, max: 20, note: "Field operator / citizen distress beacon" }
        ],
        notes: `Offline SOS registered. Target safehouse: ${routeResult.name} (${routeResult.distanceKm} km, heading ${routeResult.cardinalHeading} ${routeResult.bearingAngle}°).`
      });
      setSosSentSuccess(true);
      setTimeout(() => setSosSentSuccess(false), 6000);
    }

    // Service Worker OS Notification
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "TRIGGER_OFFLINE_FLOOD_SOS",
        payload: {
          name: routeResult.name,
          distanceKm: routeResult.distanceKm,
          cardinalHeading: routeResult.cardinalHeading,
          bearingAngle: routeResult.bearingAngle,
        },
      });
    }

    // Generate CAP 1.2 XML Alert
    const xml = generateCAP12Alert({
      senderId: "qflow.resqflow.in",
      headline: `FLOOD RESCUE DISPATCH: Evacuation Vector to ${routeResult.name}`,
      description: `Displaced individual at GNSS coordinates [${userPos?.lat.toFixed(4)}, ${userPos?.lng.toFixed(4)}]. Nearest safe relief facility is ${routeResult.name} at direct distance ${routeResult.distanceKm} km, heading ${routeResult.cardinalHeading} (${routeResult.bearingAngle}° azimuth).`,
      areaPolygon: [
        [13.20, 80.18],
        [13.20, 80.30],
        [13.12, 80.30],
        [13.12, 80.18],
        [13.20, 80.18],
      ],
      severity: "Extreme",
      urgency: "Immediate",
    });

    setCapXml(xml);
  };

  const emergencySMSText = userPos && routeResult
    ? `EMERGENCY SOS: Flood distress at [${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}]. Navigating to ${routeResult.name} (${routeResult.distanceKm}km, Heading ${routeResult.cardinalHeading}). Requesting extraction.`
    : "EMERGENCY SOS: Flood distress beacon active. Please dispatch response team.";

  const handleCopySMS = () => {
    navigator.clipboard.writeText(emergencySMSText);
    setCopiedSMS(true);
    setTimeout(() => setCopiedSMS(false), 3000);
  };

  const handleCopyXML = () => {
    navigator.clipboard.writeText(capXml || "");
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 3000);
  };

  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-[#090d16] p-6 text-slate-100 shadow-2xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex size-2.5 rounded-full bg-red-500 ring-4 ring-red-500/20" />
            <h1 className="text-xl font-bold tracking-tight text-white uppercase font-sans">
              Tactical Offline Evacuation Navigation
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            National Disaster Response Framework · Autonomous GNSS Spatial Routing & Safehouse Triage
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowDirectory(!showDirectory)}
            className="flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <Database className="size-3.5 text-slate-400" />
            <span>{safehouseCount} Facilities Cached</span>
          </button>

          <span
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wider ${
              online
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                : "border-amber-500/30 bg-amber-950/40 text-amber-400"
            }`}
          >
            {online ? <Wifi className="size-3 text-emerald-400" /> : <WifiOff className="size-3 text-amber-400" />}
            {online ? "ONLINE REPLICATION" : "AUTONOMOUS OFFLINE"}
          </span>

          {isSimulated && (
            <span className="rounded-md border border-sky-500/30 bg-sky-950/40 px-2.5 py-1.5 text-[11px] font-semibold text-sky-300">
              SIMULATOR TELEMETRY
            </span>
          )}
        </div>
      </div>

      {/* SOS Success Banner */}
      {sosSentSuccess && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-4 text-xs text-emerald-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-100">Distress Beacon Committed to Command Triage</p>
              <p className="text-[11px] text-emerald-300/80">Dispatched to central responder queue (/sos) and OS alert worker.</p>
            </div>
          </div>
          <span className="rounded bg-emerald-900/80 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 uppercase tracking-widest border border-emerald-600/30">
            ACKNOWLEDGED
          </span>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300 flex items-center gap-2">
          <AlertOctagon className="size-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Compass & Safehouse Details */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        {/* Left Column: Formal Compass Instrument (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0c111c] p-6 shadow-inner relative">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <Compass className="size-3.5 text-slate-400" />
            <span>Target Azimuth Bearing</span>
          </div>

          {/* Compass Face */}
          <div className="relative size-64 sm:size-72 rounded-full border-2 border-slate-700/60 bg-[#070a12] flex items-center justify-center shadow-2xl ring-1 ring-slate-800/80">
            {/* Outer Cardinal Markers */}
            <span className="absolute top-2 font-bold text-xs text-red-500">N</span>
            <span className="absolute right-3 font-semibold text-[11px] text-slate-400">E</span>
            <span className="absolute bottom-2 font-semibold text-[11px] text-slate-400">S</span>
            <span className="absolute left-3 font-semibold text-[11px] text-slate-400">W</span>

            {/* Azimuth tick circle */}
            <div className="absolute inset-3 rounded-full border border-slate-800/80 pointer-events-none" />

            {/* Rotating Precision Arrow */}
            <div
              className="size-56 flex items-center justify-center transition-transform duration-700 ease-out"
              style={{
                transform: `rotate(${routeResult?.bearingAngle ?? 0}deg)`,
              }}
            >
              <svg
                viewBox="0 0 100 100"
                className="size-40 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                fill="none"
              >
                {/* Target Needle (Red) */}
                <polygon points="50,6 62,50 50,42" fill="#ef4444" />
                <polygon points="50,6 38,50 50,42" fill="#dc2626" />
                {/* Tail Needle (Slate) */}
                <polygon points="50,94 62,50 50,42" fill="#64748b" />
                <polygon points="50,94 38,50 50,42" fill="#475569" />
                {/* Pin */}
                <circle cx="50" cy="50" r="4.5" fill="#f8fafc" />
                <circle cx="50" cy="50" r="2" fill="#0f172a" />
              </svg>
            </div>
          </div>

          {/* Heading Readout */}
          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-bold text-white font-mono tracking-tight">
              {routeResult?.bearingAngle !== undefined ? `${routeResult.bearingAngle}°` : "--°"}
            </span>
            <span className="rounded bg-red-600/90 px-2.5 py-0.5 text-xs font-bold uppercase text-white font-mono border border-red-500/40">
              {routeResult?.cardinalHeading ?? "N"}
            </span>
          </div>
        </div>

        {/* Right Column: Facility Telemetry & Direct Actions (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Designated Facility Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0c111c] p-5 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-3">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-slate-400" />
                <span>Designated Evacuation Facility</span>
              </span>
              {routeResult?.safehouse?.state && (
                <span className="rounded bg-sky-950/60 border border-sky-600/30 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
                  {routeResult.safehouse.district}, {routeResult.safehouse.state}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white leading-snug">
                {routeResult?.name ?? "Locating nearest verified facility..."}
              </h2>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Target Coordinates: {routeResult?.coordinates ? `${routeResult.coordinates[1].toFixed(4)}°N, ${routeResult.coordinates[0].toFixed(4)}°E` : "Awaiting GNSS fix"}
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-800/80 pt-4">
              <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-3">
                <span className="block text-[10px] font-semibold uppercase text-slate-400">Direct Vector</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {routeResult ? `${routeResult.distanceKm} km` : "--"}
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-3">
                <span className="block text-[10px] font-semibold uppercase text-slate-400">Facility Capacity</span>
                <span className="text-xl font-bold text-sky-400 font-mono">
                  {routeResult?.safehouse?.capacity ? `${routeResult.safehouse.capacity}` : "--"}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-lg bg-slate-950/80 border border-slate-800/80 p-3">
                <span className="block text-[10px] font-semibold uppercase text-slate-400">Current Occupancy</span>
                <span className="text-xl font-bold text-amber-400 font-mono">
                  {routeResult?.safehouse?.occupancy !== undefined ? `${routeResult.safehouse.occupancy}` : "--"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={triggerSOSAlert}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] py-3.5 px-4 font-semibold text-white transition-all text-xs uppercase tracking-wider shadow-lg shadow-red-950/60"
            >
              <AlertOctagon className="size-4" />
              <span>Trigger Evacuation SOS</span>
            </button>

            <button
              onClick={() => setShowCapModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] py-3.5 px-4 font-medium text-slate-200 border border-slate-700 transition-all text-xs"
            >
              <FileCode2 className="size-4 text-slate-300" />
              <span>Generate CAP 1.2 XML</span>
            </button>
          </div>

          {/* Fallback & Simulation Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleCopySMS}
              className="flex items-center justify-between rounded-lg border border-slate-800/90 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 hover:bg-slate-900 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-slate-400" />
                <span>{copiedSMS ? "Copied SOS Payload" : "Copy Emergency SMS Text"}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">112 / 1078</span>
            </button>

            {/* GNSS Simulator Selector */}
            <div className="flex items-center justify-between rounded-lg border border-slate-800/90 bg-slate-950/80 px-3 py-2 text-xs">
              <span className="text-[10px] font-semibold uppercase text-slate-400">GNSS Sim:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => simulatePosition(13.0827, 80.2707)}
                  className="rounded bg-slate-800/90 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-700"
                >
                  Chennai
                </button>
                <button
                  onClick={() => simulatePosition(25.6094, 85.1055)}
                  className="rounded bg-slate-800/90 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-700"
                >
                  Bihar
                </button>
                <button
                  onClick={() => simulatePosition(10.1076, 76.3516)}
                  className="rounded bg-slate-800/90 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-700"
                >
                  Kerala
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Activity className="size-3.5 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Receiver: Lat <span className="text-slate-200">{userPos?.lat?.toFixed(5) ?? "--"}</span> · Lng <span className="text-slate-200">{userPos?.lng?.toFixed(5) ?? "--"}</span> · Accuracy <span className="text-slate-200">{accuracy ? `±${Math.round(accuracy)}m` : "--"}</span>
        </div>
      </div>

      {/* Safehouses Directory Modal / Drawer */}
      {showDirectory && (
        <div className="rounded-xl border border-slate-800 bg-[#070a12] p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Database className="size-3.5 text-slate-400" />
              <span>Local Offline Facility Registry ({cachedSafehouses.length})</span>
            </h3>
            <button
              onClick={() => setShowDirectory(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {cachedSafehouses.map((sh) => (
              <div
                key={sh.id}
                className="rounded-lg border border-slate-800/90 bg-slate-900/60 p-3 space-y-1 text-xs"
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-white">{sh.name}</p>
                  <span className="text-[10px] font-mono text-emerald-400">{sh.capacity} cap</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  {sh.district ? `${sh.district}, ${sh.state}` : `Lat: ${sh.lat}, Lng: ${sh.lng}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CAP 1.2 XML Export Modal */}
      {showCapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="max-w-2xl w-full rounded-2xl bg-[#0c111c] border border-slate-700 p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FileCode2 className="size-4 text-emerald-400" />
                <span>OASIS Common Alerting Protocol (CAP v1.2) Payload</span>
              </h3>
              <button
                onClick={() => setShowCapModal(false)}
                className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Conforms to OASIS CAP v1.2 / NDMA CAP-India specifications for direct ingestion into Cell Broadcast Systems (CBS) and inter-agency dispatch relays.
            </p>

            <pre className="flex-1 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 border border-slate-800/90 shadow-inner">
              {capXml || (routeResult && generateCAP12Alert({
                senderId: "qflow.resqflow.in",
                headline: `Flood Evacuation Vector to ${routeResult.name}`,
                description: `Displaced individual heading ${routeResult.cardinalHeading} (${routeResult.bearingAngle}°) towards ${routeResult.name}.`,
                areaPolygon: [
                  [13.20, 80.18],
                  [13.20, 80.30],
                  [13.12, 80.30],
                  [13.12, 80.18],
                  [13.20, 80.18],
                ],
              }))}
            </pre>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={handleCopyXML}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                {copiedXml ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedXml ? "Copied" : "Copy XML Payload"}</span>
              </button>
              <button
                onClick={() => setShowCapModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}