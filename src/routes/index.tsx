import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Zap,
  Droplets,
  Wifi,
  Bus,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — UrbanSim" },
      { name: "description", content: "Real-time overview of city infrastructure health, active simulations, and risk indicators." },
    ],
  }),
  component: Dashboard,
});

const systems = [
  { name: "Power Grid", icon: Zap, status: "operational", load: 72, color: "success" },
  { name: "Water Network", icon: Droplets, status: "degraded", load: 88, color: "warning" },
  { name: "Telecom", icon: Wifi, status: "operational", load: 54, color: "success" },
  { name: "Transit", icon: Bus, status: "operational", load: 61, color: "success" },
];

const trend = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  resilience: 70 + Math.sin(i / 3) * 15 + Math.random() * 5,
  load: 50 + Math.cos(i / 4) * 20 + Math.random() * 8,
}));

const alerts = [
  { level: "critical", text: "Substation 7B nearing capacity threshold", time: "2m ago" },
  { level: "warning", text: "Water pressure anomaly in District 4", time: "14m ago" },
  { level: "info", text: "Simulation #248 completed successfully", time: "1h ago" },
];

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Mission Control"
        description="Live status across all monitored urban infrastructure layers."
        icon={LayoutDashboard}
      />

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Network Resilience", value: "87%", trend: "+2.4%", icon: Activity, accent: "success" },
          { label: "Active Nodes", value: "1,284", trend: "12 offline", icon: Zap, accent: "primary" },
          { label: "Open Incidents", value: "3", trend: "1 critical", icon: AlertTriangle, accent: "destructive" },
          { label: "Avg Recovery", value: "4.2m", trend: "-18%", icon: TrendingUp, accent: "warning" },
        ].map((k) => (
          <Card key={k.label} className="glass border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold">{k.value}</p>
                  <p className={`mt-1 text-xs text-${k.accent}`}>{k.trend}</p>
                </div>
                <div className={`rounded-lg bg-${k.accent}/15 border border-${k.accent}/30 p-2`}>
                  <k.icon className={`h-5 w-5 text-${k.accent}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="glass lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">24-Hour Resilience Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.20 256)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.62 0.20 256)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.35 0.03 256 / 0.3)" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="oklch(0.70 0.03 256)" fontSize={11} />
                <YAxis stroke="oklch(0.70 0.03 256)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.22 0.03 256)",
                    border: "1px solid oklch(0.35 0.03 256 / 0.5)",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="resilience"
                  stroke="oklch(0.62 0.20 256)"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((a, i) => {
              const color =
                a.level === "critical"
                  ? "destructive"
                  : a.level === "warning"
                  ? "warning"
                  : "primary";
              return (
                <div
                  key={i}
                  className={`rounded-lg border border-${color}/30 bg-${color}/5 p-3`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full bg-${color} pulse-dot`} />
                    <span className={`text-[10px] uppercase tracking-wider text-${color} font-semibold`}>
                      {a.level}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{a.time}</span>
                  </div>
                  <p className="mt-1.5 text-sm">{a.text}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Systems */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {systems.map((s) => (
          <Card key={s.name} className="glass border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg bg-${s.color}/15 border border-${s.color}/30 p-2`}>
                  <s.icon className={`h-5 w-5 text-${s.color}`} />
                </div>
                <Badge
                  variant="outline"
                  className={`border-${s.color}/40 text-${s.color} bg-${s.color}/10 capitalize`}
                >
                  {s.status}
                </Badge>
              </div>
              <p className="mt-3 font-semibold">{s.name}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Load</span>
                <span>{s.load}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full bg-${s.color} transition-all`}
                  style={{ width: `${s.load}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
