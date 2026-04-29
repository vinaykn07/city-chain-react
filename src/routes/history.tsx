import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/ApiState";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Search,
  CalendarIcon,
  Download,
  Eye,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Droplets,
  Wifi,
  Heart,
  Siren,
  TrafficCone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Simulation History — UrbanSim" },
      {
        name: "description",
        content:
          "Browse, filter and inspect past urban infrastructure failure simulations.",
      },
    ],
  }),
  component: HistoryPage,
});

type SystemKey = "Power" | "Transport" | "Water" | "Healthcare" | "Telecom" | "Emergency";

const SYSTEM_META: Record<SystemKey, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  Power:      { icon: Zap,          color: "text-[oklch(0.72_0.18_250)]", bg: "bg-[oklch(0.65_0.20_250/0.12)]", border: "border-[oklch(0.65_0.20_250/0.4)]" },
  Transport:  { icon: TrafficCone,  color: "text-[oklch(0.72_0.20_305)]", bg: "bg-[oklch(0.62_0.22_305/0.12)]", border: "border-[oklch(0.62_0.22_305/0.4)]" },
  Water:      { icon: Droplets,     color: "text-[oklch(0.78_0.14_210)]", bg: "bg-[oklch(0.75_0.16_210/0.12)]", border: "border-[oklch(0.75_0.16_210/0.4)]" },
  Healthcare: { icon: Heart,        color: "text-[oklch(0.78_0.18_350)]", bg: "bg-[oklch(0.72_0.20_350/0.12)]", border: "border-[oklch(0.72_0.20_350/0.4)]" },
  Telecom:    { icon: Wifi,         color: "text-[oklch(0.78_0.16_55)]",  bg: "bg-[oklch(0.72_0.18_55/0.12)]",  border: "border-[oklch(0.72_0.18_55/0.4)]"  },
  Emergency:  { icon: Siren,        color: "text-destructive",            bg: "bg-destructive/12",              border: "border-destructive/40"             },
};

type Sim = {
  id: string;
  scenario: string;
  trigger: SystemKey;
  triggerNode: string;
  failedCount: number;
  failedSystems: SystemKey[];
  mitigations: string[];
  recovery: string;
  date: Date;
  // 12 points cascade progression (affected nodes over time)
  cascade: number[];
  metrics: {
    downtime: string;
    responseDelay: string;
    cascadeDepth: number;
    resilience: number;
  };
};

const SIMULATIONS: Sim[] = [
  {
    id: "SIM-2024-007",
    scenario: "Northeast Blackout Scenario",
    trigger: "Power",
    triggerNode: "PG-01",
    failedCount: 5,
    failedSystems: ["Power", "Healthcare", "Telecom", "Emergency", "Transport"],
    mitigations: ["Backup Power", "Prioritization"],
    recovery: "12 min",
    date: new Date("2026-04-25T14:32:00"),
    cascade: [1, 1, 2, 3, 4, 5, 5, 5, 4, 3, 2, 1],
    metrics: { downtime: "22 min", responseDelay: "3.2 min", cascadeDepth: 4, resilience: 68 },
  },
  {
    id: "SIM-2024-006",
    scenario: "Flood Cascade",
    trigger: "Water",
    triggerNode: "WS-01",
    failedCount: 3,
    failedSystems: ["Water", "Transport", "Emergency"],
    mitigations: ["Rerouting"],
    recovery: "18 min",
    date: new Date("2026-04-24T09:15:00"),
    cascade: [1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 0],
    metrics: { downtime: "26 min", responseDelay: "4.1 min", cascadeDepth: 3, resilience: 72 },
  },
  {
    id: "SIM-2024-005",
    scenario: "Telecom Cyber Attack",
    trigger: "Telecom",
    triggerNode: "TC-01",
    failedCount: 4,
    failedSystems: ["Telecom", "Healthcare", "Emergency", "Transport"],
    mitigations: ["Rerouting", "Prioritization"],
    recovery: "22 min",
    date: new Date("2026-04-23T18:47:00"),
    cascade: [1, 1, 2, 3, 4, 4, 4, 3, 3, 2, 1, 1],
    metrics: { downtime: "31 min", responseDelay: "5.0 min", cascadeDepth: 4, resilience: 61 },
  },
  {
    id: "SIM-2024-004",
    scenario: "Substation Backup Failure",
    trigger: "Power",
    triggerNode: "PG-03",
    failedCount: 2,
    failedSystems: ["Power", "Telecom"],
    mitigations: ["Backup Power"],
    recovery: "9 min",
    date: new Date("2026-04-22T11:02:00"),
    cascade: [1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0],
    metrics: { downtime: "14 min", responseDelay: "1.8 min", cascadeDepth: 2, resilience: 84 },
  },
  {
    id: "SIM-2024-003",
    scenario: "Hospital Power Surge",
    trigger: "Healthcare",
    triggerNode: "HC-01",
    failedCount: 2,
    failedSystems: ["Healthcare", "Emergency"],
    mitigations: ["Prioritization", "Backup Power"],
    recovery: "14 min",
    date: new Date("2026-04-20T07:28:00"),
    cascade: [1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0],
    metrics: { downtime: "18 min", responseDelay: "2.5 min", cascadeDepth: 2, resilience: 79 },
  },
  {
    id: "SIM-2024-002",
    scenario: "Route B Closure",
    trigger: "Transport",
    triggerNode: "TN-02",
    failedCount: 2,
    failedSystems: ["Transport", "Emergency"],
    mitigations: ["Rerouting"],
    recovery: "11 min",
    date: new Date("2026-04-19T16:10:00"),
    cascade: [1, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0],
    metrics: { downtime: "13 min", responseDelay: "1.2 min", cascadeDepth: 2, resilience: 81 },
  },
  {
    id: "SIM-2024-001",
    scenario: "Pump Pressure Drop",
    trigger: "Water",
    triggerNode: "WS-02",
    failedCount: 1,
    failedSystems: ["Water"],
    mitigations: ["Backup Power"],
    recovery: "8 min",
    date: new Date("2026-04-18T05:55:00"),
    cascade: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    metrics: { downtime: "10 min", responseDelay: "0.9 min", cascadeDepth: 1, resilience: 90 },
  },
  {
    id: "SIM-2023-058",
    scenario: "Dispatch Center Crash",
    trigger: "Emergency",
    triggerNode: "ER-01",
    failedCount: 3,
    failedSystems: ["Emergency", "Healthcare", "Transport"],
    mitigations: ["Prioritization"],
    recovery: "25 min",
    date: new Date("2026-04-17T22:14:00"),
    cascade: [1, 1, 2, 3, 3, 3, 3, 2, 2, 1, 1, 0],
    metrics: { downtime: "29 min", responseDelay: "4.7 min", cascadeDepth: 3, resilience: 64 },
  },
];

// Mini graph for drawer snapshot
type GNode = { id: SystemKey; x: number; y: number };
const GRAPH_NODES: GNode[] = [
  { id: "Power", x: 200, y: 40 },
  { id: "Transport", x: 60, y: 140 },
  { id: "Water", x: 140, y: 160 },
  { id: "Healthcare", x: 260, y: 160 },
  { id: "Telecom", x: 340, y: 140 },
  { id: "Emergency", x: 200, y: 250 },
];
const GRAPH_EDGES: [SystemKey, SystemKey][] = [
  ["Power", "Transport"],
  ["Power", "Water"],
  ["Power", "Healthcare"],
  ["Power", "Telecom"],
  ["Power", "Emergency"],
  ["Telecom", "Emergency"],
  ["Telecom", "Healthcare"],
  ["Transport", "Emergency"],
];

const PAGE_SIZE = 4;

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 100;
  const h = 28;
  const stepX = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  const areaPath = `M0,${h} L${points
    .split(" ")
    .join(" L")} L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none">
      <path d={areaPath} fill={color} fillOpacity={0.2} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function GraphSnapshot({ failed }: { failed: SystemKey[] }) {
  const failedSet = new Set(failed);
  const triggerColor = "oklch(0.65 0.22 25)";
  const okColor = "oklch(0.72 0.18 145)";
  return (
    <svg viewBox="0 0 400 290" className="h-full w-full">
      {GRAPH_EDGES.map(([a, b], i) => {
        const na = GRAPH_NODES.find((n) => n.id === a)!;
        const nb = GRAPH_NODES.find((n) => n.id === b)!;
        const isFailedEdge = failedSet.has(a) && failedSet.has(b);
        return (
          <line
            key={i}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke={isFailedEdge ? triggerColor : "oklch(0.70 0.03 256 / 0.35)"}
            strokeWidth={isFailedEdge ? 1.6 : 1}
            strokeDasharray="3 3"
          />
        );
      })}
      {GRAPH_NODES.map((n) => {
        const isFailed = failedSet.has(n.id);
        const color = isFailed ? triggerColor : okColor;
        return (
          <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
            <circle
              r="20"
              fill="oklch(0.22 0.03 256)"
              stroke={color}
              strokeWidth="2"
              style={{
                filter: isFailed
                  ? "drop-shadow(0 0 8px oklch(0.65 0.22 25 / 0.6))"
                  : "none",
              }}
            />
            <text
              textAnchor="middle"
              y="3"
              fontSize="9"
              fontWeight="700"
              fill="oklch(0.97 0.01 240)"
            >
              {n.id.slice(0, 4)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HistoryPage() {
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Sim | null>(null);
  const [apiSims, setApiSims] = useState<Sim[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    let isFirst = true;

    const fetchSims = async () => {
      try {
        const data = await api.simulations.getAll();
        if (!active) return;
        const list: any[] = Array.isArray(data) ? data : (data?.data ?? data?.simulations ?? []);
        const mapped: Sim[] = list.map((r: any, i: number) => {
          const triggerRaw = (r.trigger ?? r.triggerType ?? r.triggerSystem ?? r.triggerNode ?? "Power").toString();
          const trigger = (
            ["Power", "Transport", "Water", "Healthcare", "Telecom", "Emergency"].find((s) =>
              triggerRaw.toLowerCase().includes(s.toLowerCase()),
            ) ?? "Power"
          ) as SystemKey;
          return {
            id: r.id ?? r._id ?? r.simulationId ?? `SIM-${String(i + 1).padStart(4, "0")}`,
            scenario: r.scenarioName ?? r.scenario ?? "Untitled scenario",
            trigger,
            triggerNode: r.triggerNode ?? r.trigger_node ?? "—",
            failedCount: r.failedCount ?? r.failed_nodes_count ?? (r.failedNodes?.length ?? r.failedSystems?.length ?? 0),
            failedSystems: (r.failedSystems ?? [trigger]) as SystemKey[],
            mitigations: Array.isArray(r.mitigations) ? r.mitigations : r.mitigation ? [r.mitigation] : [],
            recovery: r.recovery ?? (r.recoveryTime != null ? `${r.recoveryTime} min` : "—"),
            date: new Date(r.date ?? r.createdAt ?? Date.now()),
            cascade: Array.isArray(r.cascade) ? r.cascade : [1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0],
            metrics: {
              downtime: r.metrics?.downtime ?? (r.downtime != null ? `${r.downtime} min` : "—"),
              responseDelay: r.metrics?.responseDelay ?? "—",
              cascadeDepth: r.metrics?.cascadeDepth ?? r.cascadeDepth ?? 1,
              resilience: r.metrics?.resilience ?? r.resilience ?? r.resilienceScore ?? 70,
            },
          };
        });
        setApiSims(mapped);
        setLastUpdated(new Date());
        setError(null);
      } catch (e: any) {
        if (active && isFirst) setError(e?.message ?? "Network error");
      } finally {
        if (active && isFirst) {
          setLoading(false);
          isFirst = false;
        }
      }
    };

    fetchSims();
    const id = setInterval(fetchSims, 5000);
    const onCreated = () => fetchSims();
    if (typeof window !== "undefined") {
      window.addEventListener("urbansim:simulation-created", onCreated);
    }
    return () => {
      active = false;
      clearInterval(id);
      if (typeof window !== "undefined") {
        window.removeEventListener("urbansim:simulation-created", onCreated);
      }
    };
  }, []);

  const SOURCE: Sim[] = apiSims ?? SIMULATIONS;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SOURCE.filter((s) => {
      if (systemFilter !== "all" && s.trigger !== systemFilter) return false;
      if (dateRange?.from && s.date < dateRange.from) return false;
      if (dateRange?.to) {
        const end = new Date(dateRange.to);
        end.setHours(23, 59, 59, 999);
        if (s.date > end) return false;
      }
      if (q) {
        const hay = `${s.id} ${s.scenario} ${s.triggerNode} ${s.mitigations.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, systemFilter, dateRange, SOURCE]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = SOURCE.length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = SOURCE.filter((s) => {
      const ref = new Date("2026-04-25");
      const cutoff = new Date(ref);
      cutoff.setDate(ref.getDate() - 7);
      return s.date >= cutoff;
    }).length;
    const avgRes = total
      ? Math.round(SOURCE.reduce((a, s) => a + s.metrics.resilience, 0) / total)
      : 0;
    return { total, thisWeek, avgRes };
  }, [SOURCE]);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(SOURCE, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportOne = (s: Sim) => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Simulation History"
        description="Browse, filter and inspect every past failure simulation."
        icon={History}
        actions={
          <Button onClick={exportAll} className="gap-2">
            <Download className="h-4 w-4" /> Export All
          </Button>
        }
      />

      {loading && <div className="mb-4"><LoadingState label="Fetching simulation history…" /></div>}
      {error && <div className="mb-4"><ErrorState message={error} /></div>}

      {/* Summary chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1.5 border-border/60 bg-card/40 px-3 py-1.5 text-xs">
          <span className="font-semibold tabular-nums text-foreground">{stats.total}</span>
          <span className="text-muted-foreground">Total Simulations</span>
        </Badge>
        <Badge variant="outline" className="gap-1.5 border-primary/40 bg-primary/10 px-3 py-1.5 text-xs">
          <span className="font-semibold tabular-nums text-primary">{stats.thisWeek}</span>
          <span className="text-muted-foreground">This Week</span>
        </Badge>
        <Badge variant="outline" className="gap-1.5 border-success/40 bg-success/10 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">Avg Resilience:</span>
          <span className="font-semibold tabular-nums text-success">{stats.avgRes}%</span>
        </Badge>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ""}
        </div>
      </div>

      {/* Filter bar */}
      <Card className="glass mb-4 border-border/50">
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID, scenario, trigger…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>

          <Select
            value={systemFilter}
            onValueChange={(v) => {
              setSystemFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All systems" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Infrastructure</SelectItem>
              {(Object.keys(SYSTEM_META) as SystemKey[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start gap-2 text-left font-normal",
                  !dateRange && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd")} – {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(r) => {
                  setDateRange(r);
                  setPage(1);
                }}
                numberOfMonths={2}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
              {dateRange && (
                <div className="border-t border-border/40 p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setDateRange(undefined)}
                  >
                    Clear date range
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Cards */}
      {pageRows.length === 0 ? (
        <Card className="glass border-border/50">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No simulations match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pageRows.map((sim) => {
            const meta = SYSTEM_META[sim.trigger];
            const TriggerIcon = meta.icon;
            return (
              <Card
                key={sim.id}
                className="glass group relative overflow-hidden border-border/50 transition-all hover:border-primary/40"
              >
                <div className={cn("absolute inset-y-0 left-0 w-1", meta.bg)} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {sim.id}
                      </p>
                      <h3 className="mt-0.5 truncate text-sm font-semibold">
                        {sim.scenario}
                      </h3>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-destructive/40 bg-destructive/10 text-destructive"
                    >
                      {sim.failedCount} failed
                    </Badge>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn("gap-1", meta.border, meta.bg, meta.color)}
                    >
                      <TriggerIcon className="h-3 w-3" />
                      {sim.trigger}
                      <span className="ml-1 font-mono text-[10px] opacity-70">
                        {sim.triggerNode}
                      </span>
                    </Badge>
                    {sim.mitigations.map((m) => (
                      <Badge
                        key={m}
                        variant="outline"
                        className="border-success/40 bg-success/10 text-success"
                      >
                        <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                        {m}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Recovery
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 font-semibold">
                        <Clock className="h-3 w-3 text-muted-foreground" /> {sim.recovery}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Date
                      </p>
                      <p className="mt-0.5 font-mono tabular-nums text-foreground/90">
                        {format(sim.date, "MMM d, HH:mm")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Cascade Progression
                    </p>
                    <Sparkline data={sim.cascade} color="oklch(0.65 0.22 25)" />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => setSelected(sim)}
                    >
                      <Eye className="h-3.5 w-3.5" /> View Details
                    </Button>
                    <Button size="sm" className="flex-1 gap-1.5">
                      <RotateCw className="h-3.5 w-3.5" /> Re-run
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>
          <span className="font-mono">
            {safePage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Details Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {selected.id}
                </p>
                <SheetTitle className="text-xl">{selected.scenario}</SheetTitle>
                <SheetDescription>
                  Triggered at {format(selected.date, "MMM d, yyyy 'at' HH:mm")} ·{" "}
                  Origin {selected.triggerNode}
                </SheetDescription>
              </SheetHeader>

              {/* Metrics */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {[
                  { label: "Downtime", value: selected.metrics.downtime },
                  { label: "Response Delay", value: selected.metrics.responseDelay },
                  { label: "Cascade Depth", value: `${selected.metrics.cascadeDepth} nodes` },
                  {
                    label: "Resilience Score",
                    value: `${selected.metrics.resilience}%`,
                    color:
                      selected.metrics.resilience >= 75
                        ? "text-success"
                        : selected.metrics.resilience >= 50
                        ? "text-warning"
                        : "text-destructive",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-md border border-border/40 bg-card/40 p-3"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </p>
                    <p className={cn("mt-1 text-lg font-bold", m.color)}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Graph snapshot */}
              <div className="mt-6">
                <h4 className="mb-2 text-sm font-semibold">Failure Snapshot</h4>
                <div className="h-[260px] rounded-md border border-border/40 bg-background/40 p-2">
                  <GraphSnapshot failed={selected.failedSystems} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Operational
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> Failed
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-6">
                <h4 className="mb-3 text-sm font-semibold">Simulation Timeline</h4>
                <ol className="relative space-y-3 border-l border-border/40 pl-5">
                  {[
                    {
                      t: "00:00",
                      kind: "info" as const,
                      text: `Simulation started — origin ${selected.triggerNode}`,
                    },
                    {
                      t: "00:02",
                      kind: "fail" as const,
                      text: `${selected.trigger} system: FAILED`,
                    },
                    ...selected.failedSystems
                      .filter((s) => s !== selected.trigger)
                      .map((s, i) => ({
                        t: `00:${String((i + 1) * 2 + 2).padStart(2, "0")}`,
                        kind: "fail" as const,
                        text: `Cascade reached ${s}`,
                      })),
                    ...selected.mitigations.map((m, i) => ({
                      t: `00:${String((i + 1) * 3 + 8).padStart(2, "0")}`,
                      kind: "ok" as const,
                      text: `Mitigation applied: ${m}`,
                    })),
                    {
                      t: selected.recovery,
                      kind: "ok" as const,
                      text: "All systems restored",
                    },
                  ].map((step, i) => {
                    const Icon =
                      step.kind === "fail"
                        ? XCircle
                        : step.kind === "ok"
                        ? CheckCircle2
                        : AlertCircle;
                    const color =
                      step.kind === "fail"
                        ? "text-destructive"
                        : step.kind === "ok"
                        ? "text-success"
                        : "text-primary";
                    return (
                      <li key={i} className="relative">
                        <span
                          className={cn(
                            "absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-card",
                            color,
                          )}
                        >
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                            [{step.t}]
                          </span>
                          <span className={cn("text-xs", color)}>{step.text}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Mitigation actions */}
              <div className="mt-6">
                <h4 className="mb-2 text-sm font-semibold">Mitigation Actions</h4>
                {selected.mitigations.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground">
                    No mitigation strategies applied.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {selected.mitigations.map((m, i) => (
                      <li
                        key={m}
                        className="flex items-center justify-between rounded-md border border-success/30 bg-success/5 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          <span className="font-medium">{m}</span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          [00:{String((i + 1) * 3 + 8).padStart(2, "0")}]
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 flex gap-2 pb-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => exportOne(selected)}
                >
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button className="flex-1 gap-2">
                  <RotateCw className="h-4 w-4" /> Re-run Simulation
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
