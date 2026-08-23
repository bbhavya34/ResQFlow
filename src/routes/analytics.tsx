"use client";

import { definePage } from "@/lib/page-definition";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionTitle, StatCard } from "@/components/aegis/ui";
import { ANALYTICS } from "@/lib/aegis/data";

export const Route = definePage("/analytics")({
  head: () => ({
    meta: [
      { title: "Response Analytics — ResQFlow" },
      {
        name: "description",
        content:
          "Prototype SOS trends, response time, people rescued, resource utilisation, flood-risk alerts and camp occupancy.",
      },
      {
        property: "og:title",
        content: "Response Analytics — ResQFlow",
      },
      {
        property: "og:description",
        content: "Operational analytics for India's flood response programme.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const axis = { stroke: "#94a3b8", fontSize: 11 };
const grid = "#e2e8f0";

function Panel({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-4">
      <SectionTitle title={title} desc={desc} />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as never}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="People rescued (7d)"
          value="1,425"
          tone="good"
          sub="+21% week on week"
        />
        <StatCard
          label="Median response"
          value="34 min"
          tone="good"
          sub="down from 74 min"
        />
        <StatCard
          label="Resource utilisation"
          value="63%"
          sub="fleet-wide average"
        />
        <StatCard
          label="Alerts verified"
          value="92%"
          tone="good"
          sub="demo gauge-alert comparison"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="SOS trend by channel"
          desc="App vs SMS intake volume through the operational day."
        >
          <AreaChart data={ANALYTICS.sosTrend}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="t" {...axis} />
            <YAxis {...axis} />
            <Tooltip />
            <Legend />
            <Area
              dataKey="sms"
              name="SMS"
              stroke="#0ea5a4"
              fill="#0ea5a4"
              fillOpacity={0.18}
            />
            <Area
              dataKey="app"
              name="App"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.15}
            />
          </AreaChart>
        </Panel>

        <Panel
          title="Rescue response time"
          desc="Median minutes from SOS receipt to on-site arrival."
        >
          <LineChart data={ANALYTICS.responseTime}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="d" {...axis} />
            <YAxis {...axis} />
            <Tooltip />
            <Line
              dataKey="min"
              name="Minutes"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </Panel>

        <Panel
          title="People rescued (cumulative)"
          desc="Across all active state sectors."
        >
          <AreaChart data={ANALYTICS.rescued}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="d" {...axis} />
            <YAxis {...axis} />
            <Tooltip />
            <Area
              dataKey="people"
              name="People"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.18}
            />
          </AreaChart>
        </Panel>

        <Panel
          title="Resource utilisation"
          desc="Percentage of available hours engaged in operations."
        >
          <BarChart data={ANALYTICS.utilisation}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="name" {...axis} />
            <YAxis {...axis} />
            <Tooltip />
            <Bar
              dataKey="used"
              name="Utilisation %"
              fill="#0d9488"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </Panel>

        <Panel
          title="Flood-risk alerts by state"
          desc="Demo feed risk index, D-3 to D+1."
        >
          <LineChart data={ANALYTICS.floodRisk}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="t" {...axis} />
            <YAxis {...axis} />
            <Tooltip />
            <Legend />
            <Line
              dataKey="kerala"
              name="Kerala"
              stroke="#2563eb"
              strokeWidth={2}
            />
            <Line
              dataKey="assam"
              name="Assam"
              stroke="#0d9488"
              strokeWidth={2}
            />
            <Line
              dataKey="bihar"
              name="Bihar"
              stroke="#f59e0b"
              strokeWidth={2}
            />
          </LineChart>
        </Panel>

        <Panel
          title="Relief camp occupancy"
          desc="Occupancy as a percentage of sanctioned capacity."
        >
          <BarChart data={ANALYTICS.campOccupancy}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="name" {...axis} />
            <YAxis {...axis} />
            <Tooltip />
            <Bar
              dataKey="occ"
              name="Occupancy %"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </Panel>

        <Panel
          title="Alert verification rate"
          desc="Demo alerts compared with fixture gauge observations."
        >
          <LineChart data={ANALYTICS.accuracy}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="m" {...axis} />
            <YAxis domain={[60, 100]} {...axis} />
            <Tooltip />
            <Line
              dataKey="acc"
              name="Verified %"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </Panel>
      </div>
    </div>
  );
}
