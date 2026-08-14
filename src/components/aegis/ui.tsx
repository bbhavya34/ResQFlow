import {
  priorityBand,
  priorityScore,
  type PriorityFactor,
  type Status,
} from "@/lib/aegis/data";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "default" | "critical" | "warn" | "good";
  icon?: ReactNode;
}) {
  const bar =
    tone === "critical"
      ? "bg-destructive"
      : tone === "warn"
        ? "bg-amber"
        : tone === "good"
          ? "bg-green"
          : "brand-gradient";
  return (
    <div className="panel relative overflow-hidden p-4">
      <span className={`absolute inset-x-0 top-0 h-0.5 ${bar}`} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function SectionTitle({
  title,
  desc,
  right,
}: {
  title: string;
  desc?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    NEW: "bg-destructive/10 text-destructive border-destructive/20",
    TRIAGED: "bg-amber/15 text-[oklch(0.48_0.13_75)] border-amber/30",
    ASSIGNED: "bg-primary/10 text-primary border-primary/20",
    DISPATCHED: "bg-teal/15 text-[oklch(0.42_0.09_195)] border-teal/30",
    RESCUED: "bg-green/15 text-[oklch(0.42_0.11_155)] border-green/30",
    CLOSED: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold ${map[status]}`}
    >
      {status}
    </span>
  );
}

export function PriorityPill({ factors }: { factors: PriorityFactor[] }) {
  const score = priorityScore(factors);
  const band = priorityBand(score);
  const cls =
    band.tone === "critical"
      ? "bg-destructive text-destructive-foreground"
      : band.tone === "high"
        ? "bg-amber text-[oklch(0.25_0.05_75)]"
        : band.tone === "moderate"
          ? "bg-teal text-white"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {score}/100 · {band.label}
    </span>
  );
}

export function PriorityBreakdown({ factors }: { factors: PriorityFactor[] }) {
  const score = priorityScore(factors);
  return (
    <div className="space-y-2.5">
      {factors.map((f) => (
        <div key={f.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="font-medium text-foreground">{f.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {f.value}/{f.max}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full brand-gradient"
              style={{ width: `${(f.value / f.max) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {f.note}
          </p>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
        <span>Composite priority</span>
        <span className="tabular-nums">{score}/100</span>
      </div>
    </div>
  );
}
