"use client";

import { definePage } from "@/lib/page-definition";
import { useState } from "react";
import { toast } from "sonner";
import { SectionTitle, StatusBadge } from "@/components/aegis/ui";
import { useAegis } from "@/lib/aegis/store";

const TYPES = [
  "Rescued",
  "Still stranded",
  "Water rising",
  "Road blocked",
  "Medical emergency",
  "Resource unavailable",
] as const;

export const Route = definePage("/field")({
  head: () => ({
    meta: [
      { title: "Field Feedback Loop — ResQFlow" },
      {
        name: "description",
        content:
          "Responders report rescued, still stranded, water rising, blocked roads and medical emergencies; the response plan updates immediately.",
      },
      {
        property: "og:title",
        content: "Field Feedback Loop — ResQFlow",
      },
      {
        property: "og:description",
        content:
          "Two-way responder reporting that keeps the rescue plan current.",
      },
    ],
  }),
  component: FieldPage,
});

export default function FieldPage() {
  const { sosList, feedback, submitFeedback, online } = useAegis();
  const [sosId, setSosId] = useState(sosList[0]?.id ?? "");
  const [type, setType] = useState<string>("Rescued");
  const [note, setNote] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="panel p-4">
        <SectionTitle
          title="Responder report"
          desc="Submitted from the field app. Queues locally in degraded mode and syncs on reconnect."
        />
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-muted-foreground">
            SOS reference
            <select
              value={sosId}
              onChange={(e) => setSosId(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-foreground"
            >
              {sosList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.place}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              Report type
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium ${
                    type === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-semibold text-muted-foreground">
            Observation
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. 6 persons and 3 cattle moved to Aluva camp; water still rising at 5 cm/hr."
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-foreground"
            />
          </label>

          <button
            onClick={() => {
              submitFeedback(
                sosId,
                type,
                note || `${type} reported from the field.`,
                "Field Unit · Ops radio",
              );
              setNote("");
              toast.success(
                online
                  ? `Report logged for SOS ${sosId}`
                  : `Report queued offline for SOS ${sosId}`,
              );
            }}
            className="w-full rounded-md brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            Submit field report
          </button>
          <p className="text-[11px] text-muted-foreground">
            “Rescued” closes the request, releases the resource and increments
            relief-camp occupancy. “Water rising” and “Still stranded” push the
            request back into the triage queue for re-prioritisation.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="panel p-4">
          <SectionTitle
            title="Field report log"
            desc="Chronological, auditable trail."
          />
          <ul className="space-y-3">
            {feedback.map((f) => (
              <li key={f.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold">
                    SOS {f.sosId} · {f.type}
                  </span>
                  <span className="text-muted-foreground">{f.at}</span>
                </div>
                <p className="mt-1 text-sm">{f.note}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{f.by}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-4">
          <SectionTitle title="Request status after feedback" />
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="py-2 text-left">SOS</th>
                <th className="py-2 text-left">Location</th>
                <th className="py-2 text-left">Resource</th>
                <th className="py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {sosList.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-2 font-semibold">{s.id}</td>
                  <td className="py-2 text-xs">{s.place}</td>
                  <td className="py-2 text-xs">
                    {s.assignedResourceId ?? "—"}
                  </td>
                  <td className="py-2">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
