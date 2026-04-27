import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/lib/notify";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";
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
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Zap,
  Radio,
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

const PRIORITY_RANK: Record<string, number> = {
  "Power Grid": 1,
  Telecom: 2,
  Transportation: 3,
  Healthcare: 4,
  "Water Supply": 5,
  "Emergency Response": 6,
};

const DEFAULT_PRIORITIES = [
  "Healthcare",
  "Emergency Response",
  "Water Supply",
  "Power Grid",
  "Telecom",
  "Transportation",
];

function normalizeNode(name: string): string {
  if (!name) return name;
  const n = name.toLowerCase();
  if (n.includes("power")) return "Power Grid";
  if (n.includes("telecom") || n.includes("tele")) return "Telecom";
  if (n.includes("transport") || n.includes("traffic")) return "Transportation";
  if (n.includes("health") || n.includes("hospital")) return "Healthcare";
  if (n.includes("water")) return "Water Supply";
  if (n.includes("emergency") || n.includes("911")) return "Emergency Response";
  return name;
}

type SystemStatus = "idle" | "critical" | "restored";
type ChipKind = "inactive" | "activating" | "active" | "restoring";

function StrategyChip({ kind, count }: { kind: ChipKind; count?: number }) {
  const styles: Record<ChipKind, string> = {
    inactive: "border-border/60 bg-muted/30 text-muted-foreground",
    activating: "border-warning/50 bg-warning/10 text-warning animate-pulse",
    active: "border-success/50 bg-success/15 text-success",
    restoring: "border-primary/50 bg-primary/15 text-primary",
  };
  const dot: Record<ChipKind, string> = {
    inactive: "bg-muted-foreground/50",
    activating: "bg-warning",
    active: "bg-success",
    restoring: "bg-primary",
  };
  const label: Record<ChipKind, string> = {
    inactive: "Not Active",
    activating: "Activating…",
    active: "ACTIVE",
    restoring: "RESTORING",
  };
  return (
    <Badge variant="outline" className={`${styles[kind]} gap-1.5`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[kind]}`} />
      {label[kind]}
      {kind === "active" && typeof count === "number" && count > 0 && (
        <span className="ml-1 rounded bg-success/20 px-1 text-[10px]">{count} queued</span>
      )}
    </Badge>
  );
}

type LiveEvent = {
  id: number;
  ts: string;
  kind: "info" | "fail" | "mitig" | "warn";
  text: string;
};

function MitigationPage() {
  const [powerActive, setPowerActive] = useState(false);
  const [powerChip, setPowerChip] = useState<ChipKind>("inactive");
  const [powerTargets, setPowerTargets] = useState<string[]>([
    "Healthcare",
    "Emergency Response",
  ]);
  const togglePowerTarget = (t: string) =>
    setPowerTargets((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const [rerouteActive, setRerouteActive] = useState(false);
  const [rerouteChip, setRerouteChip] = useState<ChipKind>("inactive");
  const [route, setRoute] = useState("Route A");
  const [autoReroute, setAutoReroute] = useState(true);

  const [priorityActive, setPriorityActive] = useState(false);
  const [priorityChip, setPriorityChip] = useState<ChipKind>("inactive");
  const [priorities, setPriorities] = useState<string[]>(DEFAULT_PRIORITIES);
  const [systemStatus, setSystemStatus] = useState<Record<string, SystemStatus>>({});
  const [autoBanner, setAutoBanner] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [medical, setMedical] = useState(70);
  const [police, setPolice] = useState(55);
  const [fire, setFire] = useState(60);

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const eventIdRef = useRef(0);
  const pushEvent = (kind: LiveEvent["kind"], text: string) => {
    eventIdRef.current += 1;
    const ts = new Date().toLocaleTimeString();
    setEvents((prev) => [{ id: eventIdRef.current, ts, kind, text }, ...prev].slice(0, 5));
  };

  const [simMetrics, setSimMetrics] = useState<{
    affectedNodes: number;
    resilienceScore: number;
  } | null>(null);

  const movePriority = (i: number, dir: -1 | 1) => {
    setPriorities((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  // Auto-reorder when system statuses change
  useEffect(() => {
    setPriorities((prev) => {
      const next = [...prev];
      next.sort((a, b) => {
        const aCrit = systemStatus[a] === "critical" ? 0 : 1;
        const bCrit = systemStatus[b] === "critical" ? 0 : 1;
        if (aCrit !== bCrit) return aCrit - bCrit;
        return (PRIORITY_RANK[a] ?? 99) - (PRIORITY_RANK[b] ?? 99);
      });
      return next;
    });
  }, [systemStatus]);

  // Socket wiring
  useEffect(() => {
    const onStarted = (payload: { scenarioName?: string } = {}) => {
      pushEvent(
        "info",
        `Simulation started${payload.scenarioName ? `: ${payload.scenarioName}` : ""}`,
      );
      setPriorityChip("activating");
      setSystemStatus({});
      setAutoBanner(false);
      setCountdown(0);
      setSimMetrics(null);
    };

    const onNodeFailed = (payload: { node?: string; nodeName?: string } = {}) => {
      const raw = payload.node || payload.nodeName || "Unknown";
      const node = normalizeNode(raw);
      pushEvent("fail", `${node} failed — auto-queued for restoration`);
      notify.failure(`${node} has failed — cascade initiated`);
      setSystemStatus((prev) => ({ ...prev, [node]: "critical" }));
      setPriorityChip("active");
    };

    const onSimCompleted = (
      payload: {
        affectedNodes?: unknown[];
        metrics?: { resilienceScore?: number };
        resilienceScore?: number;
      } = {},
    ) => {
      const affected = Array.isArray(payload.affectedNodes) ? payload.affectedNodes.length : 0;
      const resilience =
        payload.metrics?.resilienceScore ?? payload.resilienceScore ?? 60;
      setSimMetrics({ affectedNodes: affected, resilienceScore: resilience });
      pushEvent("info", `Simulation complete — ${affected} nodes affected, resilience ${resilience}`);
      setAutoBanner(true);
      setCountdown(8);
      setPowerActive(true);
      setPowerChip("active");
      setRerouteActive(true);
      setRerouteChip("active");
      setPriorityActive(true);
      setPriorityChip("restoring");
    };

    const onMitigationApplied = (payload: { node?: string; type?: string } = {}) => {
      const raw = payload.node || payload.type || "System";
      const node = normalizeNode(raw);
      pushEvent("mitig", `${node} restored via mitigation`);
      notify.mitigation(`${node} restored`);
      setSystemStatus((prev) => ({ ...prev, [node]: "restored" }));
    };

    socket.on("simulation_started", onStarted);
    socket.on("node_failed", onNodeFailed);
    socket.on("simulation_completed", onSimCompleted);
    socket.on("mitigation_applied", onMitigationApplied);

    return () => {
      socket.off("simulation_started", onStarted);
      socket.off("node_failed", onNodeFailed);
      socket.off("simulation_completed", onSimCompleted);
      socket.off("mitigation_applied", onMitigationApplied);
    };
  }, []);

  useEffect(() => {
    if (!autoBanner || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [autoBanner, countdown]);

  const queuedCount = useMemo(
    () => Object.values(systemStatus).filter((s) => s === "critical").length,
    [systemStatus],
  );

  const chartData = useMemo(() => {
    if (simMetrics) {
      const r = simMetrics.resilienceScore;
      const backup = Math.round(r * 0.85);
      const reroute = Math.round(r * 0.72);
      const priority = Math.round(r * 0.78);
      return [
        { metric: "Downtime Reduction", Backup: backup, Rerouting: reroute, Priority: priority },
        {
          metric: "Recovery Time",
          Backup: Math.round(backup * 0.92),
          Rerouting: Math.round(reroute * 0.95),
          Priority: Math.round(priority * 0.9),
        },
        {
          metric: "Affected Nodes",
          Backup: Math.round(backup * 1.05),
          Rerouting: Math.round(reroute * 0.88),
          Priority: priority,
        },
      ];
    }
    return [
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
    ];
  }, [simMetrics, powerActive, rerouteActive, priorityActive]);

  const combinedScore = useMemo(() => {
    if (simMetrics) return simMetrics.resilienceScore;
    const base =
      (powerActive ? 32 : 0) + (rerouteActive ? 22 : 0) + (priorityActive ? 24 : 0);
    const synergy = powerActive && rerouteActive && priorityActive ? 10 : 0;
    return Math.min(100, base + synergy);
  }, [simMetrics, powerActive, rerouteActive, priorityActive]);

  const resilienceBand = useMemo(() => {
    const affected = simMetrics?.affectedNodes ?? 0;
    if (!simMetrics)
      return {
        text: combinedScore > 0 ? "Projected Resilience" : "No Strategies Active",
        className: "text-muted-foreground border-border/60 bg-muted/30",
      };
    if (affected < 40)
      return { text: "High Resilience", className: "text-success border-success/50 bg-success/10" };
    if (affected <= 70)
      return { text: "Medium Resilience", className: "text-warning border-warning/50 bg-warning/10" };
    return { text: "Low Resilience", className: "text-destructive border-destructive/50 bg-destructive/10" };
  }, [simMetrics, combinedScore]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Mitigation Strategies"
        description="Apply real-time interventions to reduce cascading failure impact."
        icon={ShieldCheck}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* CARD 1: Backup Power */}
        <Card className="glass relative overflow-hidden border-border/50">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="rounded-lg border border-primary/30 bg-primary/15 p-2.5">
                <BatteryCharging className="h-5 w-5 text-primary" />
              </div>
              <StrategyChip kind={powerChip} />
            </div>
            <CardTitle className="mt-3 text-base">Backup Power Deployment</CardTitle>
            <CardDescription>
              Deploy reserve power units to critical nodes to maintain operations during grid failures.
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
                      <Checkbox checked={checked} onCheckedChange={() => togglePowerTarget(t)} />
                      <span>{t}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">Estimated Recovery Reduction</p>
              <p className="mt-1 text-2xl font-bold text-primary">35%</p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => {
                setPowerActive((v) => {
                  const nv = !v;
                  setPowerChip(nv ? "active" : "inactive");
                  if (nv) {
                    notify.mitigation("Backup power deployed");
                    pushEvent("mitig", "Backup power deployed manually");
                    api.mitigation
                      .apply({ type: "backup_power", targetNodes: powerTargets })
                      .catch((e) => notify.failure(`API error: ${e?.message ?? "unknown"}`));
                  }
                  return nv;
                });
              }}
            >
              <BatteryCharging className="h-4 w-4" />
              {powerActive ? "Deactivate" : "Deploy Now"}
            </Button>
          </CardContent>
        </Card>

        {/* CARD 2: Traffic Rerouting */}
        <Card className="glass relative overflow-hidden border-border/50">
          <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: "oklch(0.62 0.22 305)" }} />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div
                className="rounded-lg border p-2.5"
                style={{
                  borderColor: "oklch(0.62 0.22 305 / 0.35)",
                  backgroundColor: "oklch(0.62 0.22 305 / 0.15)",
                }}
              >
                <RouteIcon className="h-5 w-5" style={{ color: "oklch(0.72 0.20 305)" }} />
              </div>
              <StrategyChip kind={rerouteChip} />
            </div>
            <CardTitle className="mt-3 text-base">Traffic Rerouting</CardTitle>
            <CardDescription>
              Redirect transportation flow away from failed or congested infrastructure nodes.
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
                <p className="text-sm font-medium">{autoReroute ? "Automatic" : "Manual"} Rerouting</p>
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
              <p className="text-xs text-muted-foreground">Estimated Delay Reduction</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "oklch(0.72 0.20 305)" }}>
                28%
              </p>
            </div>
            <Button
              className="w-full gap-2 text-white hover:opacity-90"
              style={{ backgroundColor: "oklch(0.62 0.22 305)" }}
              onClick={() => {
                setRerouteActive((v) => {
                  const nv = !v;
                  setRerouteChip(nv ? "active" : "inactive");
                  if (nv) {
                    notify.mitigation("Traffic rerouting activated");
                    pushEvent("mitig", "Traffic rerouting activated manually");
                    api.mitigation
                      .apply({ type: "traffic_reroute", targetNodes: [route] })
                      .catch((e) => notify.failure(`API error: ${e?.message ?? "unknown"}`));
                  }
                  return nv;
                });
              }}
            >
              <RouteIcon className="h-4 w-4" />
              {rerouteActive ? "Deactivate" : "Activate Rerouting"}
            </Button>
          </CardContent>
        </Card>

        {/* CARD 3: Emergency Prioritization */}
        <Card className="glass relative overflow-hidden border-border/50">
          <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="rounded-lg border border-destructive/30 bg-destructive/15 p-2.5">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
              <StrategyChip kind={priorityChip} count={queuedCount} />
            </div>
            <CardTitle className="mt-3 text-base">Emergency Prioritization</CardTitle>
            <CardDescription>
              Allocate emergency resources to highest-priority systems and vulnerable zones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {autoBanner && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border border-primary/40 bg-primary/10 p-2.5 text-xs text-primary"
              >
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  🤖 Auto-prioritization complete — restoring in priority order
                </div>
                {countdown > 0 && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Next restoration in <span className="font-mono text-primary">{countdown}s</span>
                  </div>
                )}
              </motion.div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Priority Order
              </Label>
              <ul className="mt-2 space-y-1.5">
                <AnimatePresence initial={false}>
                  {priorities.map((p, i) => {
                    const status = systemStatus[p] ?? "idle";
                    return (
                      <motion.li
                        key={p}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
                          status === "critical"
                            ? "border-destructive/50 bg-destructive/10"
                            : status === "restored"
                              ? "border-success/40 bg-success/10"
                              : "border-border/40 bg-card/40"
                        }`}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-muted/60 font-mono text-[10px]">
                          {status === "restored" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : (
                            i + 1
                          )}
                        </span>
                        <span className="flex-1 truncate">{p}</span>
                        {status === "critical" && (
                          <>
                            <Badge className="h-5 animate-pulse border-transparent bg-destructive text-[9px] text-destructive-foreground">
                              CRITICAL
                            </Badge>
                            <Badge className="h-5 border-transparent bg-success/80 text-[9px] text-success-foreground">
                              AUTO-QUEUED
                            </Badge>
                          </>
                        )}
                        {status === "restored" && (
                          <Badge className="h-5 border-transparent bg-success text-[9px] text-success-foreground">
                            RESTORED
                          </Badge>
                        )}
                        {status === "idle" && (
                          <div className="flex gap-0.5 opacity-40 hover:opacity-100">
                            <button
                              onClick={() => movePriority(i, -1)}
                              className="rounded p-0.5 hover:bg-muted"
                              aria-label="Move up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => movePriority(i, 1)}
                              className="rounded p-0.5 hover:bg-muted"
                              aria-label="Move down"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>

            <div className="space-y-3 rounded-md border border-border/40 bg-card/40 p-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Medical Units</span>
                  <span className="font-mono text-destructive">{medical}%</span>
                </div>
                <Slider value={[medical]} onValueChange={(v) => setMedical(v[0])} max={100} step={5} />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Police</span>
                  <span className="font-mono text-destructive">{police}%</span>
                </div>
                <Slider value={[police]} onValueChange={(v) => setPolice(v[0])} max={100} step={5} />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Fire Department</span>
                  <span className="font-mono text-destructive">{fire}%</span>
                </div>
                <Slider value={[fire]} onValueChange={(v) => setFire(v[0])} max={100} step={5} />
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => {
                setPriorityActive((v) => {
                  const nv = !v;
                  setPriorityChip(nv ? "active" : "inactive");
                  if (nv) {
                    notify.mitigation("Emergency prioritization applied");
                    pushEvent("mitig", "Emergency prioritization applied manually");
                    api.mitigation
                      .apply({ type: "emergency_priority", targetNodes: priorities })
                      .catch((e) => notify.failure(`API error: ${e?.message ?? "unknown"}`));
                  }
                  return nv;
                });
              }}
            >
              <ShieldAlert className="h-4 w-4" />
              {priorityActive ? "Deactivate" : "Apply Prioritization"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Live Mitigation Events */}
      <Card className="glass mt-6 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Live Mitigation Events</CardTitle>
            </div>
            <Badge variant="outline" className="gap-1.5 border-success/40 bg-success/10 text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Streaming
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {events.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              No events yet — start a simulation to see real-time updates.
            </p>
          ) : (
            <ul className="space-y-1.5">
              <AnimatePresence initial={false}>
                {events.map((e) => {
                  const Icon =
                    e.kind === "fail"
                      ? AlertTriangle
                      : e.kind === "mitig"
                        ? CheckCircle2
                        : e.kind === "warn"
                          ? Zap
                          : Activity;
                  const color =
                    e.kind === "fail"
                      ? "text-destructive border-destructive/30 bg-destructive/5"
                      : e.kind === "mitig"
                        ? "text-success border-success/30 bg-success/5"
                        : e.kind === "warn"
                          ? "text-warning border-warning/30 bg-warning/5"
                          : "text-muted-foreground border-border/40 bg-card/40";
                  return (
                    <motion.li
                      key={e.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${color}`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono text-[10px] text-muted-foreground">{e.ts}</span>
                      <span className="flex-1">{e.text}</span>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Effectiveness Comparison */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass border-border/50 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Strategy Effectiveness Comparison</CardTitle>
                <CardDescription>
                  {simMetrics
                    ? `Updated from latest simulation (${simMetrics.affectedNodes} nodes affected)`
                    : "Active strategies and projected impact."}
                </CardDescription>
              </div>
              <Badge variant="outline" className={`gap-1.5 ${resilienceBand.className}`}>
                <Sparkles className="h-3 w-3" />
                {resilienceBand.text}
              </Badge>
            </div>
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
                  domain={[0, 100]}
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
                <Bar
                  dataKey="Backup"
                  fill="oklch(0.62 0.20 256)"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1500}
                />
                <Bar
                  dataKey="Rerouting"
                  fill="oklch(0.62 0.22 305)"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1500}
                />
                <Bar
                  dataKey="Priority"
                  fill="oklch(0.65 0.22 25)"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1500}
                />
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
                  <circle cx="60" cy="60" r="50" strokeWidth="10" className="stroke-secondary" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${
                      combinedScore >= 75
                        ? "stroke-success"
                        : combinedScore >= 40
                          ? "stroke-warning"
                          : combinedScore > 0
                            ? "stroke-destructive"
                            : "stroke-muted-foreground"
                    }`}
                    fill="none"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - combinedScore / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    key={combinedScore}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold tabular-nums"
                  >
                    {combinedScore}
                  </motion.span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    / 100
                  </span>
                </div>
              </div>
              <Badge variant="outline" className={`mt-3 ${resilienceBand.className}`}>
                {resilienceBand.text}
              </Badge>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                {[powerActive, rerouteActive, priorityActive].filter(Boolean).length} of 3 strategies active
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
