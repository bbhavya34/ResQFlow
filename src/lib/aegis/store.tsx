import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
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
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function recommendFor(sos: SOS, resources: Resource[]): Recommendation | null {
  const open = resources.filter((r) => r.availability === "AVAILABLE");
  const scored = open.map((r) => {
    const distanceKm = haversine(sos, r);
    const needsLivestock = sos.livestock > 0;
    const hasLivestock = r.capabilities.includes("Livestock");
    const needsMedical = sos.medical;
    const hasMedical = r.capabilities.some((c) => /Medical|First aid|ALS|Paramedic/.test(c));
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
      r.verified ? `${r.agency} — verified resource` : `${r.agency} — verification pending`,
    ];
    return { sos, resource: r, score: Math.round(score), etaMin, distanceKm, capabilityMatch, reasons };
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
  setOnline: (v: boolean) => void;
  resync: () => void;
  confirmDispatch: (sosId: string, resourceId: string) => void;
  overrideAssign: (sosId: string, resourceId: string) => void;
  rejectRecommendation: (sosId: string) => void;
  addSOS: (s: SOS) => void;
  submitFeedback: (sosId: string, type: string, note: string, by: string) => void;
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

  const recommendations = useMemo(
    () =>
      sosList
        .filter((s) => OPEN.includes(s.status))
        .sort((a, b) => priorityScore(b.factors) - priorityScore(a.factors))
        .map((s) => recommendFor(s, resources))
        .filter((x): x is Recommendation => Boolean(x)),
    [sosList, resources],
  );

  const assign = useCallback((sosId: string, resourceId: string, status: Status) => {
    setSosList((list) =>
      list.map((s) => (s.id === sosId ? { ...s, status, assignedResourceId: resourceId } : s)),
    );
    setResources((list) =>
      list.map((r) => (r.id === resourceId ? { ...r, availability: "ENGAGED", lastUpdate: "just now" } : r)),
    );
  }, []);

  const value: Ctx = {
    sosList,
    resources,
    camps,
    feedback,
    online,
    lastSync,
    planAgeMin,
    recommendations,
    setOnline: (v) => {
      setOnline(v);
      if (!v) setPlanAgeMin(0);
    },
    resync: () => {
      setOnline(true);
      setPlanAgeMin(0);
      setLastSync("12 Aug 2026, " + new Date().toTimeString().slice(0, 5) + " IST");
    },
    confirmDispatch: (sosId, resourceId) => assign(sosId, resourceId, "DISPATCHED"),
    overrideAssign: (sosId, resourceId) => assign(sosId, resourceId, "ASSIGNED"),
    rejectRecommendation: (sosId) =>
      setSosList((list) =>
        list.map((s) =>
          s.id === sosId ? { ...s, status: "TRIAGED", notes: "Recommendation rejected by controller" } : s,
        ),
      ),
    addSOS: (s) => setSosList((list) => [s, ...list]),
    submitFeedback: (sosId, type, note, by) => {
      setFeedback((list) => [
        {
          id: "FB-" + (list.length + 1),
          sosId,
          type,
          by,
          at: new Date().toTimeString().slice(0, 5),
          note,
        },
        ...list,
      ]);
      if (type === "Rescued") {
        const s = sosList.find((x) => x.id === sosId);
        setSosList((list) => list.map((x) => (x.id === sosId ? { ...x, status: "RESCUED" } : x)));
        setResources((list) =>
          list.map((r) =>
            r.id === s?.assignedResourceId ? { ...r, availability: "AVAILABLE", lastUpdate: "just now" } : r,
          ),
        );
        if (s)
          setCamps((list) =>
            list.map((c, i) =>
              i === 0 ? { ...c, occupancy: Math.min(c.capacity, c.occupancy + s.people) } : c,
            ),
          );
      }
      if (type === "Water rising" || type === "Still stranded")
        setSosList((list) => list.map((x) => (x.id === sosId ? { ...x, status: "TRIAGED" } : x)));
    },
  };

  return <AegisContext.Provider value={value}>{children}</AegisContext.Provider>;
}

export function useAegis() {
  const ctx = useContext(AegisContext);
  if (!ctx) throw new Error("useAegis must be used inside AegisProvider");
  return ctx;
}