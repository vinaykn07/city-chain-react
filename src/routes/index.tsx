import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/ApiState";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Zap,
  Droplets,
  Wifi,
  Heart,
  Siren,
  TrafficCone,
  Clock,
  TrendingUp,
  AlertTriangle,
  Activity,
  ShieldAlert,
  ShieldCheck,
  FileBarChart,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — UrbanSim" },
      {
        name: "description",
        content:
          "Live KPIs, infrastructure status, and recent cascade events for the Urban Infrastructure Failure Chain Simulator.",
      },
    ],
  }),
  component: Dashboard,
});

type StatusKey = "operational" | "degraded" | "failed";

const statusMeta: Record<
  StatusKey,
  { label: string; dot: string; text: string; bar: string; ring: string }
> = {
  operational: {
    label: "Operational",
    dot: "bg-success",
    text: "text-success",
    bar: "bg-success",
    ring: "border-success/40 bg-success/10",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-warning",
    text: "text-warning",
    bar: "bg-warning",
    ring: "border-warning/40 bg-warning/10",
  },
  failed: {
    label: "Failed",
    dot: "bg-destructive pulse-dot",
    text: "text-destructive",
    bar: "bg-destructive",
    ring: "border-destructive/40 bg-destructive/10",
  },
};

const systems: {
  name: string;
  icon: typeof Zap;
  status: StatusKey;
  health: number;
}[] = [
  { name: "Power Grid", icon: Zap, status: "operational", health: 92 },
  { name: "Transportation Network", icon: TrafficCone, status: "degraded", health: 58 },
  { name: "Water Supply", icon: Droplets, status: "operational", health: 88 },
  { name: "Healthcare Services", icon: Heart, status: "failed", health: 14 },
  { name: "Telecommunication", icon: Wifi, status: "operational", health: 81 },
  { name: "Emergency Response", icon: Siren, status: "degraded", health: 47 },
];

type EventKind = "failure" | "mitigation" | "warning";

const eventMeta: Record<EventKind, { border: string; bg: string; text: string; label: string }> = {
  failure: {
    border: "border-l-destructive",
    bg: "bg-destructive/5",
    text: "text-destructive",
    label: "Failure",
  },
  mitigation: {
    border: "border-l-success",
    bg: "bg-success/5",
    text: "text-success",
    label: "Mitigation",
  },
  warning: {
    border: "border-l-warning",
    bg: "bg-warning/5",
    text: "text-warning",
    label: "Warning",
  },
};

const events: { time: string; kind: EventKind; text: string }[] = [
  {
    time: "14:32",
    kind: "failure",
    text: "Healthcare failure triggered cascade to Emergency Response",
  },
  {
    time: "14:31",
    kind: "mitigation",
    text: "Backup power deployed to Power Grid node PG-03",
  },
  {
    time: "14:29",
    kind: "warning",
    text: "Transportation rerouting activated on Route B",
  },
  {
    time: "14:25",
    kind: "mitigation",
    text: "Simulation started: Scenario #7 — Power Outage",
  },
];

function ResilienceRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-16 w-16">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={r}
          strokeWidth="6"
          className="stroke-secondary"
          fill="none"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-primary transition-all"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {value}%
      </div>
    </div>
  );
}

function Dashboard() {
  const [apiNodes, setApiNodes] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.nodes
      .getAll()
      .then((data) => {
        if (!active) return;
        setApiNodes(Array.isArray(data) ? data : data?.nodes ?? []);
        setError(null);
      })
      .catch((e) => active && setError(e?.message ?? "Network error"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const iconFor = (name: string) => {
    const k = name.toLowerCase();
    if (k.includes("power")) return Zap;
    if (k.includes("transport")) return TrafficCone;
    if (k.includes("water")) return Droplets;
    if (k.includes("health")) return Heart;
    if (k.includes("tele")) return Wifi;
    if (k.includes("emerg")) return Siren;
    return Activity;
  };

  const liveSystems =
    apiNodes && apiNodes.length
      ? apiNodes.map((n: any) => {
          const status = (n.status ?? "operational") as StatusKey;
          const health =
            typeof n.health === "number"
              ? n.health
              : status === "operational"
                ? 90
                : status === "degraded"
                  ? 55
                  : 15;
          return {
            name: n.name ?? n.node_id ?? "Node",
            icon: iconFor(n.name ?? ""),
            status: (["operational", "degraded", "failed"].includes(status)
              ? status
              : "operational") as StatusKey,
            health,
          };
        })
      : systems;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Mission Control"
        description="Live status across all monitored urban infrastructure layers."
        icon={LayoutDashboard}
      />

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Active Nodes
                </p>
                <p className="mt-2 text-3xl font-bold">24</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-success">
                  <TrendingUp className="h-3 w-3" /> +2 since last hour
                </p>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/15 p-2">
                <Activity className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Failed Nodes
                </p>
                <p className="mt-2 text-3xl font-bold">3</p>
                <Badge className="mt-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive">
                  Critical
                </Badge>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/15 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Avg Recovery Time
                </p>
                <p className="mt-2 text-3xl font-bold">14 min</p>
                <p className="mt-1 text-xs text-muted-foreground">across last 24h</p>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning/15 p-2">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Resilience Score
                </p>
                <p className="mt-2 text-sm text-muted-foreground">System-wide</p>
                <p className="mt-1 text-xs text-success">Stable</p>
              </div>
              <ResilienceRing value={72} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two columns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Infrastructure Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systems.map((s) => {
              const m = statusMeta[s.status];
              const Icon = s.icon;
              return (
                <div
                  key={s.name}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/40 p-3"
                >
                  <div className={`rounded-md border p-2 ${m.ring}`}>
                    <Icon className={`h-4 w-4 ${m.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${m.text}`}>
                          {m.label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full transition-all ${m.bar}`}
                          style={{ width: `${s.health}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-[11px] tabular-nums text-muted-foreground">
                        {s.health}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Simulation Events</CardTitle>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-success">
                <span className="h-2 w-2 rounded-full bg-success pulse-dot" /> Live
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {events.map((e, i) => {
              const m = eventMeta[e.kind];
              return (
                <div
                  key={i}
                  className={`rounded-md border-l-2 ${m.border} ${m.bg} p-3`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      [{e.time}]
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${m.text}`}>
                      {m.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-snug">{e.text}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="destructive"
              className="gap-2"
              asChild
            >
              <Link to="/simulate">
                <ShieldAlert className="h-4 w-4" />
                Trigger New Failure
              </Link>
            </Button>
            <Button className="gap-2" asChild>
              <Link to="/mitigation">
                <ShieldCheck className="h-4 w-4" />
                Apply Mitigation
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/analytics">
                <FileBarChart className="h-4 w-4" />
                View Full Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
