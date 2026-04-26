import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Metrics — UrbanSim" },
      { name: "description", content: "Aggregate metrics, propagation depth, and recovery KPIs across all simulations." },
    ],
  }),
  component: AnalyticsPage,
});

const failureBySector = [
  { sector: "Power", count: 42 },
  { sector: "Water", count: 27 },
  { sector: "Telecom", count: 18 },
  { sector: "Transit", count: 11 },
  { sector: "Gas", count: 6 },
];

const cause = [
  { name: "Cyber", value: 35, color: "oklch(0.62 0.20 256)" },
  { name: "Weather", value: 28, color: "oklch(0.78 0.16 75)" },
  { name: "Hardware", value: 22, color: "oklch(0.65 0.22 25)" },
  { name: "Overload", value: 15, color: "oklch(0.72 0.18 145)" },
];

const resilience = [
  { metric: "Recovery", A: 80 },
  { metric: "Redundancy", A: 65 },
  { metric: "Detection", A: 90 },
  { metric: "Containment", A: 72 },
  { metric: "Coordination", A: 68 },
  { metric: "Capacity", A: 78 },
];

function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Analytics & Metrics"
        description="Cross-simulation insights and resilience scoring."
        icon={BarChart3}
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          { label: "Total Simulations", v: "248" },
          { label: "Avg Cascade Depth", v: "4.7" },
          { label: "MTTR", v: "8.2 min" },
          { label: "Resilience Score", v: "87 / 100" },
        ].map((k) => (
          <Card key={k.label} className="glass border-border/50">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="mt-2 text-2xl font-bold text-gradient-primary">{k.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-border/50">
          <CardHeader><CardTitle className="text-base">Failures by Sector</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureBySector}>
                <CartesianGrid stroke="oklch(0.35 0.03 256 / 0.3)" strokeDasharray="3 3" />
                <XAxis dataKey="sector" stroke="oklch(0.70 0.03 256)" fontSize={11} />
                <YAxis stroke="oklch(0.70 0.03 256)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.03 256)", border: "1px solid oklch(0.35 0.03 256 / 0.5)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="oklch(0.62 0.20 256)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader><CardTitle className="text-base">Failure Causes</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cause} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {cause.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.22 0.03 256)", border: "1px solid oklch(0.35 0.03 256 / 0.5)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Resilience Profile</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={resilience}>
                <PolarGrid stroke="oklch(0.35 0.03 256 / 0.4)" />
                <PolarAngleAxis dataKey="metric" stroke="oklch(0.85 0.01 240)" fontSize={12} />
                <PolarRadiusAxis stroke="oklch(0.50 0.03 256)" />
                <Radar dataKey="A" stroke="oklch(0.62 0.20 256)" fill="oklch(0.62 0.20 256)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
