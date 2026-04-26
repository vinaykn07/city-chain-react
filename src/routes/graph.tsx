import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Zap, Droplets, Wifi, Bus } from "lucide-react";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Infrastructure Graph — UrbanSim" },
      { name: "description", content: "Interactive dependency graph of every monitored urban infrastructure node." },
    ],
  }),
  component: GraphPage,
});

type Node = { id: string; x: number; y: number; type: "power" | "water" | "telecom" | "transit"; status: "ok" | "warn" | "fail" };
const nodes: Node[] = [
  { id: "PWR-1", x: 15, y: 20, type: "power", status: "ok" },
  { id: "PWR-2", x: 40, y: 15, type: "power", status: "warn" },
  { id: "PWR-3", x: 75, y: 25, type: "power", status: "ok" },
  { id: "WTR-1", x: 25, y: 55, type: "water", status: "ok" },
  { id: "WTR-2", x: 60, y: 60, type: "water", status: "fail" },
  { id: "TEL-1", x: 50, y: 40, type: "telecom", status: "ok" },
  { id: "TEL-2", x: 85, y: 50, type: "telecom", status: "ok" },
  { id: "TRN-1", x: 30, y: 80, type: "transit", status: "ok" },
  { id: "TRN-2", x: 70, y: 85, type: "transit", status: "warn" },
];
const edges: [string, string][] = [
  ["PWR-1", "PWR-2"], ["PWR-2", "PWR-3"], ["PWR-2", "TEL-1"],
  ["PWR-3", "TEL-2"], ["PWR-1", "WTR-1"], ["PWR-3", "WTR-2"],
  ["TEL-1", "WTR-1"], ["TEL-2", "WTR-2"], ["WTR-1", "TRN-1"],
  ["TEL-1", "TRN-1"], ["TEL-2", "TRN-2"], ["WTR-2", "TRN-2"],
];

const typeColor = {
  power: "warning",
  water: "primary",
  telecom: "chart-5",
  transit: "success",
} as const;

const statusColor = {
  ok: "oklch(0.72 0.18 145)",
  warn: "oklch(0.78 0.16 75)",
  fail: "oklch(0.65 0.22 25)",
};

function GraphPage() {
  const find = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Infrastructure Graph"
        description="Dependency topology across every connected city subsystem."
        icon={Network}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="glass border-border/50">
          <CardContent className="p-2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg grid-bg">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                {edges.map(([a, b], i) => {
                  const na = find(a);
                  const nb = find(b);
                  return (
                    <line
                      key={i}
                      x1={na.x}
                      y1={na.y}
                      x2={nb.x}
                      y2={nb.y}
                      stroke="oklch(0.62 0.20 256 / 0.4)"
                      strokeWidth={0.3}
                      strokeDasharray="0.8 0.4"
                    />
                  );
                })}
              </svg>
              {nodes.map((n) => (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 backdrop-blur-md transition-transform hover:scale-110"
                    style={{
                      borderColor: statusColor[n.status],
                      background: `color-mix(in oklab, ${statusColor[n.status]} 20%, transparent)`,
                      boxShadow: `0 0 20px ${statusColor[n.status]}`,
                    }}
                  >
                    {n.type === "power" && <Zap className="h-4 w-4" />}
                    {n.type === "water" && <Droplets className="h-4 w-4" />}
                    {n.type === "telecom" && <Wifi className="h-4 w-4" />}
                    {n.type === "transit" && <Bus className="h-4 w-4" />}
                  </div>
                  <p className="mt-1 text-center text-[9px] font-mono text-muted-foreground">
                    {n.id}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass border-border/50">
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Legend
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Operational", color: "success" },
                  { label: "Degraded", color: "warning" },
                  { label: "Failed", color: "destructive" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full bg-${l.color} shadow-[0_0_10px_currentColor] text-${l.color}`} />
                    <span className="text-sm">{l.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Node Types
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Power", icon: Zap },
                  { label: "Water", icon: Droplets },
                  { label: "Telecom", icon: Wifi },
                  { label: "Transit", icon: Bus },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <div className="rounded-md border border-border bg-secondary/50 p-1.5">
                      <t.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{t.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Nodes</span><span className="font-mono">{nodes.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Edges</span><span className="font-mono">{edges.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Failures</span><Badge className="bg-destructive/20 text-destructive border-destructive/30">1</Badge></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
