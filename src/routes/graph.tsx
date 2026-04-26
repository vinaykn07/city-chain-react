import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Network,
  Zap,
  Droplets,
  Wifi,
  Heart,
  Siren,
  TrafficCone,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Infrastructure Graph — UrbanSim" },
      {
        name: "description",
        content:
          "Interactive dependency graph of every monitored urban infrastructure node.",
      },
    ],
  }),
  component: GraphPage,
});

type Status = "operational" | "degraded" | "failed";
type SystemKey = "power" | "transport" | "water" | "healthcare" | "telecom" | "emergency";

type GraphNode = {
  id: string;
  code: string;
  name: string;
  system: SystemKey;
  icon: LucideIcon;
  /** color token (semantic) used for the node accent */
  accent: string;
  /** position in the 1000x600 SVG viewBox */
  x: number;
  y: number;
  status: Status;
  resilience: number;
  recovery: string;
};

const NODES: GraphNode[] = [
  {
    id: "pg",
    code: "PG",
    name: "Power Grid",
    system: "power",
    icon: Zap,
    accent: "node-power",
    x: 500,
    y: 90,
    status: "operational",
    resilience: 0.92,
    recovery: "8 minutes",
  },
  {
    id: "tn",
    code: "TN",
    name: "Transportation",
    system: "transport",
    icon: TrafficCone,
    accent: "node-transport",
    x: 160,
    y: 280,
    status: "degraded",
    resilience: 0.58,
    recovery: "22 minutes",
  },
  {
    id: "ws",
    code: "WS",
    name: "Water Supply",
    system: "water",
    icon: Droplets,
    accent: "node-water",
    x: 360,
    y: 300,
    status: "operational",
    resilience: 0.88,
    recovery: "10 minutes",
  },
  {
    id: "hc",
    code: "HC",
    name: "Healthcare",
    system: "healthcare",
    icon: Heart,
    accent: "node-health",
    x: 640,
    y: 300,
    status: "failed",
    resilience: 0.14,
    recovery: "45 minutes",
  },
  {
    id: "tc",
    code: "TC",
    name: "Telecom",
    system: "telecom",
    icon: Wifi,
    accent: "node-telecom",
    x: 840,
    y: 280,
    status: "operational",
    resilience: 0.81,
    recovery: "9 minutes",
  },
  {
    id: "er",
    code: "ER",
    name: "Emergency Response",
    system: "emergency",
    icon: Siren,
    accent: "node-emergency",
    x: 500,
    y: 500,
    status: "degraded",
    resilience: 0.47,
    recovery: "18 minutes",
  },
];

type Edge = { from: string; to: string };
const EDGES: Edge[] = [
  { from: "pg", to: "tn" },
  { from: "pg", to: "ws" },
  { from: "pg", to: "hc" },
  { from: "pg", to: "tc" },
  { from: "pg", to: "er" },
  { from: "tc", to: "er" },
  { from: "tc", to: "hc" },
  { from: "tn", to: "er" },
];

const FILTERS: { key: SystemKey | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "power", label: "Power" },
  { key: "transport", label: "Transport" },
  { key: "water", label: "Water" },
  { key: "healthcare", label: "Healthcare" },
  { key: "telecom", label: "Telecom" },
  { key: "emergency", label: "Emergency" },
];

const STATUS_META: Record<Status, { label: string; text: string; ring: string; dot: string }> = {
  operational: {
    label: "Operational",
    text: "text-success",
    ring: "border-success/50",
    dot: "bg-success",
  },
  degraded: {
    label: "Degraded",
    text: "text-warning",
    ring: "border-warning/50",
    dot: "bg-warning",
  },
  failed: {
    label: "Failed",
    text: "text-destructive",
    ring: "border-destructive/60",
    dot: "bg-destructive",
  },
};

function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>(NODES);
  const [filter, setFilter] = useState<SystemKey | "all">("all");
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const onNodePointerDown = (e: React.PointerEvent<SVGGElement>, n: GraphNode) => {
    e.stopPropagation();
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
    const p = toSvgPoint(e.clientX, e.clientY);
    dragRef.current = { id: n.id, offsetX: p.x - n.x, offsetY: p.y - n.y };
  };

  const onNodePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!dragRef.current) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    const { id, offsetX, offsetY } = dragRef.current;
    const nx = Math.max(50, Math.min(950, p.x - offsetX));
    const ny = Math.max(50, Math.min(550, p.y - offsetY));
    setNodes((prev) => prev.map((nn) => (nn.id === id ? { ...nn, x: nx, y: ny } : nn)));
  };

  const onNodePointerUp = (e: React.PointerEvent<SVGGElement>, n: GraphNode) => {
    const wasDrag = dragRef.current && (Math.abs(n.x - (NODES.find(o => o.id === n.id)?.x ?? n.x)) > 0.1);
    dragRef.current = null;
    try { (e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId); } catch {}
    // treat as click if pointer barely moved — use simple selection regardless
    if (!wasDrag) setSelectedId(n.id);
  };


  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const visibleNodeIds = useMemo(() => {
    if (filter === "all") return new Set(nodes.map((n) => n.id));
    return new Set(nodes.filter((n) => n.system === filter).map((n) => n.id));
  }, [nodes, filter]);

  const dependents = useMemo(() => {
    if (!selected) return [];
    return EDGES.filter((e) => e.from === selected.id)
      .map((e) => nodes.find((n) => n.id === e.to)!)
      .filter(Boolean);
  }, [selected, nodes]);

  const updateStatus = (id: string, status: Status) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              status,
              resilience: status === "failed" ? 0.1 : status === "degraded" ? 0.5 : 0.9,
            }
          : n,
      ),
    );
  };

  const resetLayout = () => {
    setNodes(NODES);
    setZoom(1);
    setFilter("all");
    setSelectedId(null);
  };

  // Pre-compute edge styles based on endpoint statuses
  const edgeRender = EDGES.map((e, i) => {
    const a = nodes.find((n) => n.id === e.from)!;
    const b = nodes.find((n) => n.id === e.to)!;
    const failed = a.status === "failed" || b.status === "failed";
    const visible = visibleNodeIds.has(a.id) && visibleNodeIds.has(b.id);
    return { ...e, a, b, failed, visible, key: `${e.from}-${e.to}-${i}` };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Infrastructure Graph"
        description="Interactive dependency map of monitored urban systems and their cascade paths."
        icon={Network}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 rounded-md border border-border/50 bg-card/40 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={resetLayout}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Layout
          </Button>
          <div className="flex items-center gap-1 rounded-md border border-border/50 bg-card/40 p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Graph canvas */}
        <Card className="glass relative overflow-hidden border-border/50">
          <CardContent className="p-0">
            <div className="relative h-[560px] w-full overflow-hidden">
              <svg
                viewBox="0 0 1000 600"
                className="h-full w-full"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s ease",
                }}
              >
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="oklch(0.70 0.03 256)" />
                  </marker>
                  <marker
                    id="arrow-fail"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="oklch(0.65 0.22 25)" />
                  </marker>
                </defs>

                {/* Edges */}
                {edgeRender.map((e) => {
                  if (!e.visible) return null;
                  const stroke = e.failed
                    ? "oklch(0.65 0.22 25)"
                    : "oklch(0.70 0.03 256 / 0.6)";
                  const marker = e.failed ? "url(#arrow-fail)" : "url(#arrow)";
                  // Shorten line so arrowhead doesn't overlap node circle (r=44)
                  const dx = e.b.x - e.a.x;
                  const dy = e.b.y - e.a.y;
                  const len = Math.hypot(dx, dy) || 1;
                  const ux = dx / len;
                  const uy = dy / len;
                  const x1 = e.a.x + ux * 46;
                  const y1 = e.a.y + uy * 46;
                  const x2 = e.b.x - ux * 50;
                  const y2 = e.b.y - uy * 50;
                  return (
                    <g key={e.key}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={stroke}
                        strokeWidth={e.failed ? 2.5 : 1.8}
                        strokeDasharray="6 6"
                        markerEnd={marker}
                        className="edge-flow"
                      />
                      {/* Flowing dot */}
                      <circle r="3" fill={stroke}>
                        <animateMotion
                          dur={e.failed ? "1.2s" : "2.4s"}
                          repeatCount="indefinite"
                          path={`M ${x1} ${y1} L ${x2} ${y2}`}
                        />
                      </circle>
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((n) => {
                  if (!visibleNodeIds.has(n.id)) return null;
                  const isFailed = n.status === "failed";
                  const isDegraded = n.status === "degraded";
                  const isSelected = selectedId === n.id;
                  const ringColor = isFailed
                    ? "oklch(0.65 0.22 25)"
                    : isDegraded
                    ? "oklch(0.78 0.16 75)"
                    : `var(--${n.accent})`;
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x}, ${n.y})`}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(n.id)}
                      style={{
                        opacity: isDegraded ? 0.85 : 1,
                        filter: isFailed
                          ? "drop-shadow(0 0 12px oklch(0.65 0.22 25 / 0.7))"
                          : isSelected
                          ? `drop-shadow(0 0 10px ${ringColor})`
                          : "none",
                      }}
                    >
                      <circle
                        r="44"
                        fill="oklch(0.22 0.03 256)"
                        stroke={ringColor}
                        strokeWidth={isSelected ? 3.5 : 2.5}
                        className={isFailed ? "node-fail-blink" : ""}
                      />
                      <circle
                        r="44"
                        fill={`color-mix(in oklab, ${ringColor} 12%, transparent)`}
                      />
                      <foreignObject x="-18" y="-22" width="36" height="36">
                        <div className="flex h-full w-full items-center justify-center">
                          <n.icon
                            className="h-5 w-5"
                            style={{ color: ringColor }}
                          />
                        </div>
                      </foreignObject>
                      <text
                        textAnchor="middle"
                        y="14"
                        className="fill-foreground"
                        fontSize="11"
                        fontWeight="700"
                      >
                        {n.code}
                      </text>
                      <text
                        textAnchor="middle"
                        y="62"
                        fontSize="11"
                        className="fill-muted-foreground"
                      >
                        {n.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Legend bottom-left */}
              <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md border border-border/50 bg-card/80 px-3 py-2 backdrop-blur">
                {(["operational", "degraded", "failed"] as Status[]).map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${STATUS_META[s].dot} ${
                        s === "failed" ? "pulse-dot" : ""
                      }`}
                    />
                    <span className={`text-[11px] ${STATUS_META[s].text}`}>
                      {STATUS_META[s].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right panel */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            {!selected ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                <Network className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium">No node selected</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click any node in the graph to inspect its dependencies and
                  status.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {selected.code} · Node
                    </p>
                    <h3 className="mt-0.5 text-lg font-semibold">{selected.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Close panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <Badge
                    variant="outline"
                    className={`${STATUS_META[selected.status].ring} ${STATUS_META[selected.status].text} bg-transparent`}
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${STATUS_META[selected.status].dot} ${
                        selected.status === "failed" ? "pulse-dot" : ""
                      }`}
                    />
                    {STATUS_META[selected.status].label}
                  </Badge>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Resilience Weight</span>
                    <span className="font-mono tabular-nums">
                      {selected.resilience.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all ${
                        selected.status === "failed"
                          ? "bg-destructive"
                          : selected.status === "degraded"
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                      style={{ width: `${selected.resilience * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-md border border-border/40 bg-card/40 p-3">
                  <p className="text-xs text-muted-foreground">Recovery Time</p>
                  <p className="mt-1 font-semibold">{selected.recovery}</p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    Dependent Nodes ({dependents.length})
                  </p>
                  {dependents.length === 0 ? (
                    <p className="text-xs italic text-muted-foreground">
                      No downstream dependencies.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {dependents.map((d) => (
                        <li
                          key={d.id}
                          className="flex items-center justify-between rounded-md border border-border/40 bg-card/40 px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <d.icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">{d.name}</span>
                          </div>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${STATUS_META[d.status].dot}`}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => updateStatus(selected.id, "failed")}
                    disabled={selected.status === "failed"}
                  >
                    <ShieldAlert className="h-4 w-4" /> Trigger Failure
                  </Button>
                  <Button
                    className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => updateStatus(selected.id, "operational")}
                    disabled={selected.status === "operational"}
                  >
                    <ShieldCheck className="h-4 w-4" /> Mark as Restored
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
