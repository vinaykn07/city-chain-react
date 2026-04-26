import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Square,
  Download,
  Zap,
  Droplets,
  Wifi,
  Heart,
  Siren,
  TrafficCone,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { simStore } from "@/lib/simulation-store";
import { notify } from "@/lib/notify";
import { api } from "@/lib/api";

export const Route = createFileRoute("/simulate")({
  head: () => ({
    meta: [
      { title: "Run Simulation — UrbanSim" },
      {
        name: "description",
        content:
          "Configure failure origins, parameters, and run live cascade simulations across urban infrastructure.",
      },
    ],
  }),
  component: SimulatePage,
});

type SystemKey = "power" | "transport" | "water" | "healthcare" | "telecom" | "emergency";

const SYSTEMS: {
  key: SystemKey;
  name: string;
  icon: LucideIcon;
  components: { id: string; label: string }[];
}[] = [
  {
    key: "power",
    name: "Power Grid",
    icon: Zap,
    components: [
      { id: "PG-01", label: "PG-01 Main Substation" },
      { id: "PG-02", label: "PG-02 Backup Station" },
      { id: "PG-03", label: "PG-03 Distribution Node" },
    ],
  },
  {
    key: "transport",
    name: "Transportation",
    icon: TrafficCone,
    components: [
      { id: "TN-01", label: "TN-01 Central Hub" },
      { id: "TN-02", label: "TN-02 Route B Corridor" },
    ],
  },
  {
    key: "water",
    name: "Water Supply",
    icon: Droplets,
    components: [
      { id: "WS-01", label: "WS-01 Treatment Plant" },
      { id: "WS-02", label: "WS-02 Pressure Pump" },
    ],
  },
  {
    key: "healthcare",
    name: "Healthcare",
    icon: Heart,
    components: [
      { id: "HC-01", label: "HC-01 Central Hospital" },
      { id: "HC-02", label: "HC-02 Clinic Network" },
    ],
  },
  {
    key: "telecom",
    name: "Telecom",
    icon: Wifi,
    components: [
      { id: "TC-01", label: "TC-01 Core Switch" },
      { id: "TC-02", label: "TC-02 Tower Cluster" },
    ],
  },
  {
    key: "emergency",
    name: "Emergency Response",
    icon: Siren,
    components: [
      { id: "ER-01", label: "ER-01 Dispatch Center" },
      { id: "ER-02", label: "ER-02 Fleet Coordination" },
    ],
  },
];

const INTENSITY = [
  { label: "Low", color: "text-success", bar: "bg-success" },
  { label: "Medium", color: "text-warning", bar: "bg-warning" },
  { label: "High", color: "text-warning", bar: "bg-warning" },
  { label: "Critical", color: "text-destructive", bar: "bg-destructive" },
];

const SCENARIOS = [
  {
    id: "blackout",
    title: "Northeast Blackout",
    description: "Power Grid failure cascading to all dependent systems.",
    origin: "power" as SystemKey,
    component: "PG-01",
    intensity: 3,
    delay: 4,
  },
  {
    id: "flood",
    title: "Flood Scenario",
    description: "Water network rupture combined with transportation gridlock.",
    origin: "water" as SystemKey,
    component: "WS-01",
    intensity: 2,
    delay: 8,
  },
  {
    id: "cyber",
    title: "Cyber Attack",
    description: "Telecom outage breaking emergency response coordination.",
    origin: "telecom" as SystemKey,
    component: "TC-01",
    intensity: 3,
    delay: 3,
  },
];

type GraphNode = {
  id: SystemKey;
  code: string;
  name: string;
  icon: LucideIcon;
  x: number;
  y: number;
};

const GRAPH_NODES: GraphNode[] = [
  { id: "power", code: "PG", name: "Power", icon: Zap, x: 250, y: 60 },
  { id: "transport", code: "TN", name: "Transport", icon: TrafficCone, x: 80, y: 180 },
  { id: "water", code: "WS", name: "Water", icon: Droplets, x: 180, y: 200 },
  { id: "healthcare", code: "HC", name: "Health", icon: Heart, x: 320, y: 200 },
  { id: "telecom", code: "TC", name: "Telecom", icon: Wifi, x: 420, y: 180 },
  { id: "emergency", code: "ER", name: "Emergency", icon: Siren, x: 250, y: 320 },
];

const GRAPH_EDGES: [SystemKey, SystemKey][] = [
  ["power", "transport"],
  ["power", "water"],
  ["power", "healthcare"],
  ["power", "telecom"],
  ["power", "emergency"],
  ["telecom", "emergency"],
  ["telecom", "healthcare"],
  ["transport", "emergency"],
];

type NodeStatus = "operational" | "degraded" | "failed" | "mitigated";
type LogKind = "info" | "failure" | "mitigation" | "warning";
type LogEntry = { t: number; kind: LogKind; text: string };

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SimulatePage() {
  const [originSystem, setOriginSystem] = useState<SystemKey>("power");
  const [originComponent, setOriginComponent] = useState<string>("PG-01");
  const [intensity, setIntensity] = useState<number>(2);
  const [delay, setDelay] = useState<number>(5);
  const [mitigation, setMitigation] = useState<boolean>(true);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [statuses, setStatuses] = useState<Record<SystemKey, NodeStatus>>({
    power: "operational",
    transport: "operational",
    water: "operational",
    healthcare: "operational",
    telecom: "operational",
    emergency: "operational",
  });
  const [propagating, setPropagating] = useState<SystemKey | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const tickRef = useRef<number | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const components = useMemo(
    () => SYSTEMS.find((s) => s.key === originSystem)?.components ?? [],
    [originSystem],
  );

  useEffect(() => {
    if (!components.find((c) => c.id === originComponent)) {
      setOriginComponent(components[0]?.id ?? "");
    }
  }, [components, originComponent]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs]);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const loadScenario = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setOriginSystem(s.origin);
    setOriginComponent(s.component);
    setIntensity(s.intensity);
    setDelay(s.delay);
  };

  const resetSimState = () => {
    setStatuses({
      power: "operational",
      transport: "operational",
      water: "operational",
      healthcare: "operational",
      telecom: "operational",
      emergency: "operational",
    });
    setPropagating(null);
    setLogs([]);
    setElapsed(0);
  };

  const stopSim = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    setRunning(false);
    setPropagating(null);
    simStore.stop();
  };

  const startSim = async () => {
    resetSimState();
    setRunning(true);
    setApiError(null);
    setApiLoading(true);
    simStore.start(`Origin: ${originSystem}`);
    notify.failure(`${originSystem} ${originComponent}`);

    // Fire backend simulation
    try {
      const scenarioName =
        SCENARIOS.find(
          (s) => s.origin === originSystem && s.component === originComponent,
        )?.title ?? `${originSystem} failure`;
      const resp = await api.simulations.run({
        scenarioName,
        triggerNode: originComponent,
        failureIntensity: INTENSITY[intensity].label,
      });
      const cascade: any[] =
        resp?.cascade ?? resp?.cascadeLog ?? resp?.log ?? [];
      if (Array.isArray(cascade) && cascade.length) {
        setLogs((l) => [
          ...l,
          ...cascade.map((c: any, i: number) => ({
            t: typeof c.t === "number" ? c.t : i,
            kind: (c.kind ?? "info") as LogKind,
            text: typeof c === "string" ? c : (c.text ?? c.message ?? JSON.stringify(c)),
          })),
        ]);
      }
    } catch (e: any) {
      setApiError(e?.message ?? "Network error");
    } finally {
      setApiLoading(false);
    }

    const propagationOrder: SystemKey[] = (() => {
      const order: SystemKey[] = [originSystem];
      const seen = new Set<SystemKey>([originSystem]);
      let frontier: SystemKey[] = [originSystem];
      while (frontier.length) {
        const next: SystemKey[] = [];
        for (const f of frontier) {
          for (const [a, b] of GRAPH_EDGES) {
            if (a === f && !seen.has(b)) {
              seen.add(b);
              next.push(b);
              order.push(b);
            }
          }
        }
        frontier = next;
      }
      return order;
    })();

    const stepDelay = Math.max(1, Math.round(delay / 2));
    const originComp = originComponent;
    const originName = SYSTEMS.find((s) => s.key === originSystem)?.name ?? "";
    const intensityLabel = INTENSITY[intensity].label;

    const events: { at: number; run: () => void }[] = [];

    events.push({
      at: 1,
      run: () => {
        setLogs((l) => [
          ...l,
          {
            t: 1,
            kind: "info",
            text: `Simulation started. Initial failure: ${originName} ${originComp} (${intensityLabel})`,
          },
        ]);
      },
    });

    propagationOrder.forEach((sys, idx) => {
      const at = 1 + (idx + 1) * stepDelay;
      events.push({
        at,
        run: () => {
          setPropagating(sys);
          const sysName = SYSTEMS.find((s) => s.key === sys)?.name ?? sys;
          if (idx === 0) {
            setStatuses((p) => ({ ...p, [sys]: "failed" }));
            setLogs((l) => [
              ...l,
              { t: at, kind: "failure", text: `${sysName}: FAILED` },
            ]);
          } else {
            const willFail =
              intensity >= 2 ||
              (intensity === 1 && idx <= 2) ||
              idx === propagationOrder.length - 1;
            const newStatus: NodeStatus = willFail ? "failed" : "degraded";
            setStatuses((p) => ({ ...p, [sys]: newStatus }));
            setLogs((l) => [
              ...l,
              { t: at, kind: "info", text: `Propagating to: ${sysName}` },
              {
                t: at,
                kind: willFail ? "failure" : "warning",
                text: `${sysName}: ${willFail ? "FAILED" : "DEGRADED"}`,
              },
            ]);
          }
        },
      });
    });

    if (mitigation) {
      const at = 2 + (propagationOrder.length + 1) * stepDelay;
      events.push({
        at,
        run: () => {
          setStatuses((p) => {
            const next = { ...p };
            (Object.keys(next) as SystemKey[]).forEach((k) => {
              if (next[k] === "failed") next[k] = "mitigated";
              if (next[k] === "degraded") next[k] = "operational";
            });
            return next;
          });
          setPropagating(null);
          setLogs((l) => [
            ...l,
            {
              t: at,
              kind: "mitigation",
              text: "Mitigation: Backup Power Deployed — recovery in progress",
            },
            { t: at, kind: "mitigation", text: "Simulation complete." },
          ]);
        },
      });
    } else {
      const at = 2 + (propagationOrder.length + 1) * stepDelay;
      events.push({
        at,
        run: () => {
          setPropagating(null);
          setLogs((l) => [
            ...l,
            { t: at, kind: "info", text: "Simulation complete. No mitigation applied." },
          ]);
        },
      });
    }

    const totalDuration = events[events.length - 1].at + 2;
    let t = 0;

    tickRef.current = window.setInterval(() => {
      t += 1;
      setElapsed(t);
      events.filter((e) => e.at === t).forEach((e) => e.run());
      if (t >= totalDuration) {
        if (tickRef.current) window.clearInterval(tickRef.current);
        tickRef.current = null;
        setRunning(false);
        simStore.stop();
        notify.mitigation("Simulation completed — results ready");
      }
    }, 1000);
  };

  const exportResults = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      config: {
        originSystem,
        originComponent,
        intensity: INTENSITY[intensity].label,
        propagationDelay: delay,
        mitigationEnabled: mitigation,
      },
      finalStatuses: statuses,
      log: logs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (s: NodeStatus) => {
    switch (s) {
      case "failed":
        return "oklch(0.65 0.22 25)";
      case "degraded":
        return "oklch(0.78 0.16 75)";
      case "mitigated":
        return "oklch(0.62 0.20 256)";
      default:
        return "oklch(0.72 0.18 145)";
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Run Simulation"
        description="Configure a failure origin, parameters and watch the cascade unfold in real time."
        icon={PlayCircle}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* LEFT PANEL — Configuration (40%) */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Select Failure Origin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Infrastructure System</Label>
                <Select
                  value={originSystem}
                  onValueChange={(v) => setOriginSystem(v as SystemKey)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEMS.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        <div className="flex items-center gap-2">
                          <s.icon className="h-3.5 w-3.5" />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Specific Component</Label>
                <Select value={originComponent} onValueChange={setOriginComponent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {components.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Failure Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Failure Intensity</Label>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${INTENSITY[intensity].color}`}
                  >
                    {INTENSITY[intensity].label}
                  </span>
                </div>
                <Slider
                  value={[intensity]}
                  onValueChange={(v) => setIntensity(v[0])}
                  min={0}
                  max={3}
                  step={1}
                />
                <div className="flex justify-between gap-1">
                  {INTENSITY.map((i, idx) => (
                    <div
                      key={i.label}
                      className={`h-1 flex-1 rounded-full ${
                        idx <= intensity ? i.bar : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Propagation Delay</Label>
                  <span className="font-mono text-xs tabular-nums">{delay}s</span>
                </div>
                <Slider
                  value={[delay]}
                  onValueChange={(v) => setDelay(v[0])}
                  min={0}
                  max={60}
                  step={1}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Instant</span>
                  <span>60s</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/40 bg-card/40 p-3">
                <div>
                  <p className="text-sm font-medium">Enable Mitigation</p>
                  <p className="text-xs text-muted-foreground">
                    Apply automatic recovery strategies during simulation
                  </p>
                </div>
                <Switch checked={mitigation} onCheckedChange={setMitigation} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Preset Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SCENARIOS.map((s) => (
                <div
                  key={s.id}
                  className="group rounded-lg border border-border/40 bg-card/40 p-3 transition-all hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{s.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-xs group-hover:border-primary/60 group-hover:text-primary"
                      onClick={() => loadScenario(s.id)}
                    >
                      Load
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full gap-2 bg-gradient-to-r from-primary to-primary-glow text-base font-semibold shadow-[var(--shadow-glow)]"
            onClick={startSim}
            disabled={running}
          >
            <Play className="h-5 w-5 fill-current" />
            {running ? "Simulation Running…" : "Start Simulation"}
          </Button>
        </div>

        {/* RIGHT PANEL — Live Viewer (60%) */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="glass border-border/50">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    running ? "bg-destructive pulse-dot" : "bg-muted-foreground/40"
                  }`}
                />
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    running ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {running ? "Simulation Running" : elapsed > 0 ? "Simulation Ended" : "Idle"}
                </span>
              </div>
              <div className="font-mono text-sm tabular-nums text-muted-foreground">
                Elapsed: <span className="text-foreground">{fmtTime(elapsed)}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={stopSim}
                  disabled={!running}
                >
                  <Square className="h-3.5 w-3.5 fill-current" /> Stop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={exportResults}
                  disabled={logs.length === 0}
                >
                  <Download className="h-3.5 w-3.5" /> Export Results
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Cascade Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[360px] w-full overflow-hidden rounded-md border border-border/40 bg-background/40">
                <svg viewBox="0 0 500 380" className="h-full w-full">
                  <defs>
                    <marker
                      id="sim-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="oklch(0.70 0.03 256 / 0.7)" />
                    </marker>
                  </defs>

                  {GRAPH_EDGES.map(([a, b], i) => {
                    const na = GRAPH_NODES.find((n) => n.id === a)!;
                    const nb = GRAPH_NODES.find((n) => n.id === b)!;
                    const failedEdge =
                      statuses[a] === "failed" || statuses[b] === "failed";
                    const dx = nb.x - na.x;
                    const dy = nb.y - na.y;
                    const len = Math.hypot(dx, dy) || 1;
                    const ux = dx / len;
                    const uy = dy / len;
                    const x1 = na.x + ux * 28;
                    const y1 = na.y + uy * 28;
                    const x2 = nb.x - ux * 32;
                    const y2 = nb.y - uy * 32;
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={
                          failedEdge
                            ? "oklch(0.65 0.22 25)"
                            : "oklch(0.70 0.03 256 / 0.5)"
                        }
                        strokeWidth={failedEdge ? 2 : 1.4}
                        strokeDasharray="4 4"
                        markerEnd="url(#sim-arrow)"
                      />
                    );
                  })}

                  {propagating &&
                    (() => {
                      const n = GRAPH_NODES.find((g) => g.id === propagating);
                      if (!n) return null;
                      return (
                        <g>
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r="28"
                            fill="none"
                            stroke="oklch(0.65 0.22 25)"
                            strokeWidth="2"
                          >
                            <animate
                              attributeName="r"
                              from="28"
                              to="80"
                              dur="1.4s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              from="0.8"
                              to="0"
                              dur="1.4s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        </g>
                      );
                    })()}

                  {GRAPH_NODES.map((n) => {
                    const s = statuses[n.id];
                    const color = statusColor(s);
                    const isFailed = s === "failed";
                    return (
                      <g
                        key={n.id}
                        transform={`translate(${n.x}, ${n.y})`}
                        style={{
                          filter: isFailed
                            ? "drop-shadow(0 0 10px oklch(0.65 0.22 25 / 0.7))"
                            : "none",
                        }}
                      >
                        <circle
                          r="28"
                          fill="oklch(0.22 0.03 256)"
                          stroke={color}
                          strokeWidth="2.5"
                          className={isFailed ? "node-fail-blink" : ""}
                        />
                        <circle
                          r="28"
                          fill={`color-mix(in oklab, ${color} 14%, transparent)`}
                        />
                        <foreignObject x="-12" y="-14" width="24" height="24">
                          <div className="flex h-full w-full items-center justify-center">
                            <n.icon className="h-3.5 w-3.5" style={{ color }} />
                          </div>
                        </foreignObject>
                        <text
                          textAnchor="middle"
                          y="10"
                          className="fill-foreground"
                          fontSize="9"
                          fontWeight="700"
                        >
                          {n.code}
                        </text>
                        <text
                          textAnchor="middle"
                          y="44"
                          fontSize="10"
                          className="fill-muted-foreground"
                        >
                          {n.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded-md border border-border/40 bg-card/80 px-2.5 py-1.5 text-[10px] backdrop-blur">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success" />Operational</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-warning" />Degraded</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-dot" />Failed</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Mitigated</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Live Event Log</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                {logs.length} events
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {apiLoading && <div className="text-[11px] text-muted-foreground">Calling /api/simulations…</div>}
              {apiError && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">API error: {apiError}</div>}
              <div className="h-[220px] overflow-auto rounded-md border border-border/40 bg-[oklch(0.12_0.02_256)] p-3 font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">
                    <span className="text-success">$</span> awaiting simulation start…
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {logs.map((l, i) => {
                      const color =
                        l.kind === "failure"
                          ? "text-destructive"
                          : l.kind === "mitigation"
                          ? "text-success"
                          : l.kind === "warning"
                          ? "text-warning"
                          : "text-foreground/90";
                      return (
                        <div key={i} className={`leading-relaxed ${color}`}>
                          <span className="text-muted-foreground">[{fmtTime(l.t)}]</span>{" "}
                          {l.text}
                        </div>
                      );
                    })}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
