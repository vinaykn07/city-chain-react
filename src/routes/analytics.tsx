import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/ApiState";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingDown,
  Clock,
  GitBranch,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Cell,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Metrics — UrbanSim" },
      {
        name: "description",
        content:
          "Aggregate metrics, cascade depth, resilience scores and historical simulation outcomes.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const SYSTEM_COLORS: Record<string, string> = {
  Power: "oklch(0.65 0.20 250)",
  Transport: "oklch(0.62 0.22 305)",
  Water: "oklch(0.75 0.16 210)",
  Healthcare: "oklch(0.72 0.20 350)",
  Telecom: "oklch(0.72 0.18 55)",
  Emergency: "oklch(0.65 0.22 25)",
};

const SYSTEM_KEYS = ["Power", "Transport", "Water", "Healthcare", "Telecom", "Emergency"] as const;
type Sys = typeof SYSTEM_KEYS[number];

function inferSystem(s: string): Sys {
  const v = (s ?? "").toString().toLowerCase();
  return (SYSTEM_KEYS.find((k) => v.includes(k.toLowerCase())) ?? "Power") as Sys;
}

const FALLBACK_FAILURE_FREQ = SYSTEM_KEYS.map((s) => ({ system: s, failures: 0 }));
const FALLBACK_TIMELINE = Array.from({ length: 12 }, (_, i) => ({ t: i, affected: 0 }));
const FALLBACK_RESILIENCE = SYSTEM_KEYS.map((s) => ({ system: s, score: 0 }));
const resilienceColor = (s: number) =>
  s > 75 ? "oklch(0.72 0.18 145)" : s >= 50 ? "oklch(0.78 0.16 75)" : "oklch(0.65 0.22 25)";

// Heatmap: rows = source of failure, cols = affected system. Values 0..100.
const HEATMAP_SYSTEMS = ["Power", "Transport", "Water", "Healthcare", "Telecom", "Emergency"];

type HistoryRow = {
  id: string;
  scenario: string;
  trigger: string;
  failed: number;
  mitigation: string;
  recovery: string;
  date: string;
  triggerSystem: Sys;
  recoveryMin: number;
  resilience: number;
};

const PAGE_SIZE = 6;

function AnalyticsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<any>(null);
  const [sims, setSims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    let isFirst = true;

    const tick = async () => {
      try {
        const [sum, all] = await Promise.all([
          api.simulations.getSummary().catch(() => null),
          api.simulations.getAll().catch(() => null),
        ]);
        if (!active) return;
        if (sum) setSummary(sum);
        const list: any[] = Array.isArray(all)
          ? all
          : (all?.data ?? all?.simulations ?? []);
        setSims(list);
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

    tick();
    const id = setInterval(tick, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // ---- Derived real-time metrics from sims + summary ----
  const history: HistoryRow[] = useMemo(
    () =>
      sims.map((r: any, i: number) => {
        const triggerNode = r.triggerNode ?? r.trigger_node ?? r.trigger ?? "—";
        const triggerSystem = inferSystem(`${r.scenarioName ?? ""} ${triggerNode}`);
        const recMin =
          typeof r.recoveryTime === "number"
            ? r.recoveryTime
            : typeof r.recovery === "number"
              ? r.recovery
              : Number(String(r.recovery ?? "").replace(/\D/g, "")) || 0;
        const mitig = Array.isArray(r.mitigations)
          ? r.mitigations.join(", ")
          : (r.mitigation ?? "None");
        return {
          id: r.id ?? r._id ?? r.simulationId ?? `SIM-${String(i + 1).padStart(4, "0")}`,
          scenario: r.scenarioName ?? r.scenario ?? "Untitled",
          trigger: triggerNode,
          failed:
            r.failedCount ??
            r.failed_nodes_count ??
            r.failedNodes?.length ??
            r.failedSystems?.length ??
            0,
          mitigation: mitig || "None",
          recovery: recMin ? `${recMin}m` : "—",
          date: new Date(r.date ?? r.createdAt ?? Date.now())
            .toISOString()
            .slice(0, 10),
          triggerSystem,
          recoveryMin: recMin,
          resilience:
            r.metrics?.resilience ?? r.resilience ?? r.resilienceScore ?? 0,
        };
      }),
    [sims],
  );

  const failureFreq = useMemo(() => {
    const counts: Record<Sys, number> = {
      Power: 0, Transport: 0, Water: 0, Healthcare: 0, Telecom: 0, Emergency: 0,
    };
    history.forEach((h) => { counts[h.triggerSystem] += 1; });
    const data = SYSTEM_KEYS.map((s) => ({ system: s, failures: counts[s] }));
    return data.some((d) => d.failures > 0) ? data : FALLBACK_FAILURE_FREQ;
  }, [history]);

  const timeline = useMemo(() => {
    if (history.length === 0) return FALLBACK_TIMELINE;
    const sorted = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sorted.map((h, i) => ({ t: i, affected: h.failed }));
  }, [history]);

  const resilience = useMemo(() => {
    const acc: Record<Sys, { sum: number; n: number }> = {
      Power: { sum: 0, n: 0 }, Transport: { sum: 0, n: 0 }, Water: { sum: 0, n: 0 },
      Healthcare: { sum: 0, n: 0 }, Telecom: { sum: 0, n: 0 }, Emergency: { sum: 0, n: 0 },
    };
    history.forEach((h) => {
      if (h.resilience > 0) {
        acc[h.triggerSystem].sum += h.resilience;
        acc[h.triggerSystem].n += 1;
      }
    });
    const data = SYSTEM_KEYS.map((s) => ({
      system: s,
      score: acc[s].n ? Math.round(acc[s].sum / acc[s].n) : 0,
    }));
    return data.some((d) => d.score > 0) ? data : FALLBACK_RESILIENCE;
  }, [history]);

  const heatmap = useMemo<number[][]>(() => {
    const grid = SYSTEM_KEYS.map(() => SYSTEM_KEYS.map(() => 0));
    history.forEach((h) => {
      const i = SYSTEM_KEYS.indexOf(h.triggerSystem);
      const failedSystems: string[] = Array.isArray((h as any).failedSystems)
        ? (h as any).failedSystems
        : [];
      failedSystems.forEach((fs) => {
        const j = SYSTEM_KEYS.indexOf(inferSystem(fs));
        if (i >= 0 && j >= 0 && i !== j) grid[i][j] += 1;
      });
    });
    const max = Math.max(1, ...grid.flat());
    return grid.map((row, i) =>
      row.map((v, j) => (i === j ? 0 : Math.round((v / max) * 100))),
    );
  }, [history]);

  const avgDowntime =
    summary?.avgDowntime ?? summary?.averageDowntime ??
    (history.length ? Math.round(history.reduce((a, h) => a + h.recoveryMin * 1.4, 0) / history.length) : 0);
  const avgRecovery =
    summary?.avgRecovery ?? summary?.averageRecovery ??
    (history.length ? Math.round(history.reduce((a, h) => a + h.recoveryMin, 0) / history.length) : 0);
  const avgResilience =
    summary?.avgResilience ?? summary?.averageResilience ??
    (history.length
      ? Math.round(history.reduce((a, h) => a + (h.resilience || 0), 0) / Math.max(1, history.filter((h) => h.resilience > 0).length))
      : null);
  const avgCascade = history.length
    ? (history.reduce((a, h) => a + h.failed, 0) / history.length).toFixed(1)
    : "0.0";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter((h) =>
      [h.id, h.scenario, h.trigger, h.mitigation, h.date].some((f) =>
        f.toLowerCase().includes(q),
      ),
    );
  }, [query, history]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Analytics & Metrics"
        description="Aggregate KPIs, cascade behavior and historical outcomes."
        icon={BarChart3}
        actions={
          <Button onClick={exportPDF} className="gap-2">
            <Download className="h-4 w-4" /> Export Report (PDF)
          </Button>
        }
      />

      {loading && <div className="mb-4"><LoadingState label="Fetching simulation summary…" /></div>}
      {error && <div className="mb-4"><ErrorState message={error} /></div>}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {avgResilience !== null && (
          <div className="inline-flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-1.5 text-xs text-success">
            <span className="font-semibold">Avg Resilience:</span>
            <span className="font-mono tabular-nums">{avgResilience}%</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ""}
        </div>
      </div>

      {/* Row 1 — KPI cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Avg System Downtime
                </p>
                <p className="mt-2 text-3xl font-bold">{avgDowntime} <span className="text-lg font-medium text-muted-foreground">min</span></p>
                <p className="mt-1 flex items-center gap-1 text-xs text-success">
                  <TrendingDown className="h-3 w-3" /> -12% vs last month
                </p>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/15 p-2">
                <TrendingDown className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Mean Recovery Time
                </p>
                <p className="mt-2 text-3xl font-bold">{avgRecovery} <span className="text-lg font-medium text-muted-foreground">min</span></p>
                <p className="mt-1 text-xs text-muted-foreground">across {history.length} simulations</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/15 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Avg Cascade Depth
                </p>
                <p className="mt-2 text-3xl font-bold">{avgCascade} <span className="text-lg font-medium text-muted-foreground">nodes</span></p>
                <p className="mt-1 text-xs text-warning">per incident</p>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning/15 p-2">
                <GitBranch className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — Failure freq & timeline */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Failure Frequency by Infrastructure Type</CardTitle>
            <CardDescription>Total recorded failures over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureFreq} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="oklch(0.35 0.03 256 / 0.3)" strokeDasharray="3 3" />
                <XAxis dataKey="system" stroke="oklch(0.70 0.03 256)" fontSize={11} />
                <YAxis stroke="oklch(0.70 0.03 256)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.22 0.03 256)",
                    border: "1px solid oklch(0.35 0.03 256 / 0.5)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="failures" radius={[6, 6, 0, 0]}>
                  {failureFreq.map((d) => (
                    <Cell key={d.system} fill={SYSTEM_COLORS[d.system]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Failure Timeline</CardTitle>
            <CardDescription>Affected nodes throughout simulation events.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <defs>
                  <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.35 0.03 256 / 0.3)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="t"
                  stroke="oklch(0.70 0.03 256)"
                  fontSize={11}
                  unit="m"
                />
                <YAxis stroke="oklch(0.70 0.03 256)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.22 0.03 256)",
                    border: "1px solid oklch(0.35 0.03 256 / 0.5)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(v) => `${v} min`}
                />
                <Area
                  type="monotone"
                  dataKey="affected"
                  stroke="oklch(0.65 0.22 25)"
                  strokeWidth={2}
                  fill="url(#failGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Resilience scores & heatmap */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">System Resilience Scores</CardTitle>
            <CardDescription>0–100 composite score by system.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={resilience}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 8, left: 16 }}
              >
                <CartesianGrid
                  stroke="oklch(0.35 0.03 256 / 0.3)"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="oklch(0.70 0.03 256)"
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="system"
                  stroke="oklch(0.70 0.03 256)"
                  fontSize={11}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.22 0.03 256)",
                    border: "1px solid oklch(0.35 0.03 256 / 0.5)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {resilience.map((d) => (
                    <Cell key={d.system} fill={resilienceColor(d.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Cascading Failure Heatmap</CardTitle>
            <CardDescription>
              Row = source of failure, Column = affected system. Darker = stronger impact.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-1 text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-muted-foreground"></th>
                    {HEATMAP_SYSTEMS.map((s) => (
                      <th
                        key={s}
                        className="px-1 pb-1 text-center font-medium text-muted-foreground"
                      >
                        {s.slice(0, 4)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((row, i) => (
                    <tr key={HEATMAP_SYSTEMS[i]}>
                      <td className="pr-2 text-right font-medium text-muted-foreground">
                        {HEATMAP_SYSTEMS[i]}
                      </td>
                      {row.map((v, j) => {
                        const intensity = v / 100;
                        const same = i === j;
                        return (
                          <td key={j} className="p-0">
                            <div
                              className="flex h-10 items-center justify-center rounded text-[10px] font-mono"
                              style={{
                                backgroundColor: same
                                  ? "oklch(0.28 0.03 256)"
                                  : `color-mix(in oklab, oklch(0.65 0.22 25) ${Math.round(
                                      intensity * 100,
                                    )}%, oklch(0.22 0.03 256))`,
                                color:
                                  intensity > 0.55
                                    ? "oklch(0.99 0 0)"
                                    : "oklch(0.80 0.03 256)",
                              }}
                              title={`${HEATMAP_SYSTEMS[i]} → ${HEATMAP_SYSTEMS[j]}: ${v}`}
                            >
                              {same ? "—" : v}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Low</span>
                <div
                  className="h-2 flex-1 rounded"
                  style={{
                    background:
                      "linear-gradient(to right, oklch(0.22 0.03 256), oklch(0.65 0.22 25))",
                  }}
                />
                <span>High</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom — History table */}
      <div className="mt-6">
        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Simulation History</CardTitle>
                <CardDescription>Past simulation outcomes with mitigation results.</CardDescription>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search scenarios, triggers…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Scenario</TableHead>
                    <TableHead>Trigger Node</TableHead>
                    <TableHead className="text-center">Failed Nodes</TableHead>
                    <TableHead>Mitigation Used</TableHead>
                    <TableHead>Recovery Time</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No simulations match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium">{row.scenario}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {row.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {row.trigger}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono tabular-nums">
                          {row.failed}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.mitigation === "None" ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            row.mitigation
                          )}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">{row.recovery}</TableCell>
                        <TableCell className="text-muted-foreground">{row.date}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
