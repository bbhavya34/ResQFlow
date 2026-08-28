"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CAMPS,
  RESOURCES,
  SOS_SEED,
  priorityScore,
  type Camp,
  type FeedbackEntry,
  type Resource,
  type SOS,
  type Status,
} from "./data";
import {
  loadBackendSnapshot,
  persistAssignment,
  persistFeedback,
  persistSOS,
  persistSOSPatch,
} from "./api";

export type Recommendation = {
  sos: SOS;
  resource: Resource;
  score: number;
  etaMin: number;
  distanceKm: number;
  capabilityMatch: string[];
  reasons: string[];
};

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function recommendFor(sos: SOS, resources: Resource[]): Recommendation | null {
  const open = resources.filter((r) => r.availability === "AVAILABLE");
  const scored = open.map((r) => {
    const distanceKm = haversine(sos, r);
    const needsLivestock = sos.livestock > 0;
    const hasLivestock = r.capabilities.includes("Livestock");
    const needsMedical = sos.medical;
    const hasMedical = r.capabilities.some((c) =>
      /Medical|First aid|ALS|Paramedic/.test(c),
    );
    const capacityOk = r.capacity >= sos.people;
    let score = 100;
    score -= Math.min(45, distanceKm * 3.2);
    if (needsLivestock && !hasLivestock) score -= 30;
    if (needsLivestock && hasLivestock) score += 8;
    if (needsMedical && hasMedical) score += 6;
    if (needsMedical && !hasMedical) score -= 10;
    if (!capacityOk) score -= 18;
    if (!r.verified) score -= 12;
    if (r.category === "OFFICIAL") score += 4;
    const speed = r.type === "Helicopter" ? 180 : r.type === "Boat" ? 14 : 26;
    const etaMin = Math.max(6, Math.round((distanceKm / speed) * 60 + 8));
    const capabilityMatch = r.capabilities.filter(
      (c) =>
        (needsLivestock && c === "Livestock") ||
        (needsMedical && /Medical|First aid|ALS|Paramedic/.test(c)) ||
        c === "Shallow water" ||
        c === "Local knowledge",
    );
    const reasons = [
      `${distanceKm.toFixed(1)} km from ${r.base}, ETA ${etaMin} min`,
      capacityOk
        ? `Capacity ${r.capacity} covers ${sos.people} persons in one trip`
        : `Capacity ${r.capacity} < ${sos.people} persons — two trips required`,
      needsLivestock
        ? hasLivestock
          ? `Livestock-capable craft matched to ${sos.livestock} animals`
          : `No livestock capability for ${sos.livestock} animals`
        : "No livestock component in this request",
      r.verified
        ? `${r.agency} — verified resource`
        : `${r.agency} — verification pending`,
    ];
    return {
      sos,
      resource: r,
      score: Math.round(score),
      etaMin,
      distanceKm,
      capabilityMatch,
      reasons,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
}

type Ctx = {
  sosList: SOS[];
  resources: Resource[];
  camps: Camp[];
  feedback: FeedbackEntry[];
  online: boolean;
  lastSync: string;
  planAgeMin: number;
  recommendations: Recommendation[];
  dataSource: "loading" | "postgres" | "demo";
  setOnline: (v: boolean) => void;
  resync: () => void;
  confirmDispatch: (sosId: string, resourceId: string) => void;
  overrideAssign: (sosId: string, resourceId: string) => void;
  rejectRecommendation: (sosId: string) => void;
  addSOS: (s: SOS) => void;
  submitFeedback: (
    sosId: string,
    type: string,
    note: string,
    by: string,
  ) => void;
};

const AegisContext = createContext<Ctx | null>(null);

const OPEN: Status[] = ["NEW", "TRIAGED"];

export function AegisProvider({ children }: { children: ReactNode }) {
  const [sosList, setSosList] = useState<SOS[]>(SOS_SEED);
  const [resources, setResources] = useState<Resource[]>(RESOURCES);
  const [camps, setCamps] = useState<Camp[]>(CAMPS);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([
    {
      id: "FB-1",
      sosId: "A1028",
      type: "Rescued",
      by: "NDRF Alpha-3 · Insp. R. Bisht",
      at: "12:48",
      note: "8 persons moved to Rishikesh Municipal Shelter. 2 goats relocated.",
    },
  ]);
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState("12 Aug 2026, 19:34 IST");
  const [planAgeMin, setPlanAgeMin] = useState(0);
  const [dataSource, setDataSource] = useState<Ctx["dataSource"]>("loading");

  const syncFromBackend = useCallback(async () => {
    try {
      const snapshot = await loadBackendSnapshot();
      setSosList(snapshot.sosList);
      setResources(snapshot.resources);
      setCamps(snapshot.camps);
      setFeedback(snapshot.feedback);
      setLastSync(
        new Date(snapshot.syncedAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Kolkata",
        }),
      );
      setDataSource("postgres");
    } catch {
      setDataSource("demo");
    }
  }, []);

  // Active network probe — /backend/api/v1/health/ returns 503 from the
  // Next.js proxy even when offline (the proxy itself answers). Instead:
  // 1. Fast-fail: navigator.onLine = false  →  definitely offline
  // 2. Real check: fetch a tiny external resource with no-cors (opaque
  //    response, but if it throws the network is truly down)
  const probeConnectivity = useCallback(async () => {
    // Fast-fail: OS reports no network interface at all
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setOnline(false);
      setDataSource("demo");
      return false;
    }

    // Real internet probe: opaque no-cors request with cache-busting query
    // Will throw (TypeError: Failed to fetch) when truly offline
    try {
      await fetch(`https://www.cloudflare.com/cdn-cgi/trace?_probe=${Date.now()}`, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      });
      // Opaque response (mode: no-cors) — if we get here, internet is reachable
      setOnline(true);
      return true;
    } catch {
      // Network unreachable, DNS failure, or timeout
      setOnline(false);
      setDataSource("demo");
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial check + sync
    void probeConnectivity().then((isOnline) => {
      if (isOnline) void syncFromBackend();
    });

    if (typeof window === "undefined") return undefined;

    // Poll every 4 seconds for rapid connectivity tracking
    const interval = setInterval(() => {
      void probeConnectivity().then((isOnline) => {
        if (isOnline) void syncFromBackend();
      });
    }, 4_000);

    // Supplement with native events for instantaneous response
    const handleOnline = () => {
      void probeConnectivity().then((ok) => {
        if (ok) void syncFromBackend();
      });
    };
    const handleOffline = () => {
      setOnline(false);
      setDataSource("demo");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [probeConnectivity, syncFromBackend]);

  const recommendations = useMemo(
    () =>
      sosList
        .filter((s) => OPEN.includes(s.status))
        .sort((a, b) => priorityScore(b.factors) - priorityScore(a.factors))
        .map((s) => recommendFor(s, resources))
        .filter((x): x is Recommendation => Boolean(x)),
    [sosList, resources],
  );

  const assign = useCallback(
    (sosId: string, resourceId: string, status: Status) => {
      setSosList((list) =>
        list.map((s) =>
          s.id === sosId ? { ...s, status, assignedResourceId: resourceId } : s,
        ),
      );
      setResources((list) =>
        list.map((r) =>
          r.id === resourceId
            ? { ...r, availability: "ENGAGED", lastUpdate: "just now" }
            : r,
        ),
      );
      void persistAssignment(sosId, resourceId, status).catch(() =>
        setDataSource("demo"),
      );
    },
    [],
  );

  const value: Ctx = {
    sosList,
    resources,
    camps,
    feedback,
    online,
    lastSync,
    planAgeMin,
    recommendations,
    dataSource,
    setOnline: (v) => {
      setOnline(v);
      if (!v) setPlanAgeMin(0);
    },
    resync: () => {
      setOnline(true);
      setPlanAgeMin(0);
      void syncFromBackend();
    },
    confirmDispatch: (sosId, resourceId) =>
      assign(sosId, resourceId, "DISPATCHED"),
    overrideAssign: (sosId, resourceId) =>
      assign(sosId, resourceId, "ASSIGNED"),
    rejectRecommendation: (sosId) => {
      setSosList((list) =>
        list.map((s) =>
          s.id === sosId
            ? {
                ...s,
                status: "TRIAGED",
                notes: "Recommendation rejected by controller",
              }
            : s,
        ),
      );
      void persistSOSPatch(sosId, {
        status: "TRIAGED",
        notes: "Recommendation rejected by controller",
      }).catch(() => setDataSource("demo"));
    },
    addSOS: (s) => {
      setSosList((list) => [s, ...list]);
      void persistSOS(s).catch(() => setDataSource("demo"));
    },
    submitFeedback: (sosId, type, note, by) => {
      const entry: FeedbackEntry = {
        id: `FB-${Date.now()}`,
        sosId,
        type,
        by,
        at: new Date().toTimeString().slice(0, 5),
        note,
      };
      setFeedback((list) => [entry, ...list]);
      void persistFeedback(entry).catch(() => setDataSource("demo"));
      if (type === "Rescued") {
        const s = sosList.find((x) => x.id === sosId);
        setSosList((list) =>
          list.map((x) => (x.id === sosId ? { ...x, status: "RESCUED" } : x)),
        );
        setResources((list) =>
          list.map((r) =>
            r.id === s?.assignedResourceId
              ? { ...r, availability: "AVAILABLE", lastUpdate: "just now" }
              : r,
          ),
        );
        if (s)
          setCamps((list) =>
            list.map((c, i) =>
              i === 0
                ? {
                    ...c,
                    occupancy: Math.min(c.capacity, c.occupancy + s.people),
                  }
                : c,
            ),
          );
      }
      if (type === "Water rising" || type === "Still stranded")
        setSosList((list) =>
          list.map((x) => (x.id === sosId ? { ...x, status: "TRIAGED" } : x)),
        );
    },
  };

  return (
    <AegisContext.Provider value={value}>{children}</AegisContext.Provider>
  );
}

export function useAegis() {
  const ctx = useContext(AegisContext);
  if (!ctx) throw new Error("useAegis must be used inside AegisProvider");
  return ctx;
}
