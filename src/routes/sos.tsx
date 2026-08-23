"use client";

import { definePage } from "@/lib/page-definition";
import { useState } from "react";
import { MapPanel } from "@/components/aegis/MapPanel";
import {
  PriorityBreakdown,
  PriorityPill,
  SectionTitle,
  StatusBadge,
} from "@/components/aegis/ui";
import { priorityScore, type SOS } from "@/lib/aegis/data";
import { useAegis } from "@/lib/aegis/store";

export const Route = definePage("/sos")({
  head: () => ({
    meta: [
      { title: "SOS Intake & Priority Engine — ResQFlow" },
      {
        name: "description",
        content:
          "App, SMS and IVR distress intake with a transparent priority score covering flood depth, vulnerable people, access and livestock.",
      },
      {
        property: "og:title",
        content: "SOS Intake & Priority Engine — ResQFlow",
      },
      {
        property: "og:description",
        content:
          "Explainable priority scoring for every Indian flood distress request.",
      },
    ],
  }),
  component: SosPage,
});

export default function SosPage() {
  const { sosList, addSOS } = useAegis();
  const [selectedId, setSelectedId] = useState(sosList[0]?.id ?? "");
  const [raw, setRaw] = useState("SOS 11.2588 75.7804 5");
  const [err, setErr] = useState("");
  const selected = sosList.find((s) => s.id === selectedId) ?? sosList[0];

  const parse = () => {
    const m = raw
      .trim()
      .match(/^SOS\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(\d+)$/i);
    if (!m) {
      setErr("Format: SOS <latitude> <longitude> <people>");
      return;
    }
    setErr("");
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    const people = Number(m[3]);
    const id = "A" + Math.floor(1032 + Math.random() * 800);
    const s: SOS = {
      id,
      channel: "SMS",
      raw: raw.trim(),
      lat,
      lng,
      place: "Field-reported location",
      district: "Auto-geocoded ward",
      state: "India",
      people,
      children: Math.min(2, Math.floor(people / 3)),
      elderly: Math.min(2, Math.floor(people / 4)),
      disabled: 0,
      livestock: 0,
      floodDepthM: 1.3,
      medical: false,
      receivedAt: new Date().toISOString(),
      status: "NEW",
      factors: [
        {
          label: "Flood depth",
          value: 13,
          max: 25,
          note: "1.3 m estimated from nearest gauge interpolation",
        },
        {
          label: "Vulnerable people",
          value: 9,
          max: 20,
          note: "Children/elderly inferred from household profile",
        },
        {
          label: "Population at risk",
          value: Math.min(15, people),
          max: 15,
          note: `${people} persons reported over SMS`,
        },
        {
          label: "Road inaccessibility",
          value: 9,
          max: 15,
          note: "Approach lane flagged waterlogged by field unit",
        },
        {
          label: "Historical damage index",
          value: 6,
          max: 10,
          note: "Ward inundated in previous monsoon",
        },
        {
          label: "Livestock exposure",
          value: 0,
          max: 5,
          note: "No livestock reported in the SMS payload",
        },
        {
          label: "Resource distance",
          value: 5,
          max: 10,
          note: "Nearest available craft under 6 km",
        },
      ],
    };
    addSOS(s);
    setSelectedId(id);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="panel p-4">
          <SectionTitle
            title="SMS / low-bandwidth intake"
            desc="Works on 2G and feature phones — no app required."
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-ring"
            />
            <button
              onClick={parse}
              className="rounded-md brand-gradient px-4 py-2 text-sm font-semibold text-white"
            >
              Parse & triage
            </button>
          </div>
          {err ? (
            <p className="mt-2 text-xs text-destructive">{err}</p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Gateway format:{" "}
              <span className="font-mono">
                SOS &lt;lat&gt; &lt;lng&gt; &lt;people&gt;
              </span>{" "}
              — e.g.
              <span className="font-mono"> SOS 9.9312 76.2673 6</span>
            </p>
          )}
        </div>
        <div className="panel p-4">
          <SectionTitle
            title="Intake channels"
            desc="Every request converges into a single triage queue."
          />
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            {(["APP", "SMS", "IVR"] as const).map((c) => (
              <div key={c} className="rounded-md border border-border p-3">
                <p className="text-lg font-semibold">
                  {sosList.filter((s) => s.channel === c).length}
                </p>
                <p className="text-muted-foreground">{c} requests</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="p-4">
          <SectionTitle
            title="Distress request register"
            desc="Click a row to inspect the priority breakdown."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                {[
                  "SOS ID",
                  "Channel",
                  "Location",
                  "People",
                  "Vulnerable",
                  "Livestock",
                  "Depth",
                  "Priority",
                  "Status",
                ].map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sosList
                .slice()
                .sort(
                  (a, b) => priorityScore(b.factors) - priorityScore(a.factors),
                )
                .map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`cursor-pointer border-t border-border transition-colors hover:bg-accent/40 ${
                      selected?.id === s.id ? "bg-accent/50" : ""
                    }`}
                  >
                    <td className="px-4 py-2 font-semibold">{s.id}</td>
                    <td className="px-4 py-2 text-xs">{s.channel}</td>
                    <td className="px-4 py-2 text-xs">
                      <div className="font-medium text-foreground">
                        {s.place}
                      </div>
                      <div className="text-muted-foreground">
                        {s.district}, {s.state} · {s.lat.toFixed(4)},{" "}
                        {s.lng.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-4 py-2 tabular-nums">{s.people}</td>
                    <td className="px-4 py-2 text-xs">
                      {s.children}C / {s.elderly}E / {s.disabled}D
                    </td>
                    <td className="px-4 py-2 tabular-nums">{s.livestock}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {s.floodDepthM} m
                    </td>
                    <td className="px-4 py-2">
                      <PriorityPill factors={s.factors} />
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="panel p-4">
            <SectionTitle
              title={`Why SOS ${selected.id} scores ${priorityScore(selected.factors)}/100`}
              desc="Transparent, auditable weights — no black-box scoring."
            />
            <PriorityBreakdown factors={selected.factors} />
            {selected.raw && (
              <p className="mt-3 rounded-md bg-muted px-3 py-2 font-mono text-xs">
                {selected.raw}
              </p>
            )}
          </div>
          <div className="panel p-4">
            <SectionTitle
              title="Location context"
              desc="Flood layer, nearby resources and camps."
            />
            <MapPanel
              height={380}
              center={[selected.lat, selected.lng]}
              zoom={11}
              initial={{ hospitals: true, shelters: true }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
