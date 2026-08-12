import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "End-to-End Demo Run — Aegis Bharat" },
      {
        name: "description",
        content:
          "Walk the full chain: flood prediction, SOS intake, priority 92, resource match, safe route, human confirmation, offline continuity, rescue and camp update.",
      },
      { property: "og:title", content: "End-to-End Demo Run — Aegis Bharat" },
      { property: "og:description", content: "The complete Indian flood response workflow in ten steps." },
    ],
  }),
  component: DemoPage,
});

const STEPS: { t: string; d: string; to?: "/" | "/sos" | "/allocation" | "/map" | "/offline" | "/field" | "/camps" }[] = [
  {
    t: "1 · Flood detected",
    d: "Periyar basin model returns 91% severe-flood probability after Idukki shutter release. Aluva–Ernakulam sector escalated to SEVERE.",
    to: "/",
  },
  {
    t: "2 · SOS arrives",
    d: 'SMS gateway receives "SOS 9.9312 76.2673 6" from Chittoor Road, Ernakulam — 6 persons, 2 children, 1 elderly, 1 disabled, 3 cattle, 2.4 m water.',
    to: "/sos",
  },
  {
    t: "3 · Priority 92 / 100 — Critical",
    d: "Depth 23 + vulnerable 19 + population 12 + inaccessibility 14 + history 9 + livestock 4 + resource distance 9. Every weight is shown to the controller.",
    to: "/sos",
  },
  {
    t: "4 · Suitable resource found",
    d: "Boat B-14 (NDRF 4th Bn) — livestock capable, capacity 12, 4.2 km away, night-ops rated. Civilian fishermen unit held as backup.",
    to: "/allocation",
  },
  {
    t: "5 · Safe route generated",
    d: "NetworkX path over the OSM graph avoids the submerged NH-66 service road; 4.2 km, ETA 18 minutes.",
    to: "/map",
  },
  {
    t: "6 · Human confirms",
    d: "Controller reviews the reasoning and presses Confirm Dispatch. Override and Reject remain available — nothing dispatches automatically.",
    to: "/allocation",
  },
  {
    t: "7 · Dispatched",
    d: "B-14 status flips to ENGAGED, SOS A1024 becomes DISPATCHED, and the assignment is written to the audit log.",
    to: "/allocation",
  },
  {
    t: "8 · Connectivity drops",
    d: "Cellular backhaul fails. The platform switches to DEGRADED MODE and the boat crew keeps the cached plan, route and camp list on device.",
    to: "/offline",
  },
  {
    t: "9 · Responder reports rescued",
    d: "Crew logs “Rescued — 6 persons and 3 cattle evacuated”. The queued report replays on reconnect and frees B-14.",
    to: "/field",
  },
  {
    t: "10 · Relief camp updated",
    d: "Aluva Govt. HSS camp occupancy increases, stock burn-down recalculates and a baby-food requisition is raised to the district collector.",
    to: "/camps",
  },
];

function DemoPage() {
  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <h1 className="text-xl font-semibold tracking-tight">End-to-end demonstration run</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Data → flood prediction → SOS → priority scoring → resource matching → smart allocation → safe routing →
          human confirmation → alerts → relief camps → field feedback. Follow the steps in order; each links to the
          live screen where that stage is performed.
        </p>
      </div>

      <ol className="relative space-y-4 border-l border-border pl-6">
        {STEPS.map((s) => (
          <li key={s.t} className="relative">
            <span className="absolute -left-[31px] top-1.5 size-3 rounded-full brand-gradient ring-4 ring-background" />
            <div className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{s.t}</h2>
                {s.to && (
                  <Link to={s.to} className="text-xs font-semibold text-primary hover:underline">
                    Open screen →
                  </Link>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="panel p-5">
        <h2 className="text-sm font-semibold">Reference architecture</h2>
        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Frontend", "TypeScript · React · Tailwind CSS"],
            ["Backend-ready", "Django + Django REST Framework"],
            ["Database", "PostgreSQL + PostGIS"],
            ["Maps", "Leaflet + OpenStreetMap"],
            ["AI / ML", "Python · scikit-learn · XGBoost"],
            ["Data", "Pandas · NumPy · GeoPandas"],
            ["Optimisation", "Google OR-Tools"],
            ["Routing", "NetworkX over OSM graphs"],
            ["Realtime", "WebSockets + Redis"],
            ["Tasks", "Celery workers"],
            ["Deployment", "Docker · Vercel · Render / AWS"],
            ["Resilience", "Offline cache · SMS gateway fallback"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-border p-3">
              <p className="font-semibold text-foreground">{k}</p>
              <p className="mt-1 text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}