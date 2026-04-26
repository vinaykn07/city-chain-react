import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Search, Eye, Trash2 } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Simulation History — UrbanSim" },
      { name: "description", content: "Past simulation runs with outcomes, propagation depth, and recovery time." },
    ],
  }),
  component: HistoryPage,
});

const runs = [
  { id: "SIM-248", name: "Heatwave cascade — Sector 4", date: "Apr 25, 14:02", duration: "32m", nodes: 18, status: "Completed", severity: "high" },
  { id: "SIM-247", name: "DDoS on Telecom hub TEL-2", date: "Apr 25, 09:11", duration: "12m", nodes: 7, status: "Completed", severity: "medium" },
  { id: "SIM-246", name: "Pump WTR-2 mechanical fail", date: "Apr 24, 22:48", duration: "47m", nodes: 22, status: "Completed", severity: "critical" },
  { id: "SIM-245", name: "Substation PWR-3 overload", date: "Apr 24, 16:30", duration: "8m", nodes: 4, status: "Aborted", severity: "low" },
  { id: "SIM-244", name: "Coordinated cyber attack", date: "Apr 24, 11:15", duration: "1h 12m", nodes: 35, status: "Completed", severity: "critical" },
  { id: "SIM-243", name: "Winter storm propagation", date: "Apr 23, 19:00", duration: "55m", nodes: 28, status: "Completed", severity: "high" },
];

const sevColor = (s: string) =>
  s === "critical" ? "destructive" : s === "high" ? "warning" : s === "medium" ? "primary" : "success";

function HistoryPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Simulation History"
        description="Replay past runs and analyze how each scenario unfolded."
        icon={History}
      />

      <Card className="glass border-border/50">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by ID or scenario..." className="pl-9 bg-secondary/50 border-border" />
            </div>
            <Badge variant="outline" className="border-border ml-auto">{runs.length} runs</Badge>
          </div>

          <div className="divide-y divide-border">
            {runs.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`h-2 w-2 rounded-full bg-${sevColor(r.severity)} pulse-dot text-${sevColor(r.severity)}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                      <Badge variant="outline" className={`border-${sevColor(r.severity)}/40 text-${sevColor(r.severity)} bg-${sevColor(r.severity)}/10 capitalize text-[10px]`}>
                        {r.severity}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate font-medium">{r.name}</p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Date</p>
                    <p className="font-mono">{r.date}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Duration</p>
                    <p className="font-mono">{r.duration}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Nodes</p>
                    <p className="font-mono">{r.nodes}</p>
                  </div>
                  <Badge variant="outline" className={r.status === "Aborted" ? "border-warning/40 text-warning" : "border-success/40 text-success"}>
                    {r.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
