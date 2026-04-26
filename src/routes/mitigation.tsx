import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { notify } from "@/lib/notify";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BatteryCharging,
  Route as RouteIcon,
  ShieldAlert,
  ShieldCheck,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/mitigation")({
  head: () => ({
    meta: [
      { title: "Mitigation Strategies — UrbanSim" },
      {
        name: "description",
        content:
          "Apply real-time interventions to reduce cascading failure impact across urban infrastructure.",
      },
    ],
  }),
  component: MitigationPage,
});

const TARGET_NODES = ["Healthcare", "Telecom", "Emergency Response", "Water Supply"];
const ROUTES = ["Route A", "Route B", "Route C"];

function StatusChip({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-success/50 bg-success/10 text-success"
          : "border-border/60 bg-muted/30 text-muted-foreground"
      }
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? "bg-success pulse-dot" : "bg-muted-foreground/50"
        }`}
      />
      {active ? "Active" : "Not Active"}
    </Badge>
  );
}

function MitigationPage() {
  // ── Card 1: Backup Power ──
  const [powerActive, setPowerActive] = useState(false);
  const [powerTargets, setPowerTargets] = useState<string[]>([
    "Healthcare",
    "Emergency Response",
  ]);
  const togglePowerTarget = (t: string) =>
    setPowerTargets((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  // ── Card 2: Traffic Rerouting ──
  const [rerouteActive, setRerouteActive] = useState(false);
  const [route, setRoute] = useState("Route A");
  const [autoReroute, setAutoReroute] = useState(true);

  // ── Card 3: Emergency Prioritization ──
  const [priorityActive, setPriorityActive] = useState(false);
  const [priorities, setPriorities] = useState<string[]>([
    "Healthcare",
    "Emergency Response",
    "Water",
    "Power",
    "Telecom",
    "Transport",
  ]);
  const movePriority = (i: number, dir: -1 | 1) => {
    setPriorities((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const [medical, setMedical] = useState(70);
  const [police, setPolice] = useState(55);
  const [fire, setFire] = useState(60);

  // ── Effectiveness chart ──
  const chartData = useMemo(
    () => [
      {
        metric: "Downtime Reduction",
        Backup: powerActive ? 38 : 0,
        Rerouting: rerouteActive ? 22 : 0,
        Priority: priorityActive ? 30 : 0,
      },
      {
        metric: "Recovery Time",
        Backup: powerActive ? 35 : 0,
        Rerouting: rerouteActive ? 28 : 0,
        Priority: priorityActive ? 33 : 0,
      },
      {
        metric: "Affected Nodes",
        Backup: powerActive ? 42 : 0,
        Rerouting: rerouteActive ? 25 : 0,
        Priority: priorityActive ? 36 : 0,
      },
    ],
    [powerActive, rerouteActive, priorityActive],
  );

  // ── Combined score ──
  const combined = useMemo(() => {
    const base =
      (powerActive ? 32 : 0) + (rerouteActive ? 22 : 0) + (priorityActive ? 24 : 0);
    // Bonus when all three are active
    const synergy =
      powerActive && rerouteActive && priorityActive ? 10 : 0;
    return Math.min(100, base + synergy);
  }, [powerActive, rerouteActive, priorityActive]);

  const scoreLabel =
    combined >= 75
      ? { text: "High Resilience", color: "text-success" }
      : combined >= 40
      ? { text: "Moderate Resilience", color: "text-warning" }
      : combined > 0
      ? { text: "Low Resilience", color: "text-destructive" }
      : { text: "No Strategies Active", color: "text-muted-foreground" };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Mitigation Strategies"
        description="Apply real-time interventions to reduce cascading failure impact."
        icon={ShieldCheck}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── CARD 1: Backup Power ── */}
        <Card className="glass relative overflow-hidden border-border/50">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="rounded-lg border border-primary/30 bg-primary/15 p-2.5">
                <BatteryCharging className="h-5 w-5 text-primary" />
              </div>
              <StatusChip active={powerActive} />
            </div>
            <CardTitle className="mt-3 text-base">Backup Power Deployment</CardTitle>
            <CardDescription>
              Deploy reserve power units to critical nodes to maintain operations
              during grid failures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Target Nodes
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TARGET_NODES.map((t) => {
                  const checked = powerTargets.includes(t);
                  return (
                    <label
                      key={t}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border/40 bg-card/40 p-2 text-xs hover:border-primary/40"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => togglePowerTarget(t)}
                      />
                      <span>{t}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                Estimated Recovery Reduction
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">35%</p>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => { setPowerActive((v) => { const nv = !v; if (nv) notify.mitigation("Backup power deployed"); return nv; }); }}
            >
              <BatteryCharging className="h-4 w-4" />
              {powerActive ? "Deactivate" : "Deploy Now"}
            </Button>
          </CardContent>
        </Card>

        {/* ── CARD 2: Traffic Rerouting ── */}
        <Card className="glass relative overflow-hidden border-border/50">
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ backgroundColor: "oklch(0.62 0.22 305)" }}
          />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div
                className="rounded-lg border p-2.5"
                style={{
                  borderColor: "oklch(0.62 0.22 305 / 0.35)",
                  backgroundColor: "oklch(0.62 0.22 305 / 0.15)",
                }}
              >
                <RouteIcon
                  className="h-5 w-5"
                  style={{ color: "oklch(0.72 0.20 305)" }}
                />
              </div>
              <StatusChip active={rerouteActive} />
            </div>
            <CardTitle className="mt-3 text-base">Traffic Rerouting</CardTitle>
            <CardDescription>
              Redirect transportation flow away from failed or congested
              infrastructure nodes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Route Selection
              </Label>
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUTES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/40 p-3">
              <div>
                <p className="text-sm font-medium">
                  {autoReroute ? "Automatic" : "Manual"} Rerouting
                </p>
                <p className="text-xs text-muted-foreground">
                  {autoReroute
                    ? "AI selects optimal alternate routes"
                    : "Operator manually approves changes"}
                </p>
              </div>
              <Switch checked={autoReroute} onCheckedChange={setAutoReroute} />
            </div>

            <div
              className="rounded-lg border p-3"
              style={{
                borderColor: "oklch(0.62 0.22 305 / 0.25)",
                backgroundColor: "oklch(0.62 0.22 305 / 0.06)",
              }}
            >
              <p className="text-xs text-muted-foreground">
                Estimated Delay Reduction
              </p>
              <p
                className="mt-1 text-2xl font-bold"
                style={{ color: "oklch(0.72 0.20 305)" }}
              >
                28%
              </p>
            </div>

            <Button
              className="w-full gap-2 text-white hover:opacity-90"
              style={{ backgroundColor: "oklch(0.62 0.22 305)" }}
              onClick={() => { setRerouteActive((v) => { const nv = !v; if (nv) notify.mitigation("Traffic rerouting activated"); return nv; }); }}
            >
              <RouteIcon className="h-4 w-4" />
              {rerouteActive ? "Deactivate" : "Activate Rerouting"}
            </Button>
          </CardContent>
        </Card>

        {/* ── CARD 3: Emergency Prioritization ── */}
        <Card className="glass relative overflow-hidden border-border/50">
          <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="rounded-lg border border-destructive/30 bg-destructive/15 p-2.5">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
              <StatusChip active={priorityActive} />
            </div>
            <CardTitle className="mt-3 text-base">Emergency Prioritization</CardTitle>
            <CardDescription>
              Allocate emergency resources to highest-priority systems and
              vulnerable zones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Priority Order
              </Label>
              <ul className="mt-2 space-y-1.5">
                {priorities.map((p, i) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-card/40 px-2 py-1.5 text-xs"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="w-5 text-muted-foreground tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="flex-1 font-medium">{p}</span>
                    <button
                      onClick={() => movePriority(i, -1)}
                      disabled={i === 0}
                      className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => movePriority(i, 1)}
                      disabled={i === priorities.length - 1}
                      className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Resource Allocation
              </Label>
              {[
                { label: "Medical Units", value: medical, set: setMedical, color: "bg-destructive" },
                { label: "Police", value: police, set: setPolice, color: "bg-primary" },
                { label: "Fire Department", value: fire, set: setFire, color: "bg-warning" },
              ].map((r) => (
                <div key={r.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{r.label}</span>
                    <span className="font-mono tabular-nums">{r.value}%</span>
                  </div>
                  <Slider
                    value={[r.value]}
                    onValueChange={(v) => r.set(v[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              ))}
            </div>

            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => { setPriorityActive((v) => { const nv = !v; if (nv) notify.mitigation("Emergency prioritization applied"); return nv; }); }}
            >
              <ShieldAlert className="h-4 w-4" />
              {priorityActive ? "Deactivate" : "Apply Prioritization"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Effectiveness Comparison ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Strategy Effectiveness Comparison</CardTitle>
            <CardDescription>
              Active strategies and their projected impact across key resilience metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 20, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="oklch(0.35 0.03 256 / 0.3)"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 50]}
                  unit="%"
                  stroke="oklch(0.70 0.03 256)"
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="metric"
                  stroke="oklch(0.70 0.03 256)"
                  fontSize={11}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.22 0.03 256)",
                    border: "1px solid oklch(0.35 0.03 256 / 0.5)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => `${value}%`}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Backup" fill="oklch(0.62 0.20 256)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Rerouting" fill="oklch(0.62 0.22 305)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Priority" fill="oklch(0.65 0.22 25)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Combined Strategy Score</CardTitle>
            <CardDescription>Aggregate resilience across active mitigations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative h-36 w-36">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    strokeWidth="10"
                    className="stroke-secondary"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className={`transition-all ${
                      combined >= 75
                        ? "stroke-success"
                        : combined >= 40
                        ? "stroke-warning"
                        : combined > 0
                        ? "stroke-destructive"
                        : "stroke-muted-foreground"
                    }`}
                    fill="none"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - combined / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold tabular-nums">{combined}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    / 100
                  </span>
                </div>
              </div>
              <p className={`mt-3 text-sm font-semibold ${scoreLabel.color}`}>
                {scoreLabel.text}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                {[powerActive, rerouteActive, priorityActive].filter(Boolean).length} of 3
                strategies active
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
